import { createReadStream } from 'fs';
import { FileObject, FileObjectsPage } from 'openai/resources';
import { Uploadable } from 'openai/uploads';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFileVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';

export default class GPTAssistantAPIServerSyncFilesController {

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_file_to_openai(vo: GPTAssistantAPIFileVO): Promise<FileObject> {
        try {

            if (!vo) {
                throw new Error('No file_vo provided');
            }

            let gpt_obj: FileObject = vo.gpt_file_id ? await ModuleGPTServer.openai.files.retrieve(vo.gpt_file_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing file to OpenAI : file is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_file_to_openai: Creating file in OpenAI : ' + vo.filename);
                }

                gpt_obj = await ModuleGPTServer.openai.files.create({

                    file: createReadStream(vo.filename) as unknown as Uploadable,
                    purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                });

                if (!gpt_obj) {
                    throw new Error('Error while creating file in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncFilesController.file_has_diff(vo, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_file_to_openai: Updating file in OpenAI : ' + vo.filename);
                    }

                    // On doit mettre à jour mais en l'occurence il n'y a pas de méthode update pour les fichiers
                    // donc on supprime et on recrée
                    await ModuleGPTServer.openai.files.del(gpt_obj.id);

                    gpt_obj = await ModuleGPTServer.openai.files.create({

                        file: createReadStream(vo.filename) as unknown as Uploadable,
                        purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                    });

                    if (!gpt_obj) {
                        throw new Error('Error while creating file in OpenAI');
                    }
                }
            }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncFilesController.file_has_diff(vo, gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_file_to_openai: Updating file in Osélia : ' + vo.filename);
                }

                vo.gpt_file_id = gpt_obj.id;
                vo.created_at = gpt_obj.created_at;
                vo.bytes = gpt_obj.bytes;
                vo.filename = gpt_obj.filename;
                vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose];
                vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            throw error;
        }
    }

    /**
     * On récupère tous les fichiers de l'API GPT et on les synchronise avec Osélia
     *  Ce qui signifie créer dans Osélia les Files de GPT qui n'existent pas encore
     *  Archiver les fichiers d'Osélia qui n'existent plus dans GPT (et pas encore archivés dans Osélia)
     */
    public static async get_file_or_sync(gpt_file_id: string): Promise<GPTAssistantAPIFileVO> {
        let file = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_file_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFileVO>();
        if (!file) {
            ConsoleHandler.warn('File not found : ' + gpt_file_id + ' - Syncing FileObjects');
            await GPTAssistantAPIServerSyncFilesController.sync_files();
        }

        file = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_file_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFileVO>();
        if (!file) {
            ConsoleHandler.error('File not found : ' + gpt_file_id + ' - Already tried to sync FileObjects - Aborting');
            throw new Error('File not found : ' + gpt_file_id + ' - Already tried to sync FileObjects - Aborting');
        }

        return file;
    }

    /**
     * On récupère tous les files de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_files() {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_files: Syncing files');
        }

        const files: FileObject[] = await GPTAssistantAPIServerSyncFilesController.get_all_files();
        const files_vos: GPTAssistantAPIFileVO[] = await query(GPTAssistantAPIFileVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIFileVO>();
        const files_vos_by_gpt_id: { [gpt_file_id: string]: GPTAssistantAPIFileVO } = {};

        for (const i in files_vos) {
            const file_vo = files_vos[i];
            files_vos_by_gpt_id[file_vo.gpt_file_id] = file_vo;
        }

        for (const i in files) {
            const file = files[i];
            let found_vo: GPTAssistantAPIFileVO = files_vos_by_gpt_id[file.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIFileVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                GPTAssistantAPIServerSyncFilesController.file_has_diff(found_vo, file);

            if (!needs_update) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_files: Updating file in Osélia : ' + file.filename);
            }

            found_vo.gpt_file_id = file.id;
            found_vo.created_at = file.created_at;
            found_vo.bytes = file.bytes;
            found_vo.filename = file.filename;
            found_vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[file.purpose];
            found_vo.archived = false;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }

        // Les files qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_file_id in files_vos_by_gpt_id) {

            if (files_vos_by_gpt_id[gpt_file_id]) {
                continue;
            }

            const found_vo = files_vos_by_gpt_id[gpt_file_id];

            if (found_vo.archived) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_files: Archiving file in Osélia : ' + found_vo.filename);
            }

            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async get_all_files(): Promise<FileObject[]> {

        const res: FileObject[] = [];

        let files_page: FileObjectsPage = await ModuleGPTServer.openai.files.list();

        if (!files_page) {
            return res;
        }

        if (files_page.data && files_page.data.length) {
            res.concat(files_page.data);
        }

        while (files_page.hasNextPage()) {
            files_page = await files_page.getNextPage();
            res.concat(files_page.data);
        }

        return res;
    }

    private static file_has_diff(
        file_vo: GPTAssistantAPIFileVO,
        file_gpt: FileObject): boolean {

        if ((!file_vo) && (!file_gpt)) {
            return false;
        }

        if ((!file_vo) || (!file_gpt)) {
            return true;
        }

        return (file_vo.gpt_file_id != file_gpt.id) ||
            (file_vo.created_at != file_gpt.created_at) ||
            (file_vo.bytes != file_gpt.bytes) ||
            (file_vo.filename != file_gpt.filename) ||
            (file_vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[file_gpt.purpose]);
    }
}
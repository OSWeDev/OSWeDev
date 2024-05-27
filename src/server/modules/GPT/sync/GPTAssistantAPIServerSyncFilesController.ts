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
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';

export default class GPTAssistantAPIServerSyncFilesController {

    /**
     * GPTAssistantAPIFileVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_FileVO(params: DAOUpdateVOHolder<GPTAssistantAPIFileVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncFilesController.push_file_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_FileVO(vo: GPTAssistantAPIFileVO, exec_as_server?: boolean): Promise<boolean> {

        if (vo.gpt_file_id) {
            // Si on a l'id GPT, c'est que la création vient de OpenAI, pas l'inverse. Donc on ne fait rien de plus
            return true;
        }

        try {
            await GPTAssistantAPIServerSyncFilesController.push_file_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_FileVO(vo: GPTAssistantAPIFileVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_file_to_openai(vo: GPTAssistantAPIFileVO, is_trigger_pre_x: boolean = true): Promise<FileObject> {
        try {

            if (!vo) {
                throw new Error('No file_vo provided');
            }

            let gpt_obj: FileObject = vo.gpt_file_id ? await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.files.retrieve, vo.gpt_file_id) : null;

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

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                    throw new Error('Error while pushing file to OpenAI : block_openai_sync_push_to_openai');
                }

                gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                    ModuleGPTServer.openai.files.create,
                    {
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

                    if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                        throw new Error('Error while pushing file to OpenAI : block_openai_sync_push_to_openai');
                    }

                    // On doit mettre à jour mais en l'occurence il n'y a pas de méthode update pour les fichiers
                    // donc on supprime et on recrée
                    await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.files.del, gpt_obj.id);

                    gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.files.create,
                        {
                            file: createReadStream(vo.filename) as unknown as Uploadable,
                            purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                        });

                    if (!gpt_obj) {
                        throw new Error('Error while creating file in OpenAI');
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncFilesController.file_has_diff(vo, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncFilesController.file_has_diff(vo, gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_file_to_openai: Updating file in Osélia : ' + vo.filename);
                }

                GPTAssistantAPIServerSyncFilesController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            throw error;
        }
    }

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

            GPTAssistantAPIServerSyncFilesController.assign_vo_from_gpt(found_vo, file);

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

        let res: FileObject[] = [];

        let files_page: FileObjectsPage = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.files.list);

        if (!files_page) {
            return res;
        }

        if (files_page.data && files_page.data.length) {
            res = res.concat(files_page.data);
        }

        while (files_page.hasNextPage()) {
            files_page = await files_page.getNextPage();
            res = res.concat(files_page.data);
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

        return !(
            GPTAssistantAPIServerSyncController.compare_values(file_vo.gpt_file_id, file_gpt.id) &&
            GPTAssistantAPIServerSyncController.compare_values(file_vo.created_at, file_gpt.created_at) &&
            GPTAssistantAPIServerSyncController.compare_values(file_vo.bytes, file_gpt.bytes) &&
            GPTAssistantAPIServerSyncController.compare_values(file_vo.filename, file_gpt.filename) &&
            GPTAssistantAPIServerSyncController.compare_values(file_vo.purpose, GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[file_gpt.purpose]));
    }

    private static assign_vo_from_gpt(vo: GPTAssistantAPIFileVO, gpt_obj: FileObject) {
        vo.gpt_file_id = gpt_obj.id;
        vo.created_at = gpt_obj.created_at;
        vo.bytes = gpt_obj.bytes;
        vo.filename = gpt_obj.filename;
        vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose];
        vo.archived = false;
    }
}
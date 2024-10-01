import { createReadStream } from 'fs';
import { FileObject, FileObjectsPage } from 'openai/resources';
import { Uploadable } from 'openai/uploads';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import GPTAssistantAPIFileVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import FileServerController from '../../File/FileServerController';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';

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

            let gpt_obj: FileObject = vo.gpt_file_id ? await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.files.retrieve, ModuleGPTServer.openai.files, vo.gpt_file_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing file to OpenAI : file is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            // On charge le file à notre niveau, pour le récupérer si besoin depuis OpenAI
            if (gpt_obj) {
                if (gpt_obj.id) {
                    const gpt_file_vo: GPTAssistantAPIFileVO = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_obj.id)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIFileVO>();

                    if (!gpt_file_vo) {
                        await this.retrieve_file_from_openai(gpt_obj.id);
                    } else {
                        const vo_file: FileVO = await query(FileVO.API_TYPE_ID)
                            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_obj.id, GPTAssistantAPIFileVO.API_TYPE_ID)
                            .exec_as_server()
                            .select_vo<FileVO>();
                        if (!vo_file) {
                            await this.retrieve_file_from_openai(gpt_obj.id);
                        }
                    }
                }
            }

            if (!gpt_obj) {
                // Si il existe pas, on le créer 
                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_file_to_openai: Creating file in OpenAI : ' + vo.filename);
                }

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                    throw new Error('Error while pushing file to OpenAI : block_openai_sync_push_to_openai');
                }

                gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                    ModuleGPTServer.openai.files.create,
                    ModuleGPTServer.openai.files,
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
                    await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.files.del, ModuleGPTServer.openai.files, gpt_obj.id);

                    gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.files.create,
                        ModuleGPTServer.openai.files,
                        {
                            file: createReadStream(vo.filename) as unknown as Uploadable,
                            purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                        }
                    );

                    if (!gpt_obj) {
                        throw new Error('Error while creating file in OpenAI');
                    }
                }
            }

            this.assign_vo_from_gpt(vo, gpt_obj, vo.file_id);


            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncFilesController.file_has_diff(vo, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncFilesController.file_has_diff(vo, gpt_obj) || vo.archived) {

                if (is_trigger_pre_x) {
                    throw new Error('Error while pushing file to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
                }

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_file_to_openai: Updating file in Osélia : ' + vo.filename);
                    await this.retrieve_file_from_openai(gpt_obj.id);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_file_or_sync(gpt_file_id: string, limit_sync_to_gpt_file_id: boolean = true): Promise<GPTAssistantAPIFileVO> {
        let file = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_file_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFileVO>();
        if (!file) {

            if (limit_sync_to_gpt_file_id) {
                ConsoleHandler.warn('File not found : ' + gpt_file_id + ' - Syncing file');
                await this.retrieve_file_from_openai(gpt_file_id);
            } else {
                ConsoleHandler.warn('File not found : ' + gpt_file_id + ' - Syncing FileObjects');
                await GPTAssistantAPIServerSyncFilesController.sync_files();
            }
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
            const found_vo: GPTAssistantAPIFileVO = files_vos_by_gpt_id[file.id];

            if (GPTAssistantAPIServerSyncFilesController.file_has_diff(found_vo, file)) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('sync_files: Updating file in Osélia : ' + file.filename);
                }
                await this.retrieve_file_from_openai(file.id);
            }
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

        let files_page: FileObjectsPage = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.files.list, ModuleGPTServer.openai.files);

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

    private static assign_vo_from_gpt(vo: GPTAssistantAPIFileVO, gpt_obj: FileObject, vo_file_id: number) {
        vo.gpt_file_id = gpt_obj.id;
        vo.created_at = gpt_obj.created_at;
        vo.bytes = gpt_obj.bytes;
        vo.filename = gpt_obj.filename;
        vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose];
        vo.file_id = vo_file_id;
        vo.archived = false;
    }

    private static async retrieve_file_from_openai(gpt_file_id: string): Promise<void> {

        let gpt_file_vo: GPTAssistantAPIFileVO = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_file_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFileVO>();
        const gpt_file_obj = await ModuleGPTServer.openai.files.retrieve(gpt_file_id);
        let file_content: any = await ModuleGPTServer.openai.files.content(gpt_file_id);

        if (typeof file_content === 'object') {
            file_content = Buffer.from(await file_content.arrayBuffer());
        }

        const folder: string = ModuleFile.SECURED_FILES_ROOT + 'gpt';
        const filepath: string = folder + '/' + gpt_file_id;
        let vo_file: FileVO = await query(FileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<FileVO>().path, filepath)
            .exec_as_server()
            .select_vo<FileVO>();

        let needs_update = false;

        if (!gpt_file_vo) {
            gpt_file_vo = new GPTAssistantAPIFileVO();
            gpt_file_vo.archived = false;
            needs_update = true;
        }

        if (!vo_file) {
            vo_file = new FileVO();
            vo_file.is_secured = false; // Pareil ici TODO FIXME voir ce qu'on sécurise et comment sur ces fichiers

            await FileServerController.getInstance().makeSureThisFolderExists(folder);
            FileServerController.getInstance().writeFile(filepath, file_content);
            vo_file.path = filepath;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo_file);
            needs_update = true;
        }

        if (gpt_file_vo.bytes != gpt_file_obj.bytes) {
            gpt_file_vo.bytes = gpt_file_obj.bytes;
            needs_update = true;
        }

        if (gpt_file_vo.created_at != gpt_file_obj.created_at) {
            gpt_file_vo.created_at = gpt_file_obj.created_at;
            needs_update = true;
        }

        if (gpt_file_vo.filename != gpt_file_obj.filename) {
            gpt_file_vo.filename = gpt_file_obj.filename;
            needs_update = true;
        }

        if (gpt_file_vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_file_obj.purpose]) {
            gpt_file_vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_file_obj.purpose];
            needs_update = true;
        }

        if (gpt_file_vo.gpt_file_id != gpt_file_obj.id) {
            gpt_file_vo.gpt_file_id = gpt_file_obj.id;
            needs_update = true;
        }

        if (gpt_file_vo.file_id != vo_file.id) {
            gpt_file_vo.file_id = vo_file.id;
            needs_update = true;
        }

        if (needs_update) {
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(gpt_file_vo);
        }
    }
}
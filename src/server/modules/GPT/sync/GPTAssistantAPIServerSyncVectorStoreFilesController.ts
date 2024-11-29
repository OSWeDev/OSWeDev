import { VectorStoreFile, VectorStoreFilesPage } from 'openai/resources/beta/vector-stores/files';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIVectorStoreFileVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIVectorStoreFileVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerSyncVectorStoresController from './GPTAssistantAPIServerSyncVectorStoresController';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';

export default class GPTAssistantAPIServerSyncVectorStoreFilesController {

    /**
     * GPTAssistantAPIVectorStoreFileVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_VectorStoreFileVO(params: DAOUpdateVOHolder<GPTAssistantAPIVectorStoreFileVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncVectorStoreFilesController.push_vector_store_file_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector store file to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_VectorStoreFileVO(vo: GPTAssistantAPIVectorStoreFileVO, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncVectorStoreFilesController.push_vector_store_file_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector store file to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_VectorStoreFileVO(vo: GPTAssistantAPIVectorStoreFileVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_vector_store_file_to_openai(vo: GPTAssistantAPIVectorStoreFileVO, is_trigger_pre_x: boolean = true): Promise<VectorStoreFile> {
        try {

            if (!vo) {
                throw new Error('No vector_store_file_vo provided');
            }

            let gpt_obj: VectorStoreFile = vo.gpt_file_id ? await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.vectorStores.files.retrieve,
                ModuleGPTServer.openai.beta.vectorStores.files,
                vo.vector_store_gpt_id, vo.gpt_file_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing vector_store_file to OpenAI : vector_store_file is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            const to_openai_last_error = GPTAssistantAPIServerSyncController.to_openai_error(vo.last_error) as VectorStoreFile.LastError;

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_vector_store_file_to_openai: Creating vector_store_file in OpenAI : ' + vo.gpt_file_id + ' - ' + vo.vector_store_gpt_id);
                }

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                    throw new Error('Error while pushing obj to OpenAI : block_openai_sync_push_to_openai :api_type_id:' + vo._type + ':vo_id:' + vo.id);
                }

                gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                    ModuleGPTServer.openai.beta.vectorStores.files.create,
                    ModuleGPTServer.openai.beta.vectorStores.files,
                    vo.vector_store_gpt_id,
                    {
                        file_id: vo.gpt_file_id,
                    });

                if (!gpt_obj) {
                    throw new Error('Error while creating vector_store_file in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncVectorStoreFilesController.vector_store_file_has_diff(vo, to_openai_last_error, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_vector_store_file_to_openai: Updating vector_store_file in OpenAI : ' + vo.gpt_file_id + ' - ' + vo.vector_store_gpt_id);
                    }

                    if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                        throw new Error('Error while pushing obj to OpenAI : block_openai_sync_push_to_openai :api_type_id:' + vo._type + ':vo_id:' + vo.id);
                    }

                    // On doit mettre à jour mais en l'occurence il n'y a pas de méthode update pour les vector store files
                    // donc on supprime et on recrée
                    await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.vectorStores.files.del,
                        ModuleGPTServer.openai.beta.vectorStores.files,
                        vo.vector_store_gpt_id, gpt_obj.id);

                    gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.vectorStores.files.create,
                        ModuleGPTServer.openai.beta.vectorStores.files,
                        vo.vector_store_gpt_id,
                        {
                            file_id: vo.gpt_file_id,
                        });

                    if (!gpt_obj) {
                        throw new Error('Error while creating vector_store_file in OpenAI');
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncVectorStoreFilesController.vector_store_file_has_diff(vo, to_openai_last_error, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncVectorStoreFilesController.vector_store_file_has_diff(vo, to_openai_last_error, gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_vector_store_file_to_openai: Updating vector_store_file in Osélia : ' + vo.gpt_file_id + ' - ' + vo.vector_store_gpt_id);
                }

                await GPTAssistantAPIServerSyncVectorStoreFilesController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(vo);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector_store_file to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_vector_store_file_or_sync(gpt_vector_store_id: string, gpt_id: string): Promise<GPTAssistantAPIVectorStoreFileVO> {
        let vector_store_file = await query(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileVO>().vector_store_gpt_id, gpt_vector_store_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileVO>().gpt_file_id, gpt_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIVectorStoreFileVO>();
        if (!vector_store_file) {
            ConsoleHandler.warn('Vector Store File not found : ' + gpt_id + ' - Syncing VectorStoreFiles');
            await GPTAssistantAPIServerSyncVectorStoreFilesController.sync_vector_store_files(gpt_vector_store_id);
        }

        vector_store_file = await query(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileVO>().vector_store_gpt_id, gpt_vector_store_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileVO>().gpt_file_id, gpt_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIVectorStoreFileVO>();
        if (!vector_store_file) {
            ConsoleHandler.error('Vector Store File not found : ' + gpt_id + ' - Already tried to sync VectorStoreFiles - Aborting');
            throw new Error('Vector Store File not found : ' + gpt_id + ' - Already tried to sync VectorStoreFiles - Aborting');
        }

        return vector_store_file;
    }

    /**
     * On récupère tous les files de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_vector_store_files(gpt_vector_store_id: string) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_vector_store_files');
        }

        const vector_store_files: VectorStoreFile[] = await GPTAssistantAPIServerSyncVectorStoreFilesController.get_all_vector_store_files(gpt_vector_store_id);
        const vector_store_files_vos: GPTAssistantAPIVectorStoreFileVO[] = await query(GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIVectorStoreFileVO>();
        const vector_store_files_vos_by_gpt_id: { [gpt_id: string]: GPTAssistantAPIVectorStoreFileVO } = {};

        for (const i in vector_store_files_vos) {
            const vector_store_file_vo = vector_store_files_vos[i];
            vector_store_files_vos_by_gpt_id[vector_store_file_vo.gpt_file_id] = vector_store_file_vo;
        }

        for (const i in vector_store_files) {
            const vector_store_file = vector_store_files[i];
            let found_vo: GPTAssistantAPIVectorStoreFileVO = vector_store_files_vos_by_gpt_id[vector_store_file.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIVectorStoreFileVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                GPTAssistantAPIServerSyncVectorStoreFilesController.vector_store_file_has_diff(found_vo, GPTAssistantAPIServerSyncController.to_openai_error(found_vo.last_error) as VectorStoreFile.LastError, vector_store_file);

            if (!needs_update) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_vector_store_files: Updating vector_store_file in Osélia : ' + vector_store_file.id + ' - ' + vector_store_file.vector_store_id);
            }

            await GPTAssistantAPIServerSyncVectorStoreFilesController.assign_vo_from_gpt(found_vo, vector_store_file);

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(found_vo);
        }

        // Les files qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_id in vector_store_files_vos_by_gpt_id) {

            if (vector_store_files_vos_by_gpt_id[gpt_id]) {
                continue;
            }

            const found_vo = vector_store_files_vos_by_gpt_id[gpt_id];

            if (found_vo.archived) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_vector_store_files: Archiving vector_store_file in Osélia : ' + found_vo.gpt_file_id + ' - ' + found_vo.vector_store_gpt_id);
            }

            found_vo.archived = true;

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async get_all_vector_store_files(gpt_vector_store_id: string): Promise<VectorStoreFile[]> {

        let res: VectorStoreFile[] = [];

        let vector_stores_page: VectorStoreFilesPage = await GPTAssistantAPIServerController.wrap_api_call(
            ModuleGPTServer.openai.beta.vectorStores.files.list, ModuleGPTServer.openai.beta.vectorStores.files, gpt_vector_store_id);

        if (!vector_stores_page) {
            return res;
        }

        if (vector_stores_page.data && vector_stores_page.data.length) {
            res = res.concat(vector_stores_page.data);
        }

        while (vector_stores_page.hasNextPage()) {
            vector_stores_page = await vector_stores_page.getNextPage();
            res = res.concat(vector_stores_page.data);
        }

        return res;
    }

    private static vector_store_file_has_diff(
        vector_store_file_vo: GPTAssistantAPIVectorStoreFileVO,
        to_openai_last_error: VectorStoreFile.LastError,
        vector_store_gpt: VectorStoreFile): boolean {

        if ((!vector_store_file_vo) && (!vector_store_gpt)) {
            return false;
        }

        if ((!vector_store_file_vo) || (!vector_store_gpt)) {
            return true;
        }

        return !(
            GPTAssistantAPIServerSyncController.compare_values(vector_store_file_vo.gpt_file_id, vector_store_gpt.id) &&
            GPTAssistantAPIServerSyncController.compare_values(vector_store_file_vo.created_at, vector_store_gpt.created_at) &&
            GPTAssistantAPIServerSyncController.compare_values(vector_store_file_vo.usage_bytes, vector_store_gpt.usage_bytes) &&
            GPTAssistantAPIServerSyncController.compare_values(to_openai_last_error, vector_store_gpt.last_error) &&
            GPTAssistantAPIServerSyncController.compare_values(vector_store_file_vo.status, GPTAssistantAPIVectorStoreFileVO.FROM_OPENAI_STATUS_MAP[vector_store_gpt.status]) &&
            GPTAssistantAPIServerSyncController.compare_values(vector_store_file_vo.vector_store_gpt_id, vector_store_gpt.vector_store_id));
    }

    private static async assign_vo_from_gpt(vector_store_file_vo: GPTAssistantAPIVectorStoreFileVO, vector_store_gpt: VectorStoreFile) {
        if (vector_store_gpt.vector_store_id) {
            const assistant = await GPTAssistantAPIServerSyncVectorStoresController.get_vector_store_or_sync(vector_store_gpt.vector_store_id);

            if (!assistant) {
                throw new Error('Error while pushing vector store file to OpenAI : vector store not found : ' + vector_store_gpt.vector_store_id);
            }

            vector_store_file_vo.vector_store_gpt_id = vector_store_gpt.vector_store_id;
            vector_store_file_vo.vector_store_id = assistant.id;
        } else {
            vector_store_file_vo.vector_store_gpt_id = null;
            vector_store_file_vo.vector_store_id = null;
        }

        vector_store_file_vo.gpt_file_id = vector_store_gpt.id;
        vector_store_file_vo.created_at = vector_store_gpt.created_at;
        vector_store_file_vo.usage_bytes = vector_store_gpt.usage_bytes;
        vector_store_file_vo.last_error = GPTAssistantAPIServerSyncController.from_openai_error(vector_store_gpt.last_error);
        vector_store_file_vo.status = GPTAssistantAPIVectorStoreFileVO.FROM_OPENAI_STATUS_MAP[vector_store_gpt.status];
        vector_store_file_vo.archived = false;
    }
}
import { cloneDeep } from 'lodash';
import { VectorStore, VectorStoresPage } from 'openai/resources/beta/vector-stores/vector-stores';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIVectorStoreVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIVectorStoreVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncVectorStoreFilesController from './GPTAssistantAPIServerSyncVectorStoreFilesController';
import GPTAssistantAPIServerSyncVectorStoreFileBatchesController from './GPTAssistantAPIServerSyncVectorStoreFileBatchesController';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';

export default class GPTAssistantAPIServerSyncVectorStoresController {

    /**
     * GPTAssistantAPIVectorStoreVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_VectorStoreVO(params: DAOUpdateVOHolder<GPTAssistantAPIVectorStoreVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncVectorStoresController.push_vector_store_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector store to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_VectorStoreVO(vo: GPTAssistantAPIVectorStoreVO, exec_as_server?: boolean): Promise<boolean> {

        if (vo.gpt_id) {
            // Si on a l'id GPT, c'est que la création vient de OpenAI, pas l'inverse. Donc on ne fait rien de plus
            return true;
        }

        try {
            await GPTAssistantAPIServerSyncVectorStoresController.push_vector_store_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector store to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_VectorStoreVO(vo: GPTAssistantAPIVectorStoreVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_vector_store_to_openai(vo: GPTAssistantAPIVectorStoreVO, is_trigger_pre_x: boolean = true): Promise<VectorStore> {
        try {

            if (!vo) {
                throw new Error('No vector_store_vo provided');
            }

            let gpt_obj: VectorStore = vo.gpt_id ? await ModuleGPTServer.openai.beta.vectorStores.retrieve(vo.gpt_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing vector_store to OpenAI : vector_store is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_vector_store_to_openai: Creating vector_store in OpenAI : ' + vo.name);
                }

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                    throw new Error('Error while pushing vector_store to OpenAI : block_openai_sync_push_to_openai');
                }

                gpt_obj = await ModuleGPTServer.openai.beta.vectorStores.create({

                    expires_after: {
                        anchor: GPTAssistantAPIVectorStoreVO.TO_OPENAI_EXPIRES_AFTER_ANCHOR_MAP[vo.expires_after_anchor] as 'last_active_at',
                        days: vo.expires_after_days
                    },
                    metadata: cloneDeep(vo.metadata),
                    name: vo.name
                });

                if (!gpt_obj) {
                    throw new Error('Error while creating vector_store in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncVectorStoresController.vector_store_has_diff(vo, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_vector_store_to_openai: Updating vector_store in OpenAI : ' + vo.name);
                    }

                    if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                        throw new Error('Error while pushing vector_store to OpenAI : block_openai_sync_push_to_openai');
                    }

                    // On doit mettre à jour
                    await ModuleGPTServer.openai.beta.vectorStores.update(gpt_obj.id, {

                        expires_after: {
                            anchor: GPTAssistantAPIVectorStoreVO.TO_OPENAI_EXPIRES_AFTER_ANCHOR_MAP[vo.expires_after_anchor] as 'last_active_at',
                            days: vo.expires_after_days
                        },
                        metadata: cloneDeep(vo.metadata),
                        name: vo.name
                    });

                    if (!gpt_obj) {
                        throw new Error('Error while creating vector_store in OpenAI');
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncVectorStoresController.vector_store_has_diff(vo, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncVectorStoresController.vector_store_has_diff(vo, gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_vector_store_to_openai: Updating vector_store in Osélia : ' + vo.name);
                }

                GPTAssistantAPIServerSyncVectorStoresController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector_store to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_vector_store_or_sync(gpt_id: string): Promise<GPTAssistantAPIVectorStoreVO> {
        let vector_store = await query(GPTAssistantAPIVectorStoreVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreVO>().gpt_id, gpt_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIVectorStoreVO>();
        if (!vector_store) {
            ConsoleHandler.warn('Vector Store not found : ' + gpt_id + ' - Syncing VectorStores');
            await GPTAssistantAPIServerSyncVectorStoresController.sync_vector_stores();
        }

        vector_store = await query(GPTAssistantAPIVectorStoreVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreVO>().gpt_id, gpt_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIVectorStoreVO>();
        if (!vector_store) {
            ConsoleHandler.error('Vector Store not found : ' + gpt_id + ' - Already tried to sync VectorStores - Aborting');
            throw new Error('Vector Store not found : ' + gpt_id + ' - Already tried to sync VectorStores - Aborting');
        }

        return vector_store;
    }

    /**
     * On récupère tous les files de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_vector_stores() {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_vector_stores');
        }

        const vector_stores: VectorStore[] = await GPTAssistantAPIServerSyncVectorStoresController.get_all_vector_stores();
        const vector_stores_vos: GPTAssistantAPIVectorStoreVO[] = await query(GPTAssistantAPIVectorStoreVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIVectorStoreVO>();
        const vectore_stores_vos_by_gpt_id: { [gpt_id: string]: GPTAssistantAPIVectorStoreVO } = {};

        for (const i in vector_stores_vos) {
            const file_vo = vector_stores_vos[i];
            vectore_stores_vos_by_gpt_id[file_vo.gpt_id] = file_vo;
        }

        for (const i in vector_stores) {
            const vector_store = vector_stores[i];
            let found_vo: GPTAssistantAPIVectorStoreVO = vectore_stores_vos_by_gpt_id[vector_store.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIVectorStoreVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                GPTAssistantAPIServerSyncVectorStoresController.vector_store_has_diff(found_vo, vector_store);

            if (needs_update) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('sync_vector_stores: Updating vector_store in Osélia : ' + vector_store.name);
                }

                GPTAssistantAPIServerSyncVectorStoresController.assign_vo_from_gpt(found_vo, vector_store);

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
            }

            // On synchron les fichiers du vector store
            await GPTAssistantAPIServerSyncVectorStoreFilesController.sync_vector_store_files(found_vo.gpt_id);
        }

        // Les files qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_id in vectore_stores_vos_by_gpt_id) {

            if (vectore_stores_vos_by_gpt_id[gpt_id]) {
                continue;
            }

            const found_vo = vectore_stores_vos_by_gpt_id[gpt_id];

            if (found_vo.archived) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_vector_stores: Archiving vector_store in Osélia : ' + found_vo.name);
            }

            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }

        // On synchro les batchs de fichiers même si on peut pas vraiment les mettre à jour
        await GPTAssistantAPIServerSyncVectorStoreFileBatchesController.sync_vector_store_file_batches();
    }

    private static async get_all_vector_stores(): Promise<VectorStore[]> {

        const res: VectorStore[] = [];

        let vector_stores_page: VectorStoresPage = await ModuleGPTServer.openai.beta.vectorStores.list();

        if (!vector_stores_page) {
            return res;
        }

        if (vector_stores_page.data && vector_stores_page.data.length) {
            res.concat(vector_stores_page.data);
        }

        while (vector_stores_page.hasNextPage()) {
            vector_stores_page = await vector_stores_page.getNextPage();
            res.concat(vector_stores_page.data);
        }

        return res;
    }

    private static vector_store_has_diff(
        vector_store_vo: GPTAssistantAPIVectorStoreVO,
        vector_store_gpt: VectorStore): boolean {

        if ((!vector_store_vo) && (!vector_store_gpt)) {
            return false;
        }

        if ((!vector_store_vo) || (!vector_store_gpt)) {
            return true;
        }

        return (vector_store_vo.gpt_id != vector_store_gpt.id) ||
            (vector_store_vo.created_at != vector_store_gpt.created_at) ||
            (vector_store_vo.name != vector_store_gpt.name) ||
            (vector_store_vo.usage_bytes != vector_store_gpt.usage_bytes) ||
            (vector_store_vo.file_counts_in_progress != (vector_store_gpt.file_counts?.in_progress ? vector_store_gpt.file_counts?.in_progress : 0)) ||
            (vector_store_vo.file_counts_completed != (vector_store_gpt.file_counts?.completed ? vector_store_gpt.file_counts?.completed : 0)) ||
            (vector_store_vo.file_counts_failed != (vector_store_gpt.file_counts?.failed ? vector_store_gpt.file_counts?.failed : 0)) ||
            (vector_store_vo.file_counts_cancelled != (vector_store_gpt.file_counts?.cancelled ? vector_store_gpt.file_counts?.cancelled : 0)) ||
            (vector_store_vo.file_counts_total != (vector_store_gpt.file_counts?.total ? vector_store_gpt.file_counts?.total : 0)) ||
            (vector_store_vo.status != GPTAssistantAPIVectorStoreVO.FROM_OPENAI_STATUS_MAP[vector_store_gpt.status]) ||
            (vector_store_vo.expires_after_anchor != (vector_store_gpt.expires_after?.anchor ? GPTAssistantAPIVectorStoreVO.FROM_OPENAI_EXPIRES_AFTER_ANCHOR_MAP[vector_store_gpt.expires_after?.anchor] : null)) ||
            (vector_store_vo.expires_after_days != (vector_store_gpt.expires_after?.days ? vector_store_gpt.expires_after?.days : 0)) ||
            (vector_store_vo.expires_at != vector_store_gpt.expires_at) ||
            (vector_store_vo.last_active_at != vector_store_gpt.last_active_at) ||
            (JSON.stringify(vector_store_vo.metadata) != JSON.stringify(vector_store_gpt.metadata));
    }

    private static assign_vo_from_gpt(vector_store_vo: GPTAssistantAPIVectorStoreVO, vector_store_gpt: VectorStore) {
        vector_store_vo.gpt_id = vector_store_gpt.id;
        vector_store_vo.created_at = vector_store_gpt.created_at;
        vector_store_vo.usage_bytes = vector_store_gpt.usage_bytes;
        vector_store_vo.file_counts_in_progress = vector_store_gpt.file_counts?.in_progress ? vector_store_gpt.file_counts?.in_progress : 0;
        vector_store_vo.file_counts_completed = vector_store_gpt.file_counts?.completed ? vector_store_gpt.file_counts?.completed : 0;
        vector_store_vo.file_counts_failed = vector_store_gpt.file_counts?.failed ? vector_store_gpt.file_counts?.failed : 0;
        vector_store_vo.file_counts_cancelled = vector_store_gpt.file_counts?.cancelled ? vector_store_gpt.file_counts?.cancelled : 0;
        vector_store_vo.file_counts_total = vector_store_gpt.file_counts?.total ? vector_store_gpt.file_counts?.total : 0;
        vector_store_vo.status = GPTAssistantAPIVectorStoreVO.FROM_OPENAI_STATUS_MAP[vector_store_gpt.status];
        vector_store_vo.expires_after_anchor = GPTAssistantAPIVectorStoreVO.FROM_OPENAI_EXPIRES_AFTER_ANCHOR_MAP[vector_store_gpt.expires_after?.anchor];
        vector_store_vo.expires_after_days = vector_store_gpt.expires_after?.days ? vector_store_gpt.expires_after?.days : 0;
        vector_store_vo.expires_at = vector_store_gpt.expires_at;
        vector_store_vo.last_active_at = vector_store_gpt.last_active_at;
        vector_store_vo.metadata = cloneDeep(vector_store_gpt.metadata);
        vector_store_vo.archived = false;
    }
}
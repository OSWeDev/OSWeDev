import { VectorStoreFileBatch } from 'openai/resources/beta/vector-stores/file-batches';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIVectorStoreFileBatchVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIVectorStoreFileBatchVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncVectorStoresController from './GPTAssistantAPIServerSyncVectorStoresController';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';

export default class GPTAssistantAPIServerSyncVectorStoreFileBatchesController {

    /**
     * GPTAssistantAPIVectorStoreFileBatchVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_VectorStoreFileBatchVO(params: DAOUpdateVOHolder<GPTAssistantAPIVectorStoreFileBatchVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncVectorStoreFileBatchesController.push_vector_store_file_batch_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector store file batch to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_VectorStoreFileBatchVO(vo: GPTAssistantAPIVectorStoreFileBatchVO, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncVectorStoreFileBatchesController.push_vector_store_file_batch_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector store file batch to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_VectorStoreFileBatchVO(vo: GPTAssistantAPIVectorStoreFileBatchVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_vector_store_file_batch_to_openai(vo: GPTAssistantAPIVectorStoreFileBatchVO, is_trigger_pre_x: boolean = true): Promise<VectorStoreFileBatch> {
        try {

            if (!vo) {
                throw new Error('No vector_store_file_batch_vo provided');
            }

            let gpt_obj: VectorStoreFileBatch = vo.gpt_id ? await ModuleGPTServer.openai.beta.vectorStores.fileBatches.retrieve(vo.vector_store_gpt_id, vo.gpt_id) : null;

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_vector_store_file_batch_to_openai: Creating vector_store_file_batch in OpenAI : ' + vo.gpt_id + ' - ' + vo.vector_store_gpt_id);
                }

                gpt_obj = await ModuleGPTServer.openai.beta.vectorStores.fileBatches.create(vo.vector_store_gpt_id, {
                    file_ids: vo.gpt_file_ids,
                });

                if (!gpt_obj) {
                    throw new Error('Error while creating vector_store_file_batch in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncVectorStoreFileBatchesController.vector_store_file_batch_has_diff(vo, gpt_obj)) {

                    // On doit mettre à jour mais en l'occurence il n'y a pas de méthode update pour les vector store files
                    // donc on supprime et on recrée => sauf qu'on a pas non plus de méthode delete pour les vector store files... donc on peut rien faire en fait
                    ConsoleHandler.error('Error while pushing vector store file to OpenAI : vector store file update not implemented : ' + vo.gpt_id);

                    // TODO FIXME : Probablement il faudrait dans ce cas créer un nouveau vector store file batch et ignorer l'ancien.
                    // Typiquement quand on a un ajout de fichier / ou retrait, on devrait créer un nouveau vector store file batch
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncVectorStoreFileBatchesController.vector_store_file_batch_has_diff(vo, gpt_obj)) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncVectorStoreFileBatchesController.vector_store_file_batch_has_diff(vo, gpt_obj)) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_vector_store_file_batch_to_openai: Updating vector_store_file_batch in Osélia : ' + vo.gpt_id + ' - ' + vo.vector_store_gpt_id);
                }

                await GPTAssistantAPIServerSyncVectorStoreFileBatchesController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing vector_store_file_batch to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_vector_store_file_batch_or_sync(gpt_vector_store_id: string, gpt_id: string): Promise<GPTAssistantAPIVectorStoreFileBatchVO> {
        let vector_store_file_batch = await query(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileBatchVO>().vector_store_gpt_id, gpt_vector_store_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileBatchVO>().gpt_id, gpt_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIVectorStoreFileBatchVO>();
        if (!vector_store_file_batch) {
            ConsoleHandler.warn('Vector Store File Batch not found : ' + gpt_id + ' - Syncing VectorStoreFileBatches');
            await GPTAssistantAPIServerSyncVectorStoreFileBatchesController.sync_vector_store_file_batches();
        }

        vector_store_file_batch = await query(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileBatchVO>().vector_store_gpt_id, gpt_vector_store_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIVectorStoreFileBatchVO>().gpt_id, gpt_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIVectorStoreFileBatchVO>();
        if (!vector_store_file_batch) {
            ConsoleHandler.error('Vector Store File Batch not found : ' + gpt_id + ' - Already tried to sync VectorStoreFileBatches - Aborting');
            throw new Error('Vector Store File Batch not found : ' + gpt_id + ' - Already tried to sync VectorStoreFileBatches - Aborting');
        }

        return vector_store_file_batch;
    }

    /**
     * On récupère tous les vecto store file batches de l'API GPT et on les synchronise avec Osélia
     *  Ce qui signifie créer dans Osélia les Threads de GPT qui n'existent pas encore => sauf qu'on a pas de get_all_vector_store_file_batches dans l'API GPT... donc on peut pas faire ça
     *  Archiver les vecto store file batches d'Osélia qui n'existent plus dans GPT (et pas encore archivés dans Osélia)
     */
    public static async sync_vector_store_file_batches() {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_vector_store_file_batches');
        }

        const vector_store_file_batch_vos: GPTAssistantAPIVectorStoreFileBatchVO[] = await query(GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIVectorStoreFileBatchVO>();
        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);

        for (const i in vector_store_file_batch_vos) {
            const vector_store_file_batch_vo = vector_store_file_batch_vos[i];

            await promise_pipeline.push(async () => {
                const vector_store_file_batch_gpt = await ModuleGPTServer.openai.beta.vectorStores.fileBatches.retrieve(vector_store_file_batch_vo.vector_store_gpt_id, vector_store_file_batch_vo.gpt_id);

                if (!vector_store_file_batch_gpt) {
                    return;
                }

                // On met à jour le thread dans Osélia
                if (GPTAssistantAPIServerSyncVectorStoreFileBatchesController.vector_store_file_batch_has_diff(vector_store_file_batch_vo, vector_store_file_batch_gpt)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('GPTAssistantAPIServerSyncVectorStoreFileBatchesController: Updating vector_store_file_batch in Osélia : ' + vector_store_file_batch_gpt.id + ' - ' + vector_store_file_batch_gpt.vector_store_id);
                    }

                    await GPTAssistantAPIServerSyncVectorStoreFileBatchesController.assign_vo_from_gpt(vector_store_file_batch_vo, vector_store_file_batch_gpt);
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vector_store_file_batch_vo);
                }
            });
        }
    }

    private static vector_store_file_batch_has_diff(
        vector_store_file_batch_vo: GPTAssistantAPIVectorStoreFileBatchVO,
        vector_store_file_batch_gpt: VectorStoreFileBatch): boolean {

        if ((!vector_store_file_batch_vo) && (!vector_store_file_batch_gpt)) {
            return false;
        }

        if ((!vector_store_file_batch_vo) || (!vector_store_file_batch_gpt)) {
            return true;
        }

        return (vector_store_file_batch_vo.gpt_id != vector_store_file_batch_gpt.id) ||
            (vector_store_file_batch_vo.created_at != vector_store_file_batch_gpt.created_at) ||
            (vector_store_file_batch_vo.file_counts_in_progress != (vector_store_file_batch_gpt.file_counts?.in_progress ? vector_store_file_batch_gpt.file_counts?.in_progress : 0)) ||
            (vector_store_file_batch_vo.file_counts_completed != (vector_store_file_batch_gpt.file_counts?.completed ? vector_store_file_batch_gpt.file_counts?.completed : 0)) ||
            (vector_store_file_batch_vo.file_counts_failed != (vector_store_file_batch_gpt.file_counts?.failed ? vector_store_file_batch_gpt.file_counts?.failed : 0)) ||
            (vector_store_file_batch_vo.file_counts_total != (vector_store_file_batch_gpt.file_counts?.total ? vector_store_file_batch_gpt.file_counts?.total : 0)) ||
            (vector_store_file_batch_vo.file_counts_cancelled != (vector_store_file_batch_gpt.file_counts?.cancelled ? vector_store_file_batch_gpt.file_counts?.cancelled : 0)) ||
            (vector_store_file_batch_vo.status != GPTAssistantAPIVectorStoreFileBatchVO.FROM_OPENAI_STATUS_MAP[vector_store_file_batch_gpt.status]) ||
            (vector_store_file_batch_vo.vector_store_gpt_id != vector_store_file_batch_gpt.vector_store_id);
    }

    private static async assign_vo_from_gpt(vector_store_file_batch_vo: GPTAssistantAPIVectorStoreFileBatchVO, vector_store_file_batch_gpt: VectorStoreFileBatch) {
        if (vector_store_file_batch_gpt.vector_store_id) {
            const assistant = await GPTAssistantAPIServerSyncVectorStoresController.get_vector_store_or_sync(vector_store_file_batch_gpt.vector_store_id);

            if (!assistant) {
                throw new Error('Error while pushing vector store file to OpenAI : vector store not found : ' + vector_store_file_batch_gpt.vector_store_id);
            }

            vector_store_file_batch_vo.vector_store_gpt_id = vector_store_file_batch_gpt.vector_store_id;
            vector_store_file_batch_vo.vector_store_id = assistant.id;
        } else {
            vector_store_file_batch_vo.vector_store_gpt_id = null;
            vector_store_file_batch_vo.vector_store_id = null;
        }

        vector_store_file_batch_vo.gpt_id = vector_store_file_batch_gpt.id;
        vector_store_file_batch_vo.created_at = vector_store_file_batch_gpt.created_at;
        vector_store_file_batch_vo.file_counts_cancelled = vector_store_file_batch_gpt.file_counts?.cancelled ? vector_store_file_batch_gpt.file_counts?.cancelled : 0;
        vector_store_file_batch_vo.file_counts_completed = vector_store_file_batch_gpt.file_counts?.completed ? vector_store_file_batch_gpt.file_counts?.completed : 0;
        vector_store_file_batch_vo.file_counts_failed = vector_store_file_batch_gpt.file_counts?.failed ? vector_store_file_batch_gpt.file_counts?.failed : 0;
        vector_store_file_batch_vo.file_counts_in_progress = vector_store_file_batch_gpt.file_counts?.in_progress ? vector_store_file_batch_gpt.file_counts?.in_progress : 0;
        vector_store_file_batch_vo.file_counts_total = vector_store_file_batch_gpt.file_counts?.total ? vector_store_file_batch_gpt.file_counts?.total : 0;
        vector_store_file_batch_vo.status = GPTAssistantAPIVectorStoreFileBatchVO.FROM_OPENAI_STATUS_MAP[vector_store_file_batch_gpt.status];
    }
}
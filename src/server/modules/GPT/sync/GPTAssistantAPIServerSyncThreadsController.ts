import { cloneDeep } from 'lodash';
import { AssistantCreateParams } from 'openai/resources/beta/assistants';
import { Thread, ThreadCreateParams } from 'openai/resources/beta/threads/threads';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import GPTAssistantAPIThreadMessageVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import GPTAssistantAPIToolResourcesVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIToolResourcesVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncThreadMessagesController from './GPTAssistantAPIServerSyncThreadMessagesController';
import GPTAssistantAPIServerSyncRunsController from './GPTAssistantAPIServerSyncRunsController';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';
import { APIPromise, RequestOptions } from 'openai/core';

export default class GPTAssistantAPIServerSyncThreadsController {

    /**
     * GPTAssistantAPIThreadVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_ThreadVO(params: DAOUpdateVOHolder<GPTAssistantAPIThreadVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncThreadsController.push_thread_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing thread to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_ThreadVO(vo: GPTAssistantAPIThreadVO, exec_as_server?: boolean): Promise<boolean> {

        if (vo.gpt_thread_id) {
            // Si on a l'id GPT, c'est que la création vient de OpenAI, pas l'inverse. Donc on ne fait rien de plus
            return true;
        }

        try {
            await GPTAssistantAPIServerSyncThreadsController.push_thread_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing thread to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_ThreadVO(vo: GPTAssistantAPIThreadVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_thread_to_openai(vo: GPTAssistantAPIThreadVO, is_trigger_pre_x: boolean = true): Promise<Thread> {
        try {

            if (!vo) {
                throw new Error('No thread_vo provided');
            }

            let gpt_obj: Thread = vo.gpt_thread_id ? await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.retrieve, ModuleGPTServer.openai.beta.threads, vo.gpt_thread_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing thread to OpenAI : thread is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            const tool_resources: ThreadCreateParams.ToolResources = await GPTAssistantAPIServerSyncThreadsController.tool_resources_to_openai_api(vo.tool_resources);

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('GPTAssistantAPIServerSyncThreadsController:push_thread_to_openai - creating thread');
                }

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                    throw new Error('Error while pushing obj to OpenAI : block_openai_sync_push_to_openai');
                }

                gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                    // On cast pour éviter l'erreur de type car fonction à plusieurs types possibles...
                    ModuleGPTServer.openai.beta.threads.create as (body?: ThreadCreateParams, options?: RequestOptions<unknown>) => APIPromise<Thread>,
                    ModuleGPTServer.openai.beta.threads,
                    {
                        messages: [], // On synchronise les messages après dans tous les cas
                        metadata: cloneDeep(vo.metadata),
                        tool_resources: tool_resources,
                    } as ThreadCreateParams);

                if (!gpt_obj) {
                    throw new Error('Error while creating thread in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncThreadsController.thread_has_diff(vo, tool_resources, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('GPTAssistantAPIServerSyncThreadsController:push_thread_to_openai - updating thread');
                    }

                    if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                        throw new Error('Error while pushing obj to OpenAI : block_openai_sync_push_to_openai');
                    }

                    // On doit mettre à jour
                    await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.threads.update,
                        ModuleGPTServer.openai.beta.threads,
                        gpt_obj.id,
                        {
                            tool_resources: tool_resources,
                            metadata: cloneDeep(vo.metadata),
                        });

                    if (!gpt_obj) {
                        throw new Error('Error while creating thread in OpenAI');
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncThreadsController.thread_has_diff(vo, tool_resources, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncThreadsController.thread_has_diff(vo, tool_resources, gpt_obj) || vo.archived) {

                await GPTAssistantAPIServerSyncThreadsController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
                }
            }

            // On synchronise les messages du thread - en mode push
            const msg_vos = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_id(vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, false))
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageVO>();
            for (const i in msg_vos) {
                await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_to_openai(msg_vos[i]);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing thread to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_thread_or_sync(gpt_thread_id: string): Promise<GPTAssistantAPIThreadVO> {
        let thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, gpt_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();
        if (!thread) {
            ConsoleHandler.warn('Thread not found : ' + gpt_thread_id + ' - Syncing Threads');
            await GPTAssistantAPIServerSyncThreadsController.sync_threads();
        }

        thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, gpt_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();
        if (!thread) {
            ConsoleHandler.error('Thread not found : ' + gpt_thread_id + ' - Already tried to sync Threads - Aborting');
            throw new Error('Thread not found : ' + gpt_thread_id + ' - Already tried to sync Threads - Aborting');
        }

        return thread;
    }

    /**
     * On récupère tous les threads de l'API GPT et on les synchronise avec Osélia
     *  Ce qui signifie créer dans Osélia les Threads de GPT qui n'existent pas encore => sauf qu'on a pas de get_all_threads dans l'API GPT... donc on peut pas faire ça
     *  Archiver les threads d'Osélia qui n'existent plus dans GPT (et pas encore archivés dans Osélia)
     */
    public static async sync_threads() {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('GPTAssistantAPIServerSyncThreadsController:sync_threads');
        }

        const threads_vos: GPTAssistantAPIThreadVO[] = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIThreadVO>();

        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
        for (const i in threads_vos) {
            const thread_vo = threads_vos[i];

            await promise_pipeline.push(async () => {
                const thread_gpt = await GPTAssistantAPIServerController.wrap_api_call(
                    ModuleGPTServer.openai.beta.threads.retrieve, ModuleGPTServer.openai.beta.threads, thread_vo.gpt_thread_id);

                if (!thread_gpt) {

                    // On archive le thread dans Osélia
                    if (!thread_vo.archived) {

                        if (ConfigurationService.node_configuration.debug_openai_sync) {
                            ConsoleHandler.log('GPTAssistantAPIServerSyncThreadsController:sync_threads - archiving thread');
                        }

                        thread_vo.archived = true;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);
                    }

                    return;
                }

                // On met à jour le thread dans Osélia
                if (GPTAssistantAPIServerSyncThreadsController.thread_has_diff(thread_vo, await GPTAssistantAPIServerSyncThreadsController.tool_resources_to_openai_api(thread_vo.tool_resources), thread_gpt)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('GPTAssistantAPIServerSyncThreadsController:sync_threads - updating thread');
                    }

                    await GPTAssistantAPIServerSyncThreadsController.assign_vo_from_gpt(thread_vo, thread_gpt);
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);
                }

                // On synchronise les messages du thread
                await GPTAssistantAPIServerSyncThreadMessagesController.sync_thread_messages(thread_vo, thread_gpt);

                // On synchronise les runs du thread
                await GPTAssistantAPIServerSyncRunsController.sync_runs(thread_gpt.id);
            });
        }
    }

    private static thread_has_diff(
        thread_vo: GPTAssistantAPIThreadVO,
        thread_vo_to_openai_tool_resources: ThreadCreateParams.ToolResources,
        thread_gpt: Thread,
    ): boolean {
        if ((!thread_vo) && (!thread_gpt)) {
            return false;
        }

        if ((!thread_vo) || (!thread_gpt)) {
            return true;
        }

        return !(
            GPTAssistantAPIServerSyncController.compare_values(thread_vo.gpt_thread_id, thread_gpt.id) ||
            GPTAssistantAPIServerSyncController.compare_values(thread_vo.created_at, thread_gpt.created_at) ||
            GPTAssistantAPIServerSyncController.compare_values(thread_vo.metadata, thread_gpt.metadata) ||
            GPTAssistantAPIServerSyncController.compare_values(thread_vo_to_openai_tool_resources, thread_gpt.tool_resources));
    }

    private static async tool_resources_from_openai_api(data: ThreadCreateParams.ToolResources): Promise<GPTAssistantAPIToolResourcesVO> {

        return GPTAssistantAPIServerSyncAssistantsController.tool_resources_from_openai_api(data as AssistantCreateParams.ToolResources);
    }

    private static tool_resources_to_openai_api(vo: GPTAssistantAPIToolResourcesVO): ThreadCreateParams.ToolResources {

        return GPTAssistantAPIServerSyncAssistantsController.tool_resources_to_openai_api(vo) as AssistantCreateParams.ToolResources;
    }

    private static async assign_vo_from_gpt(vo: GPTAssistantAPIThreadVO, gpt_obj: Thread) {
        vo.gpt_thread_id = gpt_obj.id;
        vo.created_at = gpt_obj.created_at;
        vo.metadata = cloneDeep(gpt_obj.metadata);
        vo.tool_resources = await GPTAssistantAPIServerSyncThreadsController.tool_resources_from_openai_api(gpt_obj.tool_resources);
        vo.archived = false;
    }
}
import { cloneDeep } from 'lodash';
import { Run, RunsPage } from 'openai/resources/beta/threads/runs/runs';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import GPTAssistantAPIRunStepVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIRunStepVO';
import GPTAssistantAPIRunVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerSyncRunStepsController from './GPTAssistantAPIServerSyncRunStepsController';
import GPTAssistantAPIServerSyncThreadsController from './GPTAssistantAPIServerSyncThreadsController';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';

export default class GPTAssistantAPIServerSyncRunsController {

    /**
     * GPTAssistantAPIRunVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_RunVO(params: DAOUpdateVOHolder<GPTAssistantAPIRunVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncRunsController.push_run_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing run to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_RunVO(vo: GPTAssistantAPIRunVO, exec_as_server?: boolean): Promise<boolean> {

        if (vo.gpt_run_id) {
            // Si on a l'id GPT, c'est que la création vient de OpenAI, pas l'inverse. Donc on ne fait rien de plus
            return true;
        }

        try {
            await GPTAssistantAPIServerSyncRunsController.push_run_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing run to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_RunVO(vo: GPTAssistantAPIRunVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_run_to_openai(vo: GPTAssistantAPIRunVO, is_trigger_pre_x: boolean = true): Promise<Run> {
        try {

            if (!vo) {
                throw new Error('No run_vo provided');
            }

            let gpt_obj: Run = vo.gpt_run_id ? await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.runs.retrieve, ModuleGPTServer.openai.beta.threads.runs, vo.gpt_thread_id, vo.gpt_run_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing run to OpenAI : run is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            const to_openai_last_error = GPTAssistantAPIServerSyncController.to_openai_error(vo.last_error) as Run.LastError;

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_run_to_openai: Creating run in OpenAI : ' + vo.id);
                }

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                    throw new Error('Error while pushing run to OpenAI : block_openai_sync_push_to_openai');
                }

                gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                    ModuleGPTServer.openai.beta.threads.runs.create,
                    ModuleGPTServer.openai.beta.threads.runs,
                    vo.gpt_thread_id,
                    {
                        assistant_id: vo.gpt_assistant_id,
                        instructions: vo.instructions,
                        model: vo.model,
                        max_completion_tokens: vo.max_completion_tokens,
                        max_prompt_tokens: vo.max_prompt_tokens,
                        metadata: cloneDeep(vo.metadata),
                        temperature: vo.temperature,
                        response_format: cloneDeep(vo.response_format),
                        tool_choice: cloneDeep(vo.tool_choice),
                        tools: cloneDeep(vo.tools),
                        top_p: vo.top_p,
                        truncation_strategy: cloneDeep(vo.truncation_strategy),
                    }) as Run;

                if (!gpt_obj) {
                    throw new Error('Error while creating run in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncRunsController.run_has_diff(vo, to_openai_last_error, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_run_to_openai: Updating run in OpenAI : ' + vo.gpt_run_id);
                    }

                    if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                        throw new Error('Error while pushing run to OpenAI : block_openai_sync_push_to_openai');
                    }

                    // On doit mettre à jour
                    await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.threads.runs.update,
                        ModuleGPTServer.openai.beta.threads.runs,
                        vo.gpt_thread_id, vo.gpt_run_id,
                        {
                            metadata: cloneDeep(vo.metadata),
                        });

                    if (!gpt_obj) {
                        throw new Error('Error while creating run in OpenAI');
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncRunsController.run_has_diff(vo, to_openai_last_error, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncRunsController.run_has_diff(vo, to_openai_last_error, gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_run_to_openai: Updating run in Osélia : ' + vo.gpt_run_id);
                }

                await GPTAssistantAPIServerSyncRunsController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
                }
            }

            // On synchronise les step du thread - en mode push
            const steps = await query(GPTAssistantAPIRunStepVO.API_TYPE_ID)
                .filter_by_id(vo.id, GPTAssistantAPIRunStepVO.API_TYPE_ID)
                .set_sorts([
                    new SortByVO(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().gpt_run_id, true),
                    new SortByVO(GPTAssistantAPIRunStepVO.API_TYPE_ID, field_names<GPTAssistantAPIRunStepVO>().gpt_run_step_id, true)
                ])
                .exec_as_server()
                .select_vos<GPTAssistantAPIRunStepVO>();
            for (const i in steps) {
                await GPTAssistantAPIServerSyncRunStepsController.push_run_step_to_openai(steps[i]);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing run to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_run_or_sync(gpt_thread_id: string, gpt_run_id: string): Promise<GPTAssistantAPIRunVO> {
        let run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_thread_id, gpt_thread_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_run_id, gpt_run_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();
        if (!run) {
            ConsoleHandler.warn('Run not found : ' + gpt_run_id + ' - Syncing Runs');
            await GPTAssistantAPIServerSyncRunsController.sync_runs(gpt_thread_id);
        }

        run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_thread_id, gpt_thread_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_run_id, gpt_run_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();
        if (!run) {
            ConsoleHandler.error('Run not found : ' + gpt_run_id + ' - Already tried to sync Runs - Aborting');
            throw new Error('Run not found : ' + gpt_run_id + ' - Already tried to sync Runs - Aborting');
        }

        return run;
    }

    /**
     * On récupère tous les runs de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_runs(gpt_thread_id: string) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_runs: Syncing runs for thread : ' + gpt_thread_id);
        }

        const runs: Run[] = await GPTAssistantAPIServerSyncRunsController.get_all_runs(gpt_thread_id);
        const runs_vos: GPTAssistantAPIRunVO[] = await query(GPTAssistantAPIRunVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIRunVO>();
        const runs_vos_by_gpt_id: { [gpt_run_id: string]: GPTAssistantAPIRunVO } = {};

        for (const i in runs_vos) {
            const run_vo = runs_vos[i];
            runs_vos_by_gpt_id[run_vo.gpt_run_id] = run_vo;
        }

        for (const i in runs) {
            const run = runs[i];
            let found_vo: GPTAssistantAPIRunVO = runs_vos_by_gpt_id[run.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIRunVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                GPTAssistantAPIServerSyncRunsController.run_has_diff(found_vo, GPTAssistantAPIServerSyncController.to_openai_error(found_vo.last_error) as Run.LastError, run);

            if (!needs_update) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_runs: Updating run in Osélia : ' + run.id + ' - ' + run.thread_id);
            }

            await GPTAssistantAPIServerSyncRunsController.assign_vo_from_gpt(found_vo, run);

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }

        // Les runs qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_run_id in runs_vos_by_gpt_id) {

            if (runs_vos_by_gpt_id[gpt_run_id]) {
                continue;
            }

            const found_vo = runs_vos_by_gpt_id[gpt_run_id];

            if (found_vo.archived) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_runs: Archiving run in Osélia : ' + found_vo.id + ' - ' + found_vo.thread_id);
            }

            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async get_all_runs(gpt_thread_id: string): Promise<Run[]> {

        let res: Run[] = [];

        let runs_page: RunsPage = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.beta.threads.runs.list, ModuleGPTServer.openai.beta.threads.runs, gpt_thread_id);

        if (!runs_page) {
            return res;
        }

        if (runs_page.data && runs_page.data.length) {
            res = res.concat(runs_page.data);
        }

        while (runs_page.hasNextPage()) {
            runs_page = await runs_page.getNextPage();
            res = res.concat(runs_page.data);
        }

        return res;
    }

    private static run_has_diff(
        run_vo: GPTAssistantAPIRunVO,
        to_openai_last_error: Run.LastError,
        run_gpt: Run): boolean {

        if ((!run_vo) && (!run_gpt)) {
            return false;
        }

        if ((!run_vo) || (!run_gpt)) {
            return true;
        }

        return !(
            GPTAssistantAPIServerSyncController.compare_values(run_vo.gpt_run_id, run_gpt.id) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.gpt_assistant_id, run_gpt.assistant_id) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.gpt_thread_id, run_gpt.thread_id) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.cancelled_at, run_gpt.cancelled_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.completed_at, run_gpt.completed_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.expires_at, run_gpt.expires_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.failed_at, run_gpt.failed_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.started_at, run_gpt.started_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.status, GPTAssistantAPIRunVO.FROM_OPENAI_STATUS_MAP[run_gpt.status]) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.instructions, run_gpt.instructions) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.max_completion_tokens, run_gpt.max_completion_tokens) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.max_prompt_tokens, run_gpt.max_prompt_tokens) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.model, run_gpt.model) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.temperature, run_gpt.temperature) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.top_p, run_gpt.top_p) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.truncation_strategy, run_gpt.truncation_strategy) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.response_format, run_gpt.response_format) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.tool_choice, run_gpt.tool_choice) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.tools, run_gpt.tools) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.metadata, run_gpt.metadata) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.incomplete_details, run_gpt.incomplete_details) &&
            GPTAssistantAPIServerSyncController.compare_values(to_openai_last_error, run_gpt.last_error) &&
            GPTAssistantAPIServerSyncController.compare_values(run_vo.required_action, run_gpt.required_action));
    }

    private static async assign_vo_from_gpt(vo: GPTAssistantAPIRunVO, gpt_obj: Run) {

        if (gpt_obj.assistant_id) {
            const assistant = await GPTAssistantAPIServerSyncAssistantsController.get_assistant_or_sync(gpt_obj.assistant_id);

            if (!assistant) {
                throw new Error('Error while pushing run to OpenAI : assistant not found : ' + gpt_obj.assistant_id);
            }

            vo.gpt_assistant_id = gpt_obj.assistant_id;
            vo.assistant_id = assistant.id;
        } else {
            vo.gpt_assistant_id = null;
            vo.assistant_id = null;
        }

        if (gpt_obj.thread_id) {
            const thread = await GPTAssistantAPIServerSyncThreadsController.get_thread_or_sync(gpt_obj.thread_id);

            if (!thread) {
                throw new Error('Error while pushing run to OpenAI : assistant not found : ' + gpt_obj.thread_id);
            }

            vo.gpt_thread_id = gpt_obj.thread_id;
            vo.thread_id = thread.id;
        } else {
            vo.gpt_thread_id = null;
            vo.thread_id = null;
        }

        vo.cancelled_at = gpt_obj.cancelled_at;
        vo.completed_at = gpt_obj.completed_at;
        vo.expires_at = gpt_obj.expires_at;
        vo.failed_at = gpt_obj.failed_at;
        vo.incomplete_details = cloneDeep(gpt_obj.incomplete_details);
        vo.last_error = GPTAssistantAPIServerSyncController.from_openai_error(gpt_obj.last_error);
        vo.started_at = gpt_obj.started_at;
        vo.status = GPTAssistantAPIRunVO.FROM_OPENAI_STATUS_MAP[gpt_obj.status];
        vo.gpt_run_id = gpt_obj.id;
        vo.instructions = gpt_obj.instructions;
        vo.max_completion_tokens = gpt_obj.max_completion_tokens;
        vo.max_prompt_tokens = gpt_obj.max_prompt_tokens;
        vo.metadata = cloneDeep(gpt_obj.metadata);
        vo.model = gpt_obj.model;
        vo.response_format = cloneDeep(gpt_obj.response_format);
        vo.temperature = gpt_obj.temperature;
        vo.tool_choice = cloneDeep(gpt_obj.tool_choice);
        vo.tools = cloneDeep(gpt_obj.tools);
        vo.top_p = gpt_obj.top_p;
        vo.required_action = cloneDeep(gpt_obj.required_action);
        vo.truncation_strategy = cloneDeep(gpt_obj.truncation_strategy);
        vo.archived = false;
    }
}
import { cloneDeep } from 'lodash';
import { RunStep, RunStepsPage } from 'openai/resources/beta/threads/runs/steps';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIRunStepVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIRunStepVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerSyncRunsController from './GPTAssistantAPIServerSyncRunsController';
import GPTAssistantAPIServerSyncThreadsController from './GPTAssistantAPIServerSyncThreadsController';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';

export default class GPTAssistantAPIServerSyncRunStepsController {

    /**
     * GPTAssistantAPIRunStepVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_RunStepVO(params: DAOUpdateVOHolder<GPTAssistantAPIRunStepVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncRunStepsController.push_run_step_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing run step to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_RunStepVO(vo: GPTAssistantAPIRunStepVO, exec_as_server?: boolean): Promise<boolean> {

        if (vo.gpt_run_step_id) {
            // Si on a l'id GPT, c'est que la création vient de OpenAI, pas l'inverse. Donc on ne fait rien de plus
            return true;
        }

        try {
            await GPTAssistantAPIServerSyncRunStepsController.push_run_step_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing run step to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_RunStepVO(vo: GPTAssistantAPIRunStepVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * Dans le cas très spécifique des run steps, on ne devrait pas avoir besoin de cette méthode, car on ne devrait pas créer de run step directement
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_run_step_to_openai(vo: GPTAssistantAPIRunStepVO, is_trigger_pre_x: boolean = true): Promise<RunStep> {
        try {

            if (!vo) {
                throw new Error('No run_step_vo provided');
            }

            const gpt_obj: RunStep = vo.gpt_run_step_id ? await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.runs.steps.retrieve,
                ModuleGPTServer.openai.beta.threads.runs.steps,
                vo.gpt_thread_id,
                vo.gpt_run_id,
                vo.gpt_run_step_id) : null;

            const to_openai_last_error = GPTAssistantAPIServerSyncController.to_openai_error(vo.last_error) as RunStep.LastError;

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.error('push_run_to_openai: Failed to retrieve run in OpenAI : ' + vo.gpt_run_step_id);
                    throw new Error('Failed to retrieve run in OpenAI : ' + vo.gpt_run_step_id);
                }
            } else {
                if (GPTAssistantAPIServerSyncRunStepsController.run_has_diff(vo, to_openai_last_error, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.error('push_run_to_openai: Diffs found between Osélia and OpenAI : ' + vo.gpt_run_step_id);
                        throw new Error('Diffs found between Osélia and OpenAI : ' + vo.gpt_run_step_id);
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncRunStepsController.run_has_diff(vo, to_openai_last_error, gpt_obj)) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncRunStepsController.run_has_diff(vo, to_openai_last_error, gpt_obj)) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_run_to_openai: Updating run step in Osélia : ' + vo.gpt_run_id);
                }

                await GPTAssistantAPIServerSyncRunStepsController.assign_vo_from_gpt(vo, gpt_obj);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(vo);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing run to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_run_step_or_sync(gpt_thread_id: string, gpt_run_id: string, gpt_run_step_id: string): Promise<GPTAssistantAPIRunStepVO> {
        let run_step = await query(GPTAssistantAPIRunStepVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunStepVO>().gpt_thread_id, gpt_thread_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunStepVO>().gpt_run_id, gpt_run_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunStepVO>().gpt_run_step_id, gpt_run_step_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunStepVO>();
        if (!run_step) {
            ConsoleHandler.warn('Run Step not found : ' + gpt_run_step_id + ' - Syncing Run Steps');
            await GPTAssistantAPIServerSyncRunStepsController.sync_run_steps(gpt_thread_id, gpt_run_id);
        }

        run_step = await query(GPTAssistantAPIRunStepVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunStepVO>().gpt_thread_id, gpt_thread_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunStepVO>().gpt_run_id, gpt_run_id)
            .filter_by_text_eq(field_names<GPTAssistantAPIRunStepVO>().gpt_run_step_id, gpt_run_step_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunStepVO>();
        if (!run_step) {
            ConsoleHandler.error('Run Step not found : ' + gpt_run_step_id + ' - Already tried to sync Run Steps - Aborting');
            throw new Error('Run Step not found : ' + gpt_run_step_id + ' - Already tried to sync Run Steps - Aborting');
        }

        return run_step;
    }

    /**
     * On récupère tous les runs de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_run_steps(gpt_thread_id: string, gpt_run_id: string) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_runs: Syncing run steps');
        }

        const run_steps: RunStep[] = await GPTAssistantAPIServerSyncRunStepsController.get_all_run_steps(gpt_thread_id, gpt_run_id);
        const run_steps_vos: GPTAssistantAPIRunStepVO[] = await query(GPTAssistantAPIRunStepVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIRunStepVO>();
        const run_steps_vos_by_gpt_id: { [gpt_run_id: string]: GPTAssistantAPIRunStepVO } = {};

        for (const i in run_steps_vos) {
            const run_step_vo = run_steps_vos[i];
            run_steps_vos_by_gpt_id[run_step_vo.gpt_run_id] = run_step_vo;
        }

        for (const i in run_steps) {
            const run = run_steps[i];
            let found_vo: GPTAssistantAPIRunStepVO = run_steps_vos_by_gpt_id[run.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIRunStepVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                GPTAssistantAPIServerSyncRunStepsController.run_has_diff(found_vo, GPTAssistantAPIServerSyncController.to_openai_error(found_vo.last_error) as RunStep.LastError, run);

            if (!needs_update) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_runs: Updating run step in Osélia : ' + run.id + ' - ' + run.run_id + ' - ' + run.thread_id);
            }

            await GPTAssistantAPIServerSyncRunStepsController.assign_vo_from_gpt(found_vo, run);

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(found_vo);
        }

        // Les runs qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_run_step_id in run_steps_vos_by_gpt_id) {

            if (run_steps_vos_by_gpt_id[gpt_run_step_id]) {
                continue;
            }

            const found_vo = run_steps_vos_by_gpt_id[gpt_run_step_id];

            ConsoleHandler.error('sync_runs: Found run step in Osélia but not in OpenAI : ' + found_vo.gpt_run_id);
            throw new Error('Found run step in Osélia but not in OpenAI : ' + found_vo.gpt_run_id);
        }
    }

    private static async get_all_run_steps(gpt_thread_id: string, gpt_run_id: string): Promise<RunStep[]> {

        let res: RunStep[] = [];

        let runs_page: RunStepsPage = await GPTAssistantAPIServerController.wrap_api_call(
            ModuleGPTServer.openai.beta.threads.runs.steps.list, ModuleGPTServer.openai.beta.threads.runs.steps, gpt_thread_id, gpt_run_id);

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
        run_step_vo: GPTAssistantAPIRunStepVO,
        to_openai_last_error: RunStep.LastError,
        run_gpt: RunStep): boolean {

        if ((!run_step_vo) && (!run_gpt)) {
            return false;
        }

        if ((!run_step_vo) || (!run_gpt)) {
            return true;
        }

        return !(
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.gpt_assistant_id, run_gpt.assistant_id) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.gpt_thread_id, run_gpt.thread_id) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.gpt_run_id, run_gpt.run_id) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.cancelled_at, run_gpt.cancelled_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.completed_at, run_gpt.completed_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.created_at, run_gpt.created_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.failed_at, run_gpt.failed_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.expired_at, run_gpt.expired_at) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.status, GPTAssistantAPIRunStepVO.FROM_OPENAI_STATUS_MAP[run_gpt.status]) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.completion_tokens, (run_gpt.usage?.completion_tokens ? run_gpt.usage?.completion_tokens : 0)) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.gpt_run_step_id, run_gpt.id) &&
            GPTAssistantAPIServerSyncController.compare_values(to_openai_last_error, run_gpt.last_error) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.metadata, run_gpt.metadata) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.prompt_tokens, (run_gpt.usage?.prompt_tokens ? run_gpt.usage?.prompt_tokens : 0)) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.step_details, run_gpt.step_details) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.total_tokens, (run_gpt.usage?.total_tokens ? run_gpt.usage?.total_tokens : 0)) &&
            GPTAssistantAPIServerSyncController.compare_values(run_step_vo.type, GPTAssistantAPIRunStepVO.FROM_OPENAI_TYPE_MAP[run_gpt.type]));
    }

    private static async assign_vo_from_gpt(vo: GPTAssistantAPIRunStepVO, gpt_obj: RunStep) {
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

        if (gpt_obj.run_id) {
            const run = await GPTAssistantAPIServerSyncRunsController.get_run_or_sync(gpt_obj.thread_id, gpt_obj.run_id);

            if (!run) {
                throw new Error('Error while pushing run to OpenAI : run not found : ' + gpt_obj.run_id);
            }

            vo.gpt_run_id = gpt_obj.run_id;
            vo.run_id = run.id;
        } else {
            vo.gpt_run_id = null;
            vo.run_id = null;
        }

        vo.cancelled_at = gpt_obj.cancelled_at;
        vo.completed_at = gpt_obj.completed_at;
        vo.created_at = gpt_obj.created_at;
        vo.failed_at = gpt_obj.failed_at;
        vo.expired_at = gpt_obj.expired_at;
        vo.status = GPTAssistantAPIRunStepVO.FROM_OPENAI_STATUS_MAP[gpt_obj.status];
        vo.completion_tokens = (gpt_obj.usage?.completion_tokens ? gpt_obj.usage?.completion_tokens : 0);
        vo.gpt_run_step_id = gpt_obj.id;
        vo.last_error = GPTAssistantAPIServerSyncController.from_openai_error(gpt_obj.last_error);
        vo.metadata = cloneDeep(gpt_obj.metadata);
        vo.prompt_tokens = (gpt_obj.usage?.prompt_tokens ? gpt_obj.usage?.prompt_tokens : 0);
        vo.step_details = cloneDeep(gpt_obj.step_details);
        vo.total_tokens = (gpt_obj.usage?.total_tokens ? gpt_obj.usage?.total_tokens : 0);
        vo.type = GPTAssistantAPIRunStepVO.FROM_OPENAI_TYPE_MAP[gpt_obj.type];
    }
}
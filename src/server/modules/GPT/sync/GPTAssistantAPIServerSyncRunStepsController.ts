import { cloneDeep } from 'lodash';
import { RunStep, RunStepsPage } from 'openai/resources/beta/threads/runs/steps';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIRunStepVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIRunStepVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncRunsController from './GPTAssistantAPIServerSyncRunsController';
import GPTAssistantAPIServerSyncThreadsController from './GPTAssistantAPIServerSyncThreadsController';

export default class GPTAssistantAPIServerSyncRunStepsController {

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * Dans le cas très spécifique des run steps, on ne devrait pas avoir besoin de cette méthode, car on ne devrait pas créer de run step directement
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_run_step_to_openai(vo: GPTAssistantAPIRunStepVO): Promise<RunStep> {
        try {

            if (!vo) {
                throw new Error('No run_step_vo provided');
            }

            const gpt_obj: RunStep = vo.gpt_run_step_id ? await ModuleGPTServer.openai.beta.threads.runs.steps.retrieve(vo.gpt_thread_id, vo.gpt_run_id, vo.gpt_run_step_id) : null;

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.error('push_run_to_openai: Failed to retrieve run in OpenAI : ' + vo.gpt_run_step_id);
                    throw new Error('Failed to retrieve run in OpenAI : ' + vo.gpt_run_step_id);
                }
            } else {
                if (GPTAssistantAPIServerSyncRunStepsController.run_has_diff(vo, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.error('push_run_to_openai: Diffs found between Osélia and OpenAI : ' + vo.gpt_run_step_id);
                        throw new Error('Diffs found between Osélia and OpenAI : ' + vo.gpt_run_step_id);
                    }
                }
            }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncRunStepsController.run_has_diff(vo, gpt_obj)) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_run_to_openai: Updating run step in Osélia : ' + vo.gpt_run_id);
                }

                await GPTAssistantAPIServerSyncRunStepsController.assign_vo_from_gpt(vo, gpt_obj);

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing run to OpenAI : ' + error);
            throw error;
        }
    }

    /**
     * On récupère tous les run step de l'API GPT et on les synchronise avec Osélia
     *  Ce qui signifie créer dans Osélia les Files de GPT qui n'existent pas encore
     *  Archiver les run step d'Osélia qui n'existent plus dans GPT (et pas encore archivés dans Osélia)
     */
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
                GPTAssistantAPIServerSyncRunStepsController.run_has_diff(found_vo, run);

            if (!needs_update) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_runs: Updating run step in Osélia : ' + run.id + ' - ' + run.run_id + ' - ' + run.thread_id);
            }

            await GPTAssistantAPIServerSyncRunStepsController.assign_vo_from_gpt(found_vo, run);

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
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

        const res: RunStep[] = [];

        let runs_page: RunStepsPage = await ModuleGPTServer.openai.beta.threads.runs.steps.list(gpt_thread_id, gpt_run_id);

        if (!runs_page) {
            return res;
        }

        if (runs_page.data && runs_page.data.length) {
            res.concat(runs_page.data);
        }

        while (runs_page.hasNextPage()) {
            runs_page = await runs_page.getNextPage();
            res.concat(runs_page.data);
        }

        return res;
    }

    private static run_has_diff(
        run_step_vo: GPTAssistantAPIRunStepVO,
        run_gpt: RunStep): boolean {

        if ((!run_step_vo) && (!run_gpt)) {
            return false;
        }

        if ((!run_step_vo) || (!run_gpt)) {
            return true;
        }

        return (run_step_vo.gpt_assistant_id != run_gpt.assistant_id) ||
            (run_step_vo.gpt_thread_id != run_gpt.thread_id) ||
            (run_step_vo.gpt_run_id != run_gpt.run_id) ||
            (run_step_vo.cancelled_at != run_gpt.cancelled_at) ||
            (run_step_vo.completed_at != run_gpt.completed_at) ||
            (run_step_vo.created_at != run_gpt.created_at) ||
            (run_step_vo.failed_at != run_gpt.failed_at) ||
            (run_step_vo.expired_at != run_gpt.expired_at) ||
            (run_step_vo.status != GPTAssistantAPIRunStepVO.FROM_OPENAI_STATUS_MAP[run_gpt.status]) ||
            (run_step_vo.completion_tokens != (run_gpt.usage?.completion_tokens ? run_gpt.usage?.completion_tokens : 0)) ||
            (run_step_vo.gpt_run_step_id != run_gpt.id) ||
            (JSON.stringify(run_step_vo.last_error) != JSON.stringify(run_gpt.last_error)) ||
            (JSON.stringify(run_step_vo.metadata) != JSON.stringify(run_gpt.metadata)) ||
            (run_step_vo.prompt_tokens != (run_gpt.usage?.prompt_tokens ? run_gpt.usage?.prompt_tokens : 0)) ||
            (JSON.stringify(run_step_vo.step_details) != JSON.stringify(run_gpt.step_details)) ||
            (run_step_vo.total_tokens != (run_gpt.usage?.total_tokens ? run_gpt.usage?.total_tokens : 0)) ||
            (run_step_vo.type != GPTAssistantAPIRunStepVO.FROM_OPENAI_TYPE_MAP[run_gpt.type]);
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
        vo.last_error = cloneDeep(gpt_obj.last_error);
        vo.metadata = cloneDeep(gpt_obj.metadata);
        vo.prompt_tokens = (gpt_obj.usage?.prompt_tokens ? gpt_obj.usage?.prompt_tokens : 0);
        vo.step_details = cloneDeep(gpt_obj.step_details);
        vo.total_tokens = (gpt_obj.usage?.total_tokens ? gpt_obj.usage?.total_tokens : 0);
        vo.type = GPTAssistantAPIRunStepVO.FROM_OPENAI_TYPE_MAP[gpt_obj.type];
    }
}
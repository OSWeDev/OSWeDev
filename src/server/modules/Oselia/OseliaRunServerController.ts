import { Thread } from 'openai/resources/beta/threads/threads';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import OseliaServerController from './OseliaServerController';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import ModuleOseliaServer from './ModuleOseliaServer';
import ConfigurationService from '../../env/ConfigurationService';

export default class OseliaRunServerController {

    public static PARAM_NAME_SPLITTER_PROMPT_PREFIX: string = 'OseliaServerController.SPLITTER_PROMPT_PREFIX';
    public static PARAM_NAME_VALIDATOR_PROMPT_PREFIX: string = 'OseliaServerController.VALIDATOR_PROMPT_PREFIX';
    public static PARAM_NAME_REMEMBER_TO_VALIDATE_PROMPT_PREFIX: string = 'OseliaServerController.REMEMBER_TO_VALIDATE_PROMPT_PREFIX';
    public static PARAM_NAME_STEP_OSELIA_PROMPT_PREFIX: string = 'OseliaServerController.STEP_OSELIA_PROMPT_PREFIX';

    public static async get_oselia_run_from_grp_run_id(gpt_run_id: number): Promise<OseliaRunVO> {

        if (!gpt_run_id) {
            throw new Error('get_oselia_run_from_grp_run_id: No gpt_run_id provided');
        }

        return await query(OseliaRunVO.API_TYPE_ID)
            .add_filters([
                ContextFilterVO.or([
                    filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_gpt_run_id).by_num_eq(gpt_run_id),
                    filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_gpt_run_id).by_num_eq(gpt_run_id),
                    filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_gpt_run_id).by_num_eq(gpt_run_id),
                ])
            ])
            .exec_as_server()
            .select_vo<OseliaRunVO>();
    }

    public static async split_run(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {

        try {

            const append_new_child_run_step_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().append_new_child_run_step)
                .exec_as_server()
                .select_vo<GPTAssistantAPIFunctionVO>();
            if (!append_new_child_run_step_function) {
                throw new Error('split_run: No append_new_child_run_step_function found');
            }

            await this.initialise_prompts_if_needed(run, assistant, thread);

            const files = await this.get_run_files(run);

            return await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread.gpt_thread_id,
                run.thread_title,
                run.initialised_splitter_prompt,
                files,
                run.user_id,
                true,
                run,
                run.state,
                [append_new_child_run_step_function],
                run.referrer_id,
            );
        } catch (error) {
            throw new Error('Error in split_run: ' + error.message);
        }
    }

    public static async run_run(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {

        try {

            await this.initialise_prompts_if_needed(run, assistant, thread);

            const files = await this.get_run_files(run);

            return await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread.gpt_thread_id,
                run.thread_title,
                run.initialised_run_prompt,
                files,
                run.user_id,
                true,
                run,
                run.state,
                null,
                run.referrer_id,
            );
        } catch (error) {
            throw new Error('Error in run_run: ' + error.message);
        }
    }

    public static async validate_run(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {

        try {

            const validate_run_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().validate_oselia_run)
                .exec_as_server()
                .select_vo<GPTAssistantAPIFunctionVO>();
            const refuse_run_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().refuse_oselia_run)
                .exec_as_server()
                .select_vo<GPTAssistantAPIFunctionVO>();

            if ((!validate_run_function) || (!refuse_run_function)) {
                throw new Error('validate_run: No validate_run_function or refuse_run_function found');
            }

            await this.initialise_prompts_if_needed(run, assistant, thread);

            const files = await this.get_run_files(run);

            return await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread.gpt_thread_id,
                run.thread_title,
                run.initialised_validator_prompt,
                files,
                run.user_id,
                true,
                run,
                run.state,
                [validate_run_function, refuse_run_function],
                run.referrer_id,
            );
        } catch (error) {
            throw new Error('Error in validate_run: ' + error.message);
        }
    }

    /**
     * Si le thread est pas défini sur le run, on le crée et on le lie au run
     * @param run
     * @param assistant
     */
    public static async get_run_thread(run: OseliaRunVO, assistant: GPTAssistantAPIAssistantVO): Promise<GPTAssistantAPIThreadVO> {
        if (!run) {
            throw new Error('get_run_thread: No run provided');
        }

        if (!assistant) {
            throw new Error('get_run_thread: No assistant in param: ' + run.assistant_id + ' - ' + run.id);
        }

        if (!run.thread_id) {
            const thread: {
                thread_gpt: Thread;
                thread_vo: GPTAssistantAPIThreadVO;
            } = await GPTAssistantAPIServerController.get_thread(run.user_id, null, assistant.id);

            run.thread_id = thread.thread_vo.id;
            thread.thread_vo.thread_title = run.thread_title;
            thread.thread_vo.needs_thread_title_build = false;
            thread.thread_vo.thread_title_auto_build_locked = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server([thread.thread_vo, run]);
        }

        const res = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(run.thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!res) {
            throw new Error('get_run_thread: No thread found: ' + run.thread_id + ' - ' + run.id);
        }

        return res;
    }

    /**
     * @param run
     */
    public static async get_run_assistant(run: OseliaRunVO): Promise<GPTAssistantAPIAssistantVO> {
        if (!run) {
            throw new Error('get_run_assistant: No run provided');
        }

        if (!run.assistant_id) {
            throw new Error('get_run_assistant: No assistant_id in run: ' + run.assistant_id + ' - ' + run.id);
        }

        const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_id(run.assistant_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            throw new Error('get_run_assistant: No assistant found: ' + run.assistant_id + ' - ' + run.id);
        }

        return assistant;
    }

    /**
     *
     * @param run ATTENTION le run doit être rechargé juste avant depuis la base de données, sans quoi il a pu être modifié par un autre thread
     * @param state
     */
    public static async update_oselia_run_state(
        run: OseliaRunVO,
        state: number
    ) {
        run.state = state;
        switch (state) {
            case OseliaRunVO.STATE_TODO:
                run.start_date = Dates.now();
                break;
            case OseliaRunVO.STATE_SPLITTING:
                run.split_start_date = Dates.now();
                break;
            case OseliaRunVO.STATE_SPLIT_ENDED:
                run.split_end_date = Dates.now();
                break;
            case OseliaRunVO.STATE_WAITING_SPLITS_END:
                run.waiting_split_end_start_date = Dates.now();
                break;
            case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED:
                run.waiting_split_end_end_date = Dates.now();
                break;
            case OseliaRunVO.STATE_RUNNING:
                run.run_start_date = Dates.now();
                break;
            case OseliaRunVO.STATE_RUN_ENDED:
                run.run_end_date = Dates.now();
                break;
            case OseliaRunVO.STATE_VALIDATING:
                run.validation_start_date = Dates.now();
                break;
            case OseliaRunVO.STATE_VALIDATION_ENDED:
                run.validation_end_date = Dates.now();
                break;
            case OseliaRunVO.STATE_DONE:
                run.end_date = Dates.now();
                break;
            case OseliaRunVO.STATE_CANCELLED:
                run.end_date = Dates.now();
                // Dans le cas d'une annulation, on envoie une info sur teams
                await TeamsAPIServerController.send_teams_oselia_error("Annulation d'un run Osélia [" + run.id + "] " + run.name, run.error_msg ? run.error_msg : 'Le run OpenAI a été annulé', run.thread_id);
                break;
            case OseliaRunVO.STATE_EXPIRED:
                run.end_date = Dates.now();
                // Dans le cas d'une expiration, on envoie une info sur teams
                await TeamsAPIServerController.send_teams_oselia_error("Expiration d'un run Osélia [" + run.id + "] " + run.name, run.error_msg ? run.error_msg : 'Le run OpenAI a expiré', run.thread_id);
                break;
            case OseliaRunVO.STATE_ERROR:
                run.end_date = Dates.now();
                // Dans le cas d'une erreur, on envoie une info sur teams
                await TeamsAPIServerController.send_teams_oselia_error("Erreur sur un run Osélia [" + run.id + "] " + run.name, run.error_msg ? run.error_msg : 'Le run Osélia a rencontré une erreur', run.thread_id);
                break;
            case OseliaRunVO.STATE_NEEDS_RERUN:
                run.rerun_ask_date = Dates.now();
                break;
            case OseliaRunVO.STATE_RERUN_ASKED:
                run.end_date = Dates.now();

                if (ConfigurationService.node_configuration.debug_reruns_of_oselia) {
                    // Dans le cas d'un rerun, on envoie une info sur teams
                    await TeamsAPIServerController.send_teams_oselia_warn("Rerun d'un run Osélia [" + run.id + "] " + run.name, run.rerun_name + '<br>' + run.rerun_reason + '<br>' + run.rerun_new_initial_prompt, run.thread_id);
                }
                break;
            default:
                throw new Error('OseliaRunBGThread.update_oselia_run_state: Not Implemented');
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run);
    }

    /**
     * @param run
     */
    public static async get_run_files(run: OseliaRunVO): Promise<FileVO[]> {
        if (!run) {
            throw new Error('get_run_files: No run provided');
        }

        if (run.file_id_ranges) {
            return await query(FileVO.API_TYPE_ID)
                .filter_by_ids(run.file_id_ranges)
                .exec_as_server()
                .select_vos<FileVO>();
        }

        return null;
    }

    private static async initialise_prompts_if_needed(
        run: OseliaRunVO,
        assistant: GPTAssistantAPIAssistantVO,
        thread_vo: GPTAssistantAPIThreadVO,
    ): Promise<void> {
        try {

            if (!run.initialised_run_prompt) {

                if ((!run.initial_content_text) && (!run.initial_prompt_id)) {
                    throw new Error('get_initialised_prompt:No content_text or prompt_id provided');
                }

                if (run.initial_content_text) {
                    run.initialised_run_prompt = run.initial_content_text;
                } else {

                    const oselia_prompt = await query(OseliaPromptVO.API_TYPE_ID)
                        .filter_by_id(run.initial_prompt_id)
                        .exec_as_server()
                        .select_vo<OseliaPromptVO>();

                    if (!oselia_prompt) {
                        throw new Error('get_initialised_prompt:No prompt found: ' + run.initial_prompt_id + ' - ' + run.id);
                    }

                    const prompt_string = await OseliaServerController.get_prompt_string(
                        oselia_prompt,
                        assistant,
                        run.user_id,
                        run.initial_prompt_parameters,
                        run.thread_title,
                        thread_vo);

                    if (!prompt_string) {
                        throw new Error('get_initialised_prompt:No prompt string provided: ' + run.initial_prompt_id + ' - ' + run.id);
                    }

                    run.initialised_run_prompt = prompt_string;
                }

                // Une fois qu'on a initialisé le prompt du run, on peut init les prompts potentiels du split et de la validation
                const prompt_prefix_split = await ModuleParams.getInstance().getParamValueAsString(OseliaRunServerController.PARAM_NAME_SPLITTER_PROMPT_PREFIX);
                run.initialised_splitter_prompt = (prompt_prefix_split ? prompt_prefix_split + ' ' : '') + run.initialised_run_prompt;

                const prompt_prefix_validator = await ModuleParams.getInstance().getParamValueAsString(OseliaRunServerController.PARAM_NAME_VALIDATOR_PROMPT_PREFIX);
                run.initialised_validator_prompt = (prompt_prefix_validator ? prompt_prefix_validator + ' ' : '') + run.initialised_run_prompt;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run);
            }
        } catch (error) {
            throw new Error('get_initialised_prompt: ' + error.message);
        }
    }
}
import { Thread } from 'openai/resources/beta/threads/threads';
import Throttle, { PostThrottleParam, PreThrottleParam } from '../../../shared/annotations/Throttle';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import EventifyEventListenerConfVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleFileServer from '../File/ModuleFileServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import ModuleGPTServer from '../GPT/ModuleGPTServer';
import ParamsServerController from '../Params/ParamsServerController';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import OseliaRunBGThread from './bgthreads/OseliaRunBGThread';
import ModuleOseliaServer from './ModuleOseliaServer';
import OseliaServerController from './OseliaServerController';

export default class OseliaRunServerController {

    public static PARAM_NAME_SPLITTER_PROMPT_PREFIX: string = 'OseliaServerController.SPLITTER_PROMPT_PREFIX';
    public static PARAM_NAME_VALIDATOR_PROMPT_PREFIX: string = 'OseliaServerController.VALIDATOR_PROMPT_PREFIX';
    public static PARAM_NAME_REMEMBER_TO_VALIDATE_PROMPT_PREFIX: string = 'OseliaServerController.REMEMBER_TO_VALIDATE_PROMPT_PREFIX';
    public static PARAM_NAME_STEP_OSELIA_PROMPT_PREFIX: string = 'OseliaServerController.STEP_OSELIA_PROMPT_PREFIX';

    public static async get_oselia_run_from_grp_run_id(gpt_run_id: number): Promise<OseliaRunVO> {

        if (!gpt_run_id) {
            throw new Error('get_oselia_run_from_grp_run_id: No gpt_run_id provided');
        }

        return query(OseliaRunVO.API_TYPE_ID)
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

        // if (!assistant) {
        //     throw new Error('get_run_thread: No assistant in param: ' + run.assistant_id + ' - ' + run.id);
        // }

        if (!run.thread_id) {
            const thread: {
                thread_gpt: Thread;
                thread_vo: GPTAssistantAPIThreadVO;
            } = await GPTAssistantAPIServerController.get_thread(run.user_id, null, run.oselia_thread_default_assistant_id ? run.oselia_thread_default_assistant_id : (assistant ? assistant.id : null));

            run.thread_id = thread.thread_vo.id;
            thread.thread_vo.thread_title = run.thread_title;
            thread.thread_vo.needs_thread_title_build = false;
            thread.thread_vo.thread_title_auto_build_locked = true;
            await ModuleDAOServer.instance.insertOrUpdateVOs_as_server([thread.thread_vo, run]);
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
            // throw new Error('get_run_assistant: No assistant_id in run: ' + run.assistant_id + ' - ' + run.id);
            return null;
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
        if (run.state == state) {
            return;
        }

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

        // Si on est sur un state de fin de run, et qu'on doit générer un résumé audio, on le fait maintenant => mais on throttle par ce que en fait on peut avoir des messages quelques centièmes de secondes après la fin du run "officielle"
        if ((OseliaRunBGThread.END_STATES.indexOf(run.state) >= 0) && run.generate_voice_summary) {
            setTimeout(async () => {
                await OseliaRunServerController.create_voice_summary(run);
            }, 1000);
        }

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run);
    }

    /**
     * @param run
     */
    public static async get_run_files(run: OseliaRunVO): Promise<FileVO[]> {
        if (!run) {
            throw new Error('get_run_files: No run provided');
        }

        if (run.file_id_ranges) {
            return query(FileVO.API_TYPE_ID)
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

                if (run.initial_prompt_id) {

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

                // Si on a initial_content_text + prompt_id, on append le initial_content_text qui sert alors de commentaire complémentaire au prompt par défaut
                if (run.initial_content_text) {
                    run.initialised_run_prompt = run.initialised_run_prompt ? run.initialised_run_prompt + '\n' + run.initial_content_text : run.initial_content_text;
                }


                // Une fois qu'on a initialisé le prompt du run, on peut init les prompts potentiels du split et de la validation
                const prompt_prefix_split = await ParamsServerController.getParamValueAsString(OseliaRunServerController.PARAM_NAME_SPLITTER_PROMPT_PREFIX);
                run.initialised_splitter_prompt = (prompt_prefix_split ? prompt_prefix_split + ' ' : '') + run.initialised_run_prompt;

                const prompt_prefix_validator = await ParamsServerController.getParamValueAsString(OseliaRunServerController.PARAM_NAME_VALIDATOR_PROMPT_PREFIX);
                run.initialised_validator_prompt = (prompt_prefix_validator ? prompt_prefix_validator + ' ' : '') + run.initialised_run_prompt;

                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run);
            }
        } catch (error) {
            throw new Error('get_initialised_prompt: ' + error.message);
        }
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_STACK,
        throttle_ms: 500,
        leading: false,
    })
    private static async create_voice_summary(@PreThrottleParam pre_run: OseliaRunVO, @PostThrottleParam runs: OseliaRunVO[] = null) {

        if (!runs) {
            return;
        }

        for (const run of runs) {
            let file: FileVO = null;

            // On génère via l'api GPT
            const speech_file_path = ModuleGPTServer.MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_PATH + ModuleGPTServer.MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_PREFIX + run.id + '_' + Dates.now_ms() + ModuleGPTServer.MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_SUFFIX;

            // On récupère tous les textes à résumer
            const message_contents: GPTAssistantAPIThreadMessageContentVO[] = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().run_id, run.run_gpt_run_id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().role, GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageContentVO>();

            if (!message_contents || message_contents.length == 0) {
                ConsoleHandler.error('OseliaRunBGThread.update_oselia_run_state: No message contents found for run: ' + run.id); // warn ?
                return;
            }

            const messages: string = message_contents.map((message_content: GPTAssistantAPIThreadMessageContentVO) => {
                if (message_content.content_type_text) {
                    return message_content.content_type_text.value;
                }
                return '';
            }).join('\n\n');
            if (!messages) {
                ConsoleHandler.error('OseliaRunBGThread.update_oselia_run_state: No messages found for run: ' + run.id); // warn ?
                return;
            }

            // const instructions = "Fais un résumé adapté à une lecture audio naturelle et très synthétique des messages (c'est la réponse textuelle d'un assistant dans une discussion vocale)";
            // const response = await ModuleGPTServer.openai.audio.speech.create({
            //     model: "gpt-4o-mini-tts",
            //     voice: "shimmer",
            //     input: messages,
            //     instructions,
            // });

            const instructions = "Fais un résumé très synthétique adapté à une lecture audio naturelle des messages suivants :";
            const completion = await ModuleGPTServer.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: instructions },
                    { role: "user", content: messages }
                ],
                temperature: 0.3
            });

            const texteResume = completion.choices[0].message.content;

            const instructions_tts = "Lecture agréable, avenante, pro mais pas trop formelle.";
            const response = await ModuleGPTServer.openai.audio.speech.create({
                model: "gpt-4o-mini-tts",
                voice: "shimmer",
                input: texteResume,
                instructions: instructions_tts,
            });

            // await response.stream_to_file(speech_file_path); // Doc GPT mais j'ai pas cette fonction :)
            const buffer = Buffer.from(await response.arrayBuffer());
            await ModuleFileServer.getInstance().makeSureThisFolderExists(ModuleGPTServer.MESSAGE_OSELIA_RUN_SUMMARY_TTS_FILE_PATH);
            await ModuleFileServer.getInstance().writeFile(speech_file_path, buffer);

            file = new FileVO();
            file.path = speech_file_path;
            file.file_access_policy_name = ModuleGPT.POLICY_BO_ACCESS;
            file.is_secured = true;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(file);
            run.voice_summary_id = file.id;

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run);
        }
    }
}
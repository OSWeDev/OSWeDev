import { Thread } from 'openai/resources/beta/threads/threads';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaUserPromptVO from '../../../shared/modules/Oselia/vos/OseliaUserPromptVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';

export default class OseliaServerController {

    public static PROMPT_PARAM_PREFIX: string = '{{PROMPT_PARAM.';
    public static PROMPT_PARAM_SUFFIX: string = '}}';

    public static authorized_oselia_partners: string[] = [];

    public static has_authorization(partner_origin: string): boolean {
        for (const i in OseliaServerController.authorized_oselia_partners) {
            if (partner_origin.startsWith(OseliaServerController.authorized_oselia_partners[i])) {
                return true;
            }
        }
        return false;
    }

    public static wrap_param_name_for_prompt(param_name: string): string {
        return OseliaServerController.PROMPT_PARAM_PREFIX + param_name + OseliaServerController.PROMPT_PARAM_SUFFIX;
    }

    public static get_current_oselia_run(thread_vo: GPTAssistantAPIThreadVO): OseliaRunVO {
        if (!thread_vo) {
            return null;
        }

        /**
         * On le définit comme le dernier run en cours (donc non validé) ordonné par poids croissant
         */
        return thread_vo.current_oselia_run;
    }

    public static async prompt_oselia_by_prompt_name(
        prompt_name: string,
        prompt_parameters: { [param_name: string]: string },
        thread_title: string,
        thread: GPTAssistantAPIThreadVO = null,
        user_id: number = null,
        files: FileVO[] = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

        const prompt = await query(OseliaPromptVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaPromptVO>().name, prompt_name)
            .exec_as_server()
            .select_vo<OseliaPromptVO>();
        return await OseliaServerController.prompt_oselia(prompt, prompt_parameters, thread_title, thread, user_id, files);
    }

    public static async prompt_oselia(
        prompt: OseliaPromptVO,
        prompt_parameters: { [param_name: string]: string },
        thread_title: string,
        thread: GPTAssistantAPIThreadVO = null,
        user_id: number = null,
        files: FileVO[] = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

        try {

            const assistant = await this.get_prompt_assistant(prompt,);
            const prompt_string = await this.get_prompt_string(prompt, assistant, user_id, prompt_parameters, thread_title, thread);
            return await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread.gpt_thread_id,
                thread_title,
                prompt_string,
                files,
                user_id
            );
        } catch (error) {
            ConsoleHandler.error('Error in prompt_oselia', error);
        }

        return null;
    }

    public static async get_prompt_assistant(
        prompt: OseliaPromptVO,
    ): Promise<GPTAssistantAPIAssistantVO> {

        try {

            if ((!prompt) || (!prompt.prompt)) {
                ConsoleHandler.error('No prompt provided');
                return null;
            }

            let assistant: GPTAssistantAPIAssistantVO = null;
            if (prompt.default_assistant_id) {
                assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                    .filter_by_id(prompt.default_assistant_id)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIAssistantVO>();
            }

            return assistant;
        } catch (error) {
            ConsoleHandler.error('Error in get_prompt_assistant', error);
        }

        return null;
    }

    public static async get_prompt_string(
        prompt: OseliaPromptVO,
        assistant: GPTAssistantAPIAssistantVO,
        user_id: number,
        prompt_parameters: { [param_name: string]: string },
        thread_title: string,
        thread: GPTAssistantAPIThreadVO = null,
    ): Promise<string> {

        try {

            if ((!prompt) || (!prompt.prompt)) {
                ConsoleHandler.error('No prompt provided');
                return null;
            }

            let prompt_string = prompt.prompt;

            // le programme, c'est à partir de ce prompt et pour cet utilisateur, existe-t-il une version adaptée à cet utilisateur qui surcharge le comportement par défaut ?
            // si oui, on l'utilise
            if (user_id) {
                const user_prompt = await query(OseliaUserPromptVO.API_TYPE_ID)
                    .filter_by_id(prompt.id, OseliaPromptVO.API_TYPE_ID)
                    .filter_by_id(user_id, UserVO.API_TYPE_ID)
                    .exec_as_server()
                    .select_vo<OseliaUserPromptVO>();

                if ((!!user_prompt) && (!!user_prompt.adapted_prompt)) {
                    prompt_string = user_prompt.adapted_prompt;
                }
            }

            if (!prompt_string) {
                ConsoleHandler.error('No prompt string provided');
                return null;
            }

            if (!thread) {
                const new_thread: {
                    thread_gpt: Thread;
                    thread_vo: GPTAssistantAPIThreadVO;
                } = await GPTAssistantAPIServerController.get_thread(user_id);
                thread = new_thread.thread_vo;
            }

            if ((!!thread_title) && !thread.thread_title_auto_build_locked) {
                thread.thread_title = thread_title;
                thread.needs_thread_title_build = false;
                thread.thread_title_auto_build_locked = true;
            }

            // Si on a des paramètres on les ajoute aux metadatas du thread
            if (prompt_parameters) {
                if (!thread.metadata) {
                    thread.metadata = {};
                }
                for (const i in prompt_parameters) {
                    thread.metadata[i] = prompt_parameters[i];
                }
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread);
            }

            thread.current_oselia_prompt_id = prompt.id;
            if (assistant) {
                thread.current_default_assistant_id = assistant.id;
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread);

            return OseliaServerController.apply_prompt_parameters(prompt_string, prompt_parameters);
        } catch (error) {
            ConsoleHandler.error('Error in get_prompt_string', error);
        }

        return null;
    }

    public static apply_prompt_parameters(
        prompt_string_with_parameters: string,
        prompt_parameters: { [param_name: string]: string }): string {
        let res = prompt_string_with_parameters;

        for (const i in prompt_parameters) {
            res = res.split(OseliaServerController.PROMPT_PARAM_PREFIX + i + OseliaServerController.PROMPT_PARAM_SUFFIX).join(prompt_parameters[i]);
        }

        return res;
    }


    /**
     * La gestion d'un run Osélia, avec le split et la validation si besoin
     */
    public static async handle_run_oselia(run: OseliaRunVO) {

        if (!run) {
            return;
        }

        if (run.use_splitter) {
            await OseliaServerController.split_run(run);
        }

        await OseliaServerController.do_run(run);

        if (run.use_validator) {
            await OseliaServerController.validate_run(run);
        }
    }

    private static async split_run(run: OseliaRunVO) {

        if (!run) {
            return;
        }

        const split_prompt = '<Dans un premier temps, génère un plan d\'action en 1 ou plusieurs étapes (max 4), qui te serviront ensuite de prompts dans les prochains runs, pour répondre au mieux à cette demande. ' +
            'Le découpage doit être efficace, en utilisant le minimum d\'étapes pour répondre, et chaque étape doit être utile. Il est par exemple inutile de faire une étape pour se préparer à une demande à venir. ' +
            'Quand tu définis une étape, tu peux indiquer que l\'étape doit être validée. Dans ce cas, 2 runs seront lancés, 1 pour faire l\'action, et un second dans la foulée pour vérifier le résultat. ' +
            'Pour chaque étape tu dois définir un nom en moins de 50 caractères pour indiquer clairement ce que tu vas faire. ' +
            'Tu dois également définir si le prompt de l\'étape a une utilité à être affichée dans la discussion publiquement, ou si c\'est une étape intermédiaire dont le résultat est utile uniquement à ton raisonnement. ' +
            'Idem pour les outputs de l\'étape, si c\'est une étape intermédiaire, en indiquant true dans le paramètre hide_outputs, tu caches les outputs dans l\'interface, mais elles resteront visibles du point de vue de l\'assistant. ' +
            'Pour le moment tu ne dois fournir que le plan d\'action en appelant la fonction internal_splitter pour chaque étape à réaliser>';

        if ((!run.content_text) && (!run.prompt_id)) {
            ConsoleHandler.error('No content_text or prompt_id provided');
            return;
        }

        if (!run.assistant_id) {
            ConsoleHandler.error('No assistant_id provided');
            return;
        }

        const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_id(run.assistant_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            ConsoleHandler.error('No assistant found');
            return;
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

        const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(run.thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        let files: FileVO[] = null;
        if (run.file_id_ranges) {
            files = await query(FileVO.API_TYPE_ID)
                .filter_by_ids(run.file_id_ranges)
                .exec_as_server()
                .select_vos<FileVO>();
        }

        if (run.content_text) {
            await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread_vo.gpt_thread_id,
                run.thread_title,
                split_prompt + (run.content_text ? ' ' + run.content_text : ''),
                files,
                run.user_id,
                run.hide_prompt,
            );
        } else {
            const oselia_prompt = await query(OseliaPromptVO.API_TYPE_ID)
                .filter_by_id(run.prompt_id)
                .exec_as_server()
                .select_vo<OseliaPromptVO>();

            if (!oselia_prompt) {
                ConsoleHandler.error('No prompt found');
                return;
            }

            const prompt_string = await this.get_prompt_string(
                oselia_prompt,
                assistant,
                run.user_id,
                run.prompt_parameters,
                run.thread_title,
                thread_vo);
            return await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread_vo.gpt_thread_id,
                run.thread_title,
                split_prompt + (prompt_string ? ' ' + prompt_string : ''),
                files,
                run.user_id,
                run.hide_prompt,
            );
        }
    }


}
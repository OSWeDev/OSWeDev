import { Thread } from 'openai/resources/beta/threads/threads';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaThreadCacheVO from '../../../shared/modules/Oselia/vos/OseliaThreadCacheVO';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';
import OseliaUserPromptVO from '../../../shared/modules/Oselia/vos/OseliaUserPromptVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';

export default class OseliaServerController {

    public static PROMPT_PARAM_PREFIX: string = '{{PROMPT_PARAM.';
    public static PROMPT_PARAM_SUFFIX: string = '}}';

    public static CACHE_PARAM_PREFIX: string = '{{CACHE_PARAM.';
    public static CACHE_PARAM_SUFFIX: string = '}}';

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
        return OseliaServerController.prompt_oselia(prompt, prompt_parameters, thread_title, thread, user_id, files);
    }

    public static async prompt_oselia(
        prompt: OseliaPromptVO,
        prompt_parameters: { [param_name: string]: string },
        thread_title: string,
        thread: GPTAssistantAPIThreadVO = null,
        user_id: number = null,
        files: FileVO[] = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

        try {

            const assistant = await this.get_prompt_assistant(prompt);
            const prompt_string = await this.get_prompt_string(prompt, assistant, user_id, prompt_parameters, thread_title, thread);
            return await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread ? thread.gpt_thread_id : null,
                thread_title,
                prompt_string,
                files,
                user_id
            );
        } catch (error) {
            ConsoleHandler.error('Error in prompt_oselia:' + error + ':' + JSON.stringify(error) + ':' + JSON.stringify(prompt) + ':' + JSON.stringify(prompt_parameters) + ':' + thread_title);
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
            ConsoleHandler.error('Error in get_prompt_assistant' + error + ':' + JSON.stringify(error));
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

            prompt_string = await OseliaServerController.apply_cache_parameters(prompt_string, thread);
            prompt_string = OseliaServerController.apply_prompt_parameters(prompt_string, prompt_parameters);

            return prompt_string;
        } catch (error) {
            ConsoleHandler.error('Error in get_prompt_string' + error + ':' + JSON.stringify(error));
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

    public static async get_cache_datas(thread: GPTAssistantAPIThreadVO): Promise<{ [param_name: string]: string }> {
        /**
         * On charge le cache des threads parents, puis du courant qui surcharge
         */

        if (!thread) {
            return {};
        }

        let cache_datas: { [param_name: string]: string } = {};
        if (thread.parent_thread_id) {
            const parent_thread: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(thread.parent_thread_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadVO>();

            if (!parent_thread) {
                throw new Error('OseliaServerController:get_cache_datas:Parent thread not found !');
            }

            cache_datas = await OseliaServerController.get_cache_datas(parent_thread);
        }

        const this_thread_cache_datas_entries: OseliaThreadCacheVO[] = await query(OseliaThreadCacheVO.API_TYPE_ID)
            .filter_by_id(thread.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<OseliaThreadCacheVO>();

        for (const i in this_thread_cache_datas_entries) {
            const entry = this_thread_cache_datas_entries[i];
            cache_datas[entry.key] = entry.value;
        }

        return cache_datas;
    }

    public static async apply_cache_parameters(
        prompt_string_with_cache_parameters: string,
        thread: GPTAssistantAPIThreadVO,
    ): Promise<string> {
        const cache_datas: { [param_name: string]: string } = await OseliaServerController.get_cache_datas(thread);
        const regExp = new RegExp('{{CACHE_PARAM[.]([^}]*)}}', 'i');
        while (regExp.test(prompt_string_with_cache_parameters)) {
            const regexpres: string[] = regExp.exec(prompt_string_with_cache_parameters);
            let varname: string = regexpres[1];
            varname = varname ? varname.toLowerCase() : varname;

            if (varname && (cache_datas[varname] != null)) {
                prompt_string_with_cache_parameters = prompt_string_with_cache_parameters.replace(regExp, cache_datas[varname]);
            } else {
                prompt_string_with_cache_parameters = prompt_string_with_cache_parameters.replace(regExp, '');
            }
        }

        return prompt_string_with_cache_parameters;
    }

    public static async get_self_referrer(): Promise<OseliaReferrerVO> {
        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_origin, ConfigurationService.node_configuration.base_url)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            ConsoleHandler.error('OseliaServerController:get_self_referrer:Referrer SELF not found !');
            throw new Error('OseliaServerController:get_self_referrer:Referrer SELF not found !');
        }

        return referrer;
    }

    public static async link_thread_to_referrer(thread: GPTAssistantAPIThreadVO, referrer: OseliaReferrerVO) {

        const thread_referrer: OseliaThreadReferrerVO = new OseliaThreadReferrerVO();
        thread_referrer.thread_id = thread.id;
        thread_referrer.referrer_id = referrer.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_referrer);
    }
}
import { Thread } from 'openai/resources/beta/threads/threads';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaUserPromptVO from '../../../shared/modules/Oselia/vos/OseliaUserPromptVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';

export default class OseliaServerController {

    public static async prompt_oselia_by_prompt_name(
        prompt_name: string,
        prompt_parameters: { [param_name: string]: string },
        thread: GPTAssistantAPIThreadVO,
        user_id: number = null,
        files: FileVO[] = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

        let prompt = await query(OseliaPromptVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaPromptVO>().name, prompt_name)
            .exec_as_server()
            .select_vo<OseliaPromptVO>();
        return await OseliaServerController.prompt_oselia(prompt, prompt_parameters, thread, user_id, files);
    }

    public static async prompt_oselia(
        prompt: OseliaPromptVO,
        prompt_parameters: { [param_name: string]: string },
        thread: GPTAssistantAPIThreadVO,
        user_id: number = null,
        files: FileVO[] = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

        try {

            if ((!prompt) || (!prompt.prompt)) {
                ConsoleHandler.error('No prompt provided');
                return null;
            }

            let prompt_string = prompt.prompt;

            // le programme, c'est à partir de ce prompt et pour cet utilisateur, existe-t-il une version adaptée à cet utilisateur qui surcharge le comportement par défaut ?
            // si oui, on l'utilise
            if (!!user_id) {
                let user_prompt = await query(OseliaUserPromptVO.API_TYPE_ID)
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

            let assistant: GPTAssistantAPIAssistantVO = null;
            if (prompt.default_assistant_id) {
                assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                    .filter_by_id(prompt.default_assistant_id)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIAssistantVO>();
            }

            if (!thread) {
                let new_thread: {
                    thread_gpt: Thread;
                    thread_vo: GPTAssistantAPIThreadVO;
                } = await GPTAssistantAPIServerController.get_thread(user_id);
                thread = new_thread.thread_vo;
            }

            thread.current_oselia_prompt_id = prompt.id;
            if (assistant) {
                thread.current_default_assistant_id = assistant.id;
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread);

            prompt_string = OseliaServerController.apply_prompt_parameters(prompt_string, prompt_parameters);
            await GPTAssistantAPIServerController.ask_assistant(
                assistant.gpt_assistant_id,
                thread.gpt_thread_id,
                prompt_string,
                files,
                user_id
            );
        } catch (error) {
            ConsoleHandler.error('Error in prompt_oselia', error);
        }
    }

    public static apply_prompt_parameters(
        prompt_string_with_parameters: string,
        prompt_parameters: { [param_name: string]: string }): string {
        let res = prompt_string_with_parameters;

        for (let i in prompt_parameters) {
            res = res.split('{' + i + '}').join(prompt_parameters[i]);
        }

        return res;
    }
}
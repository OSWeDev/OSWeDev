import { createReadStream, writeFileSync } from 'fs';
import { FileObject } from 'openai/resources';
import { Assistant } from 'openai/resources/beta/assistants/assistants';
import { Message, MessageCreateParams } from 'openai/resources/beta/threads/messages/messages';
import { Run, RunCreateParams } from 'openai/resources/beta/threads/runs/runs';
import { Thread } from 'openai/resources/beta/threads/threads';
import { Uploadable } from 'openai/uploads';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunUsageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunUsageVO';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import FileServerController from '../File/FileServerController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleVersionedServer from '../Versioned/ModuleVersionedServer';
import ModuleGPTServer from './ModuleGPTServer';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaReferrerExternalAPIVO from '../../../shared/modules/Oselia/vos/OseliaReferrerExternalAPIVO';
import ModuleOseliaServer from '../Oselia/ModuleOseliaServer';
import ExternalAPIServerController from '../API/ExternalAPIServerController';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';

export default class GPTAssistantAPIServerController {

    public static async get_file(file_id: string): Promise<{ file_gpt: FileObject, assistant_file_vo: GPTAssistantAPIFileVO }> {

        try {

            const file_gpt = await ModuleGPTServer.openai.files.retrieve(file_id);

            const assistant_file_vo = await GPTAssistantAPIServerController.check_or_create_assistant_file_vo(file_gpt);
            return { file_gpt, assistant_file_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.get_file: ' + error);
        }
        return null;
    }

    public static async send_file(file_vo: FileVO, purpose: number): Promise<{ file_gpt: FileObject, assistant_file_vo: GPTAssistantAPIFileVO }> {

        try {

            const file_gpt = await ModuleGPTServer.openai.files.create({
                purpose: GPTAssistantAPIFileVO.PURPOSE_LABELS[purpose] as 'fine-tune' | 'assistants',
                file: createReadStream(file_vo.path) as unknown as Uploadable
            });

            const assistant_file_vo = new GPTAssistantAPIFileVO();
            assistant_file_vo.gpt_file_id = file_gpt.id;
            assistant_file_vo.bytes = file_gpt.bytes;
            assistant_file_vo.created_at = file_gpt.created_at;
            assistant_file_vo.filename = file_gpt.filename;
            assistant_file_vo.purpose = GPTAssistantAPIFileVO.PURPOSE_LABELS.indexOf(file_gpt.purpose);
            assistant_file_vo.status = GPTAssistantAPIFileVO.STATUS_LABELS.indexOf(file_gpt.status);
            assistant_file_vo.file_id = file_vo.id;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_file_vo);

            return { file_gpt, assistant_file_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.get_file: ' + error);
        }
        return null;
    }

    public static async get_assistant(assistant_id: string): Promise<{ assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO }> {

        try {

            const assistant_gpt = await ModuleGPTServer.openai.beta.assistants.retrieve(assistant_id);

            // On crée l'assistant en base si il n'existe pas, sinon on le charge simplement pour faire le lien avec les messages
            const assistant_vo = await GPTAssistantAPIServerController.check_or_create_assistant_vo(assistant_gpt);
            return { assistant_gpt, assistant_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.getAssistant: ' + error);
        }
        return null;
    }

    /**
     * On cherche l'assistant qui ferait référence à ce prompt chez nous, et on le crée si il n'existe pas
     * On le crée donc aussi chez OpenAI si il n'existe pas, et on rattache l'assistant au prompt
     * @returns
     */
    public static async get_or_create_assistant_by_prompt(assistant_id: string): Promise<{ assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO }> {

        try {

            const assistant_gpt = await ModuleGPTServer.openai.beta.assistants.retrieve(assistant_id);

            // On crée l'assistant en base si il n'existe pas, sinon on le charge simplement pour faire le lien avec les messages
            const assistant_vo = await GPTAssistantAPIServerController.check_or_create_assistant_vo(assistant_gpt);
            return { assistant_gpt, assistant_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.getAssistant: ' + error);
        }
        return null;
    }

    public static async get_thread(user_id: number = null, thread_id: string = null, current_default_assistant_id: number = null): Promise<{ thread_gpt: Thread, thread_vo: GPTAssistantAPIThreadVO }> {

        try {

            let thread_gpt: Thread = null;
            if (!thread_id) {
                thread_gpt = await ModuleGPTServer.openai.beta.threads.create();
            } else {
                thread_gpt = await ModuleGPTServer.openai.beta.threads.retrieve(thread_id);
            }

            if (!thread_gpt) {
                return null;
            }

            // On crée le thread en base si il n'existe pas, sinon on le charge simplement pour faire le lien avec les messages
            const thread_vo = await GPTAssistantAPIServerController.check_or_create_thread_vo(thread_gpt, user_id, current_default_assistant_id);
            return { thread_gpt, thread_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.getThread: ' + error);
        }

        return null;
    }

    public static async update_run_if_needed(run_vo: GPTAssistantAPIRunVO, run_gpt: Run) {
        /**
         * On met à jour au besoin le run en base
         *         run_vo.created_at = run_gpt.created_at;
         *         run_vo.gpt_thread_id = run_gpt.thread_id;
         *         run_vo.gpt_assistant_id = run_gpt.assistant_id;
         *         run_vo.status = run_gpt.status;
         *         run_vo.required_action = run_gpt.required_action;
         *         run_vo.last_error = run_gpt.last_error;
         *         run_vo.expires_at = run_gpt.expires_at;
         *         run_vo.started_at = run_gpt.started_at;
         *         run_vo.cancelled_at = run_gpt.cancelled_at;
         *         run_vo.failed_at = run_gpt.failed_at;
         *         run_vo.completed_at = run_gpt.completed_at;
         *         run_vo.model = run_gpt.model;
         *         run_vo.instructions = run_gpt.instructions;
         *         run_vo.tools = run_gpt.tools;
         *         run_vo.file_ids = run_gpt.file_ids;
         *         run_vo.metadata = run_gpt.metadata;
         *         run_vo.temperature = run_gpt.temperature;
         */
        let has_modifs = false;
        if (run_vo.created_at != run_gpt.created_at) {
            run_vo.created_at = run_gpt.created_at;
            has_modifs = true;
        }
        if (run_vo.gpt_thread_id != run_gpt.thread_id) {
            run_vo.gpt_thread_id = run_gpt.thread_id;
            has_modifs = true;
        }
        if (run_vo.gpt_assistant_id != run_gpt.assistant_id) {
            run_vo.gpt_assistant_id = run_gpt.assistant_id;
            has_modifs = true;
        }
        if (run_vo.status != run_gpt.status) {
            run_vo.status = run_gpt.status;
            has_modifs = true;
        }
        if (run_vo.required_action != run_gpt.required_action) {
            run_vo.required_action = run_gpt.required_action;
            has_modifs = true;
        }
        if (run_vo.last_error != run_gpt.last_error) {
            run_vo.last_error = run_gpt.last_error;
            has_modifs = true;
        }
        if (run_vo.expires_at != run_gpt.expires_at) {
            run_vo.expires_at = run_gpt.expires_at;
            has_modifs = true;
        }
        if (run_vo.started_at != run_gpt.started_at) {
            run_vo.started_at = run_gpt.started_at;
            has_modifs = true;
        }
        if (run_vo.cancelled_at != run_gpt.cancelled_at) {
            run_vo.cancelled_at = run_gpt.cancelled_at;
            has_modifs = true;
        }
        if (run_vo.failed_at != run_gpt.failed_at) {
            run_vo.failed_at = run_gpt.failed_at;
            has_modifs = true;
        }
        if (run_vo.completed_at != run_gpt.completed_at) {
            run_vo.completed_at = run_gpt.completed_at;
            has_modifs = true;
        }
        if (run_vo.model != run_gpt.model) {
            run_vo.model = run_gpt.model;
            has_modifs = true;
        }
        if (run_vo.instructions != run_gpt.instructions) {
            run_vo.instructions = run_gpt.instructions;
            has_modifs = true;
        }
        if (run_vo.tools != run_gpt.tools) {
            run_vo.tools = run_gpt.tools;
            has_modifs = true;
        }
        if (run_vo.file_ids != run_gpt.file_ids) {
            run_vo.file_ids = run_gpt.file_ids;
            has_modifs = true;
        }
        if (run_vo.metadata != run_gpt.metadata) {
            run_vo.metadata = run_gpt.metadata;
            has_modifs = true;
        }
        if (run_vo.temperature != run_gpt.temperature) {
            run_vo.temperature = run_gpt.temperature;
            has_modifs = true;
        }

        if (has_modifs) {
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);
        }

        if (run_gpt.usage) {

            has_modifs = false;
            let usage = await query(GPTAssistantAPIRunUsageVO.API_TYPE_ID)
                .filter_by_id(run_vo.id, GPTAssistantAPIRunVO.API_TYPE_ID)
                .exec_as_server()
                .select_vo<GPTAssistantAPIRunUsageVO>();

            if (!usage) {
                usage = new GPTAssistantAPIRunUsageVO();
                usage.run_id = run_vo.id;
                usage.completion_tokens = run_gpt.usage.completion_tokens;
                usage.prompt_tokens = run_gpt.usage.prompt_tokens;
                usage.total_tokens = run_gpt.usage.total_tokens;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(usage);
            } else {

                if (usage.completion_tokens != run_gpt.usage.completion_tokens) {
                    usage.completion_tokens = run_gpt.usage.completion_tokens;
                    has_modifs = true;
                }

                if (usage.prompt_tokens != run_gpt.usage.prompt_tokens) {
                    usage.prompt_tokens = run_gpt.usage.prompt_tokens;
                    has_modifs = true;
                }

                if (usage.total_tokens != run_gpt.usage.total_tokens) {
                    usage.total_tokens = run_gpt.usage.total_tokens;
                    has_modifs = true;
                }

                if (has_modifs) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(usage);
                }
            }
        }

        return run_vo;
    }

    /**
     *
     * @param thread_vo
     * @param message Les file_ids seront remplis automatiquement ici si on a des files
     * @param files Les fichiers qu'on veut associer à la demande. Attention : limité à 10 fichiers dans l'API GPT pour le moment
     * @returns
     */
    public static async push_message(
        thread_vo: GPTAssistantAPIThreadVO,
        content: string,
        files: FileVO[],
        user_id: number = null): Promise<{ message_gpt: Message, message_vo: GPTAssistantAPIThreadMessageVO }> {

        try {

            const assistant_files: GPTAssistantAPIFileVO[] = [];
            const file_ids: string[] = [];
            for (const i in files) {
                const file = files[i];

                // On regarde si le fichier est déjà associé à un assistant_file_vo
                const assistant_file_vo = await query(GPTAssistantAPIFileVO.API_TYPE_ID).filter_by_id(file.id, FileVO.API_TYPE_ID).exec_as_server().select_vo<GPTAssistantAPIFileVO>();
                if (assistant_file_vo) {
                    assistant_files.push(assistant_file_vo);
                    file_ids.push(assistant_file_vo.gpt_file_id);
                    continue;
                }

                // On doit push le fichier sur l'API GPT
                const file_w = await GPTAssistantAPIServerController.send_file(file, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS);
                if (!file_w) {
                    continue;
                }

                assistant_files.push(file_w.assistant_file_vo);
                file_ids.push(file_w.assistant_file_vo.gpt_file_id);
            }

            const message: MessageCreateParams = {
                content,
                file_ids,
                role: 'user'
            };

            const message_gpt = await ModuleGPTServer.openai.beta.threads.messages.create(
                thread_vo.gpt_thread_id,
                message
            );

            if (!message_gpt) {
                return null;
            }

            const message_vo = new GPTAssistantAPIThreadMessageVO();
            message_vo.gpt_message_id = message_gpt.id;
            message_vo.date = message_gpt.created_at;

            switch (message.role) {
                case 'user':
                    message_vo.role_type = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER;
                    break;
                default:
                    message_vo.role_type = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
                    message_vo.assistant_id = thread_vo.current_oselia_assistant_id;
                    break;
            }
            message_vo.prompt_id = thread_vo.current_oselia_prompt_id;
            message_vo.thread_id = thread_vo.id;
            message_vo.user_id = user_id ? user_id : thread_vo.user_id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(message_vo);

            if (message_gpt.content && Array.isArray(message_gpt.content)) {
                let weight = 0;

                for (const i in message_gpt.content) {
                    const message_gpt_content = message_gpt.content[i];

                    switch (message_gpt_content.type) {
                        case 'image_file':
                            const image_message_content = new GPTAssistantAPIThreadMessageContentVO();
                            const assistant_file = await GPTAssistantAPIServerController.get_file(message_gpt_content.image_file.file_id);
                            image_message_content.assistant_file_id = assistant_file.assistant_file_vo.id;
                            image_message_content.thread_message_id = message_vo.id;
                            image_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
                            image_message_content.weight = weight++;
                            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_message_content);
                            break;

                        case 'text':
                        default:
                            const text_message_content = new GPTAssistantAPIThreadMessageContentVO();
                            text_message_content.value = message_gpt_content.text.value;
                            text_message_content.annotations = []; // TODO FIXME : content.text.annotations;
                            text_message_content.thread_message_id = message_vo.id;
                            text_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
                            text_message_content.weight = weight++;
                            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(text_message_content);
                            break;
                    }
                }
            }

            return { message_gpt, message_vo };
        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.push_message: ' + error);
        }

        return null;
    }

    public static async check_or_create_assistant_vo(assistant: Assistant): Promise<GPTAssistantAPIAssistantVO> {

        if (!assistant) {
            return null;
        }

        let assistant_vo = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, assistant.id).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();
        if (assistant_vo) {
            return assistant_vo;
        }

        assistant_vo = new GPTAssistantAPIAssistantVO();
        assistant_vo.gpt_assistant_id = assistant.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_vo);

        return assistant_vo;
    }

    public static async check_or_create_thread_vo(thread_gpt: Thread, user_id: number = null, current_default_assistant_id: number = null): Promise<GPTAssistantAPIThreadVO> {

        if (!thread_gpt) {
            return null;
        }

        let thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, thread_gpt.id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>();
        if (thread_vo) {

            if (thread_vo.current_default_assistant_id != current_default_assistant_id) {
                thread_vo.current_default_assistant_id = current_default_assistant_id;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);
            }

            return thread_vo;
        }

        thread_vo = new GPTAssistantAPIThreadVO();
        thread_vo.gpt_thread_id = thread_gpt.id;
        thread_vo.user_id = user_id ? user_id : await ModuleVersionedServer.getInstance().get_robot_user_id();
        thread_vo.current_default_assistant_id = current_default_assistant_id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);

        return thread_vo;
    }

    public static async check_or_create_run_vo(run_gpt: Run): Promise<GPTAssistantAPIRunVO> {

        if (!run_gpt) {
            return null;
        }

        let run_vo = await query(GPTAssistantAPIRunVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_run_id, run_gpt.id).exec_as_server().select_vo<GPTAssistantAPIRunVO>();
        if (run_vo) {

            return GPTAssistantAPIServerController.update_run_if_needed(run_vo, run_gpt);
        }

        const assistant_vo = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, run_gpt.assistant_id).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();
        if (!assistant_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_run_vo: assistant not found: ' + run_gpt.assistant_id);
            return null;
        }

        const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, run_gpt.thread_id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>();
        if (!thread_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_run_vo: thread not found: ' + run_gpt.thread_id);
            return null;
        }

        run_vo = new GPTAssistantAPIRunVO();
        run_vo.gpt_run_id = run_gpt.id;
        run_vo.assistant_id = assistant_vo.id;
        run_vo.thread_id = thread_vo.id;

        run_vo.created_at = run_gpt.created_at;
        run_vo.gpt_thread_id = run_gpt.thread_id;
        run_vo.gpt_assistant_id = run_gpt.assistant_id;
        run_vo.status = run_gpt.status;
        run_vo.required_action = run_gpt.required_action;
        run_vo.last_error = run_gpt.last_error;
        run_vo.expires_at = run_gpt.expires_at;
        run_vo.started_at = run_gpt.started_at;
        run_vo.cancelled_at = run_gpt.cancelled_at;
        run_vo.failed_at = run_gpt.failed_at;
        run_vo.completed_at = run_gpt.completed_at;
        run_vo.model = run_gpt.model;
        run_vo.instructions = run_gpt.instructions;
        run_vo.tools = run_gpt.tools;
        run_vo.file_ids = run_gpt.file_ids;
        run_vo.metadata = run_gpt.metadata;
        run_vo.temperature = run_gpt.temperature;

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);

        if (run_gpt.usage) {
            const usage = new GPTAssistantAPIRunUsageVO();
            usage.run_id = run_vo.id;
            usage.completion_tokens = run_gpt.usage.completion_tokens;
            usage.prompt_tokens = run_gpt.usage.prompt_tokens;
            usage.total_tokens = run_gpt.usage.total_tokens;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(usage);
        }

        return run_vo;
    }

    public static async check_or_create_message_vo(
        message_gpt: Message,
        thread_vo: GPTAssistantAPIThreadVO,
        user_id: number = null): Promise<GPTAssistantAPIThreadMessageVO> {

        if (!message_gpt) {
            return null;
        }

        if (!thread_vo) {
            return null;
        }

        let message_vo = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadMessageVO>().gpt_message_id, message_gpt.id).exec_as_server().select_vo<GPTAssistantAPIThreadMessageVO>();
        if (message_vo) {
            return message_vo;
        }

        let run: GPTAssistantAPIRunVO = null;
        if (message_gpt.run_id) {

            const run_gpt = await ModuleGPTServer.openai.beta.threads.runs.retrieve(thread_vo.gpt_thread_id, message_gpt.run_id);
            run = await GPTAssistantAPIServerController.check_or_create_run_vo(run_gpt);
        }

        message_vo = new GPTAssistantAPIThreadMessageVO();
        message_vo.gpt_message_id = message_gpt.id;
        message_vo.date = message_gpt.created_at;
        message_vo.run_id = run ? run.id : null;
        message_vo.assistant_id = run ? run.assistant_id : null;
        message_vo.thread_id = thread_vo.id;
        message_vo.user_id = user_id ? user_id : thread_vo.user_id;
        message_vo.prompt_id = thread_vo.current_oselia_prompt_id;
        message_vo.role_type = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_LABELS.indexOf(message_gpt.role);

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(message_vo);

        if (message_gpt.content && Array.isArray(message_gpt.content)) {
            let weight = 0;
            for (const i in message_gpt.content) {
                const content = message_gpt.content[i];

                switch (content.type) {
                    case 'image_file':
                        const image_message_content = new GPTAssistantAPIThreadMessageContentVO();
                        const assistant_file = await GPTAssistantAPIServerController.get_file(content.image_file.file_id);
                        image_message_content.assistant_file_id = assistant_file.assistant_file_vo.id;
                        image_message_content.thread_message_id = message_vo.id;
                        image_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
                        image_message_content.weight = weight++;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_message_content);
                        break;

                    case 'text':
                    default:
                        const text_message_content = new GPTAssistantAPIThreadMessageContentVO();
                        text_message_content.value = content.text.value;
                        text_message_content.annotations = []; // TODO FIXME : content.text.annotations;
                        text_message_content.thread_message_id = message_vo.id;
                        text_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
                        text_message_content.weight = weight++;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(text_message_content);
                        break;
                }
            }
        }

        return message_vo;
    }

    public static async check_or_create_assistant_file_vo(file_gpt: FileObject): Promise<GPTAssistantAPIFileVO> {

        if (!file_gpt) {
            return null;
        }

        let assistant_file_vo = await query(GPTAssistantAPIFileVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, file_gpt.id).exec_as_server().select_vo<GPTAssistantAPIFileVO>();
        if (assistant_file_vo) {
            return assistant_file_vo;
        }

        assistant_file_vo = new GPTAssistantAPIFileVO();
        assistant_file_vo.gpt_file_id = file_gpt.id;
        assistant_file_vo.bytes = file_gpt.bytes;
        assistant_file_vo.created_at = file_gpt.created_at;
        assistant_file_vo.filename = file_gpt.filename;
        assistant_file_vo.purpose = GPTAssistantAPIFileVO.PURPOSE_LABELS.indexOf(file_gpt.purpose);
        assistant_file_vo.status = GPTAssistantAPIFileVO.STATUS_LABELS.indexOf(file_gpt.status);

        try {

            const gpt_file_content = await ModuleGPTServer.openai.files.content(file_gpt.id);
            console.log(gpt_file_content.headers);
            const bufferView = new Uint8Array(await gpt_file_content.arrayBuffer());

            const vo_file_name = 'gpt_' + file_gpt.id + '_' + assistant_file_vo.id + '_' + assistant_file_vo.filename;

            const folder = './sfiled/gpt_assistant_files/';
            await FileServerController.getInstance().makeSureThisFolderExists(folder);
            writeFileSync(folder + vo_file_name, bufferView);

            const file_vo = new FileVO();
            file_vo.file_access_policy_name = ModuleGPT.POLICY_ASSISTANT_FILES_ACCESS;
            file_vo.is_secured = true;
            file_vo.path = folder + vo_file_name;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file_vo);

            assistant_file_vo.file_id = file_vo.id;
        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_file_vo: Failed to get file content: ' + error);
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_file_vo);

        return assistant_file_vo;
    }

    /**
     * Demander un run d'un assistant suite à un nouveau message
     * @param assistant_id id de l'assistant au sens de l'API GPT
     * @param thread_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
     * @param content contenu text du nouveau message
     * @param files ATTENTION : Limité à 10 fichiers dans l'API GPT pour le moment
     * @returns
     */
    public static async ask_assistant(
        assistant_id: string,
        thread_id: string,
        content: string,
        files: FileVO[],
        user_id: number = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

        const assistant: { assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO } = await GPTAssistantAPIServerController.get_assistant(assistant_id);

        if ((!assistant) || (!assistant.assistant_gpt) || (!assistant.assistant_vo)) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: assistant (gpt or vo) not found: ' + assistant_id);
            return null;
        }

        // On récupère les fonctions configurées sur cet assistant
        const availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO } = {};
        const availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] } = {};
        const functions: GPTAssistantAPIFunctionVO[] = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_id(assistant.assistant_vo.id, GPTAssistantAPIAssistantVO.API_TYPE_ID).using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIFunctionVO>();
        const functions_params: GPTAssistantAPIFunctionParamVO[] = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_id(assistant.assistant_vo.id, GPTAssistantAPIAssistantVO.API_TYPE_ID).using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID).using(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .set_sort(new SortByVO(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().weight, true))
            .exec_as_server()
            .select_vos<GPTAssistantAPIFunctionParamVO>();

        for (const i in functions_params) {
            const function_param = functions_params[i];

            if (!availableFunctionsParameters[function_param.function_id]) {
                availableFunctionsParameters[function_param.function_id] = [];
            }

            availableFunctionsParameters[function_param.function_id].push(function_param);
        }

        for (const i in functions) {
            const functionVO = functions[i];

            availableFunctions[functionVO.gpt_function_name] = functionVO;
        }

        const thread: { thread_gpt: Thread, thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread(user_id, thread_id, assistant.assistant_vo.id);

        if ((!thread) || (!thread.thread_gpt) || (!thread.thread_vo)) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: thread (gpt or vo) not created');
            return null;
        }

        // On indique que Osélia est en train de travailler sur cette discussion
        thread.thread_vo.oselia_is_running = true;
        thread.thread_vo.current_oselia_assistant_id = assistant.assistant_vo.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread.thread_vo);

        const asking_message: {
            message_gpt: Message;
            message_vo: GPTAssistantAPIThreadMessageVO;
        } = await GPTAssistantAPIServerController.push_message(
            thread.thread_vo,
            content,
            files,
            user_id
        );

        //  La discussion est en place, on peut demander à l'assistant de répondre
        const run_params: RunCreateParams = {
            assistant_id: assistant.assistant_gpt.id
        };

        let run = await ModuleGPTServer.openai.beta.threads.runs.create(
            thread.thread_gpt.id,
            run_params
        );

        // On récupère aussi les informations liées au referrer si il y en a un, de manière à préparer l'exécution des fonctions du referre si on en a
        // TODO FIXME : on ne prend en compte que le dernier referrer pour le moment
        const referrer: OseliaReferrerVO =
            await query(OseliaReferrerVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaThreadReferrerVO>().thread_id, thread.thread_vo.id, OseliaThreadReferrerVO.API_TYPE_ID)
                .set_sort(new SortByVO(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().id, false))
                .exec_as_server()
                .set_limit(1)
                .select_vo<OseliaReferrerVO>();
        const referrer_external_apis: OseliaReferrerExternalAPIVO[] = referrer ?
            await query(OseliaReferrerExternalAPIVO.API_TYPE_ID)
                .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<OseliaReferrerExternalAPIVO>()
            : [];
        const referrer_external_api_by_name: { [api_name: string]: OseliaReferrerExternalAPIVO } = {};

        for (const i in referrer_external_apis) {
            const referrer_external_api = referrer_external_apis[i];
            referrer_external_api_by_name[referrer_external_api.name] = referrer_external_api;
        }

        while (run.status != "completed") {

            switch (run.status) {
                case "cancelled":
                case "cancelling":
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run cancelled');
                    await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);
                    return null;
                case "expired":
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run expired');
                    await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);
                    return null;
                case "failed":
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run failed');
                    await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);
                    return null;
                case "requires_action":

                    // On doit appeler la fonction suivante pour que l'assistant puisse répondre
                    if (run.required_action && run.required_action.type == 'submit_tool_outputs') {

                        const tool_outputs = [];
                        const promises = [];

                        for (const tooli in run.required_action.submit_tool_outputs.tool_calls) {
                            const tool_call = run.required_action.submit_tool_outputs.tool_calls[tooli];

                            promises.push((async () => {
                                let function_response = null;

                                try {

                                    const function_vo: GPTAssistantAPIFunctionVO = availableFunctions[tool_call.function.name];
                                    const function_args = JSON.parse(tool_call.function.arguments);

                                    if (!function_vo) {

                                        // si on a un referrer et des externals apis, on peut tenter de trouver dans ses fonctions
                                        if (referrer_external_api_by_name && referrer_external_api_by_name[tool_call.function.name]) {
                                            const referrer_external_api = referrer_external_api_by_name[tool_call.function.name];

                                            try {
                                                function_response = await ExternalAPIServerController.call_external_api(
                                                    (referrer_external_api.external_api_method == OseliaReferrerExternalAPIVO.API_METHOD_GET) ? 'get' : 'post',
                                                    referrer_external_api.external_api_url,
                                                    function_args,
                                                    referrer_external_api.external_api_authentication_id
                                                );

                                                if (!function_response) {
                                                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - function_response null or undefined. Simulating ERROR response.');
                                                    function_response = "FAILED";
                                                }

                                                tool_outputs.push({
                                                    tool_call_id: tool_call.id,
                                                    output: function_response,
                                                });
                                                return;
                                            } catch (error) {
                                                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - Failed REFERRER ExternalAPI Call - referrer - ' +
                                                    referrer.name + ' - external api name - ' + referrer_external_api.name + ' - error: ' + error);
                                                function_response = "TECHNICAL MALFUNCTION : REFERRER ExternalAPI Call Failed.";
                                                throw new Error('Failed REFERRER ExternalAPI Call - referrer - ' +
                                                    referrer.name + ' - external api name - ' + referrer_external_api.name + ' - error: ' + error);
                                            }
                                        }

                                        function_response = "UNKNOWN_FUNCTION : Check the name and retry.";
                                        throw new Error('function_vo not found: ' + tool_call.function.name);
                                    }

                                    const function_to_call: () => Promise<any> = ModulesManager.getInstance().getModuleByNameAndRole(function_vo.module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME)[function_vo.module_function];
                                    const ordered_args = function_vo.ordered_function_params_from_GPT_arguments(function_vo, thread.thread_vo, function_args, availableFunctionsParameters[function_vo.id]);
                                    function_response = await function_to_call.call(null, ...ordered_args);

                                    if (!function_response) {
                                        ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - function_response null or undefined. Simulating ERROR response.');
                                        function_response = "FAILED";
                                    }
                                } catch (error) {
                                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - error: ' + error);
                                }

                                tool_outputs.push({
                                    tool_call_id: tool_call.id,
                                    output: function_response,
                                });
                            })());
                        }

                        await all_promises(promises);

                        // Submit tool outputs
                        await ModuleGPTServer.openai.beta.threads.runs.submitToolOutputs(
                            thread.thread_gpt.id,
                            run.id,
                            { tool_outputs: tool_outputs }
                        );
                        break;

                    } else {
                        ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - type not supported: ' + run.required_action.type);
                        await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);
                        return null;
                    }

                case "queued":
                case "in_progress":
                default:
                    break;
            }

            await ThreadHandler.sleep(1000, 'GPTAssistantAPIServerController.ask_assistant');
            run = await ModuleGPTServer.openai.beta.threads.runs.retrieve(
                thread.thread_gpt.id,
                run.id
            );

            if (!run) {
                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run not found');
                await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);
                return null;
            }
        }

        // Par défaut ça charge les 20 derniers messages, et en ajoutant after on a les messages après le asking_message - donc les réponses finalement
        const thread_messages = await ModuleGPTServer.openai.beta.threads.messages.list(thread.thread_gpt.id, {
            before: asking_message.message_gpt.id
        });

        const res: GPTAssistantAPIThreadMessageVO[] = [];

        for (const i in thread_messages.data) {
            const thread_message: Message = thread_messages.data[i];

            res.push(await GPTAssistantAPIServerController.check_or_create_message_vo(thread_message, thread.thread_vo));
        }

        await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);

        return res;
    }

    private static async close_thread_oselia(thread_vo: GPTAssistantAPIThreadVO) {
        thread_vo.oselia_is_running = false;
        thread_vo.current_oselia_assistant_id = null;
        thread_vo.current_oselia_prompt_id = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);
    }
}
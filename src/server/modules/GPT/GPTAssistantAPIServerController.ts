import { Thread } from 'openai/resources/beta/threads/threads';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageAttachmentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageAttachmentVO';
import GPTAssistantAPIThreadMessageContentTextVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentTextVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import OseliaReferrerExternalAPIVO from '../../../shared/modules/Oselia/vos/OseliaReferrerExternalAPIVO';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ExternalAPIServerController from '../API/ExternalAPIServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleVersionedServer from '../Versioned/ModuleVersionedServer';
import ModuleGPTServer from './ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './sync/GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncRunsController from './sync/GPTAssistantAPIServerSyncRunsController';
import GPTAssistantAPIServerSyncThreadMessagesController from './sync/GPTAssistantAPIServerSyncThreadMessagesController';

export default class GPTAssistantAPIServerController {

    public static promise_pipeline_by_function: { [function_id: number]: PromisePipeline } = {};

    /**
     * Cette méthode a pour but de wrapper l'appel aux APIs OpenAI
     *  pour permettre la gestion des erreurs, et en particulier des erreurs 429 (rate limit)
     * @param apiFunction
     * @param args
     * @returns
     */
    public static async wrap_api_call<T extends (...args: any[]) => Promise<any>>(apiFunction: T, context: ThisParameterType<T>, ...args: Parameters<T>): Promise<ReturnType<T>> {
        const maxRetries = 7;
        const baseDelay = 1000; // Initial delay in milliseconds (1 second)

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await apiFunction.apply(context, args);
            } catch (error) {
                const delay = baseDelay * Math.pow(2, attempt - 1);
                if (error.statusCode === 429) {
                    console.log(`Rate limit exceeded. Attempt ${attempt} of ${maxRetries}. Retrying in ${delay / 1000} seconds...`);
                    await ThreadHandler.sleep(delay, 'OpenAI - Rate limit exceeded');
                } if ((error.status === 400) && error.error && error.error.message && error.error.message.includes('\'tool_outputs\' too large')) {
                    ConsoleHandler.error('GPTAssistantAPIServerController.wrap_api_call:\'tool_outputs\' too large: ' + JSON.stringify(error));
                    // TODO FIXME : Handle this error properly args.tool_outputs = null par exemple ou plutôt en forwardant le message d'erreur clairement ? ou en ellipsis sur le res trop long ?
                    throw error;
                } else {
                    ConsoleHandler.error('GPTAssistantAPIServerController.wrap_api_call: ' + JSON.stringify(error));
                    throw error;
                }
            }
        }

        throw new Error(`Failed after ${maxRetries} attempts`);
    }

    // public static async get_file(file_id: string): Promise<{ file_gpt: FileObject, assistant_file_vo: GPTAssistantAPIFileVO }> {

    //     try {

    //         const file_gpt = await ModuleGPTServer.openai.files.retrieve(file_id);

    //         const assistant_file_vo = await GPTAssistantAPIServerController.check_or_create_assistant_file_vo(file_gpt);
    //         return { file_gpt, assistant_file_vo };

    //     } catch (error) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.get_file: ' + error);
    //     }
    //     return null;
    // }

    // public static async send_file(file_vo: FileVO, purpose: number): Promise<GPTAssistantAPIFileVO> {

    //     try {

    //         const assistant_file_vo = new GPTAssistantAPIFileVO();
    //         assistant_file_vo.purpose = purpose;
    //         assistant_file_vo.archived = false;
    //         assistant_file_vo.file_id = file_vo.id;
    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_file_vo);

    //         return assistant_file_vo;
    //     } catch (error) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.get_file: ' + error);
    //     }
    //     return null;
    // }

    // public static async get_assistant(assistant_id: string): Promise<{ assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO }> {

    //     try {

    //         const assistant_gpt = await ModuleGPTServer.openai.beta.assistants.retrieve(assistant_id);

    //         // On crée l'assistant en base si il n'existe pas, sinon on le charge simplement pour faire le lien avec les messages
    //         const assistant_vo = await GPTAssistantAPIServerController.check_or_create_assistant_vo(assistant_gpt);
    //         return { assistant_gpt, assistant_vo };

    //     } catch (error) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.getAssistant: ' + error);
    //     }
    //     return null;
    // }

    // /**
    //  * On cherche l'assistant qui ferait référence à ce prompt chez nous, et on le crée si il n'existe pas
    //  * On le crée donc aussi chez OpenAI si il n'existe pas, et on rattache l'assistant au prompt
    //  * @returns
    //  */
    // public static async get_or_create_assistant_by_prompt(assistant_id: string): Promise<{ assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO }> {

    //     try {

    //         const assistant_gpt = await ModuleGPTServer.openai.beta.assistants.retrieve(assistant_id);

    //         // On crée l'assistant en base si il n'existe pas, sinon on le charge simplement pour faire le lien avec les messages
    //         const assistant_vo = await GPTAssistantAPIServerController.check_or_create_assistant_vo(assistant_gpt);
    //         return { assistant_gpt, assistant_vo };

    //     } catch (error) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.getAssistant: ' + error);
    //     }
    //     return null;
    // }

    public static async get_thread(user_id: number = null, thread_id: string = null, current_default_assistant_id: number = null): Promise<{ thread_gpt: Thread, thread_vo: GPTAssistantAPIThreadVO }> {

        try {

            let thread_gpt: Thread = null;
            if (!thread_id) {

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai && !ConfigurationService.node_configuration.unblock_openai_push_to_openai_gpt_assistant_thread) {
                    return null;
                }

                thread_gpt = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.beta.threads.create, ModuleGPTServer.openai.beta.threads);
            } else {
                thread_gpt = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.beta.threads.retrieve, ModuleGPTServer.openai.beta.threads, thread_id);
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

    // public static async update_run_if_needed(run_vo: GPTAssistantAPIRunVO, run_gpt: Run) {
    //     /**
    //      * On met à jour au besoin le run en base
    //      *         run_vo.created_at = run_gpt.created_at;
    //      *         run_vo.gpt_thread_id = run_gpt.thread_id;
    //      *         run_vo.gpt_assistant_id = run_gpt.assistant_id;
    //      *         run_vo.status = run_gpt.status;
    //      *         run_vo.required_action = run_gpt.required_action;
    //      *         run_vo.last_error = run_gpt.last_error;
    //      *         run_vo.expires_at = run_gpt.expires_at;
    //      *         run_vo.started_at = run_gpt.started_at;
    //      *         run_vo.cancelled_at = run_gpt.cancelled_at;
    //      *         run_vo.failed_at = run_gpt.failed_at;
    //      *         run_vo.completed_at = run_gpt.completed_at;
    //      *         run_vo.model = run_gpt.model;
    //      *         run_vo.instructions = run_gpt.instructions;
    //      *         run_vo.tools = run_gpt.tools;
    //      *         run_vo.file_ids = run_gpt.file_ids;
    //      *         run_vo.metadata = run_gpt.metadata;
    //      *         run_vo.temperature = run_gpt.temperature;
    //      */
    //     let has_modifs = false;
    //     if (run_vo.created_at != run_gpt.created_at) {
    //         run_vo.created_at = run_gpt.created_at;
    //         has_modifs = true;
    //     }
    //     if (run_vo.gpt_thread_id != run_gpt.thread_id) {
    //         run_vo.gpt_thread_id = run_gpt.thread_id;
    //         has_modifs = true;
    //     }
    //     if (run_vo.gpt_assistant_id != run_gpt.assistant_id) {
    //         run_vo.gpt_assistant_id = run_gpt.assistant_id;
    //         has_modifs = true;
    //     }
    //     if (run_vo.status != run_gpt.status) {
    //         run_vo.status = run_gpt.status;
    //         has_modifs = true;
    //     }
    //     if (run_vo.required_action != run_gpt.required_action) {
    //         run_vo.required_action = run_gpt.required_action;
    //         has_modifs = true;
    //     }
    //     if (run_vo.last_error != run_gpt.last_error) {
    //         run_vo.last_error = run_gpt.last_error;
    //         has_modifs = true;
    //     }
    //     if (run_vo.expires_at != run_gpt.expires_at) {
    //         run_vo.expires_at = run_gpt.expires_at;
    //         has_modifs = true;
    //     }
    //     if (run_vo.started_at != run_gpt.started_at) {
    //         run_vo.started_at = run_gpt.started_at;
    //         has_modifs = true;
    //     }
    //     if (run_vo.cancelled_at != run_gpt.cancelled_at) {
    //         run_vo.cancelled_at = run_gpt.cancelled_at;
    //         has_modifs = true;
    //     }
    //     if (run_vo.failed_at != run_gpt.failed_at) {
    //         run_vo.failed_at = run_gpt.failed_at;
    //         has_modifs = true;
    //     }
    //     if (run_vo.completed_at != run_gpt.completed_at) {
    //         run_vo.completed_at = run_gpt.completed_at;
    //         has_modifs = true;
    //     }
    //     if (run_vo.model != run_gpt.model) {
    //         run_vo.model = run_gpt.model;
    //         has_modifs = true;
    //     }
    //     if (run_vo.instructions != run_gpt.instructions) {
    //         run_vo.instructions = run_gpt.instructions;
    //         has_modifs = true;
    //     }
    //     if (run_vo.tools != run_gpt.tools) {
    //         run_vo.tools = run_gpt.tools;
    //         has_modifs = true;
    //     }
    //     if (run_vo.file_ids != run_gpt.file_ids) {
    //         run_vo.file_ids = run_gpt.file_ids;
    //         has_modifs = true;
    //     }
    //     if (run_vo.metadata != run_gpt.metadata) {
    //         run_vo.metadata = run_gpt.metadata;
    //         has_modifs = true;
    //     }
    //     if (run_vo.temperature != run_gpt.temperature) {
    //         run_vo.temperature = run_gpt.temperature;
    //         has_modifs = true;
    //     }

    //     if (has_modifs) {
    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);
    //     }

    //     if (run_gpt.usage) {

    //         has_modifs = false;
    //         let usage = await query(GPTAssistantAPIRunUsageVO.API_TYPE_ID)
    //             .filter_by_id(run_vo.id, GPTAssistantAPIRunVO.API_TYPE_ID)
    //             .exec_as_server()
    //             .select_vo<GPTAssistantAPIRunUsageVO>();

    //         if (!usage) {
    //             usage = new GPTAssistantAPIRunUsageVO();
    //             usage.run_id = run_vo.id;
    //             usage.completion_tokens = run_gpt.usage.completion_tokens;
    //             usage.prompt_tokens = run_gpt.usage.prompt_tokens;
    //             usage.total_tokens = run_gpt.usage.total_tokens;
    //             await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(usage);
    //         } else {

    //             if (usage.completion_tokens != run_gpt.usage.completion_tokens) {
    //                 usage.completion_tokens = run_gpt.usage.completion_tokens;
    //                 has_modifs = true;
    //             }

    //             if (usage.prompt_tokens != run_gpt.usage.prompt_tokens) {
    //                 usage.prompt_tokens = run_gpt.usage.prompt_tokens;
    //                 has_modifs = true;
    //             }

    //             if (usage.total_tokens != run_gpt.usage.total_tokens) {
    //                 usage.total_tokens = run_gpt.usage.total_tokens;
    //                 has_modifs = true;
    //             }

    //             if (has_modifs) {
    //                 await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(usage);
    //             }
    //         }
    //     }

    //     return run_vo;
    // }

    // /**
    //  *
    //  * @param thread_vo
    //  * @param message Les file_ids seront remplis automatiquement ici si on a des files
    //  * @param files Les fichiers qu'on veut associer à la demande. Attention : limité à 10 fichiers dans l'API GPT pour le moment
    //  * @returns
    //  */
    // public static async push_message(
    //     thread_vo: GPTAssistantAPIThreadVO,
    //     content: string,
    //     files: FileVO[],
    //     user_id: number = null): Promise<{ message_gpt: Message, message_vo: GPTAssistantAPIThreadMessageVO }> {

    //     try {

    //         const assistant_files: GPTAssistantAPIFileVO[] = [];
    //         const file_ids: string[] = [];
    //         for (const i in files) {
    //             const file = files[i];

    //             // On regarde si le fichier est déjà associé à un assistant_file_vo
    //             let assistant_file_vo = await query(GPTAssistantAPIFileVO.API_TYPE_ID).filter_by_id(file.id, FileVO.API_TYPE_ID).exec_as_server().select_vo<GPTAssistantAPIFileVO>();
    //             if (assistant_file_vo) {
    //                 assistant_files.push(assistant_file_vo);
    //                 file_ids.push(assistant_file_vo.gpt_file_id);
    //                 continue;
    //             }

    //             // On doit push le fichier sur l'API GPT
    //             assistant_file_vo = await GPTAssistantAPIServerController.send_file(file, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS);
    //             if (!assistant_file_vo) {
    //                 continue;
    //             }

    //             assistant_files.push(assistant_file_vo);
    //             file_ids.push(assistant_file_vo.gpt_file_id);
    //         }

    //         const message: MessageCreateParams = {
    //             content,
    //             file_ids,
    //             role: 'user'
    //         };

    //         const message_gpt = await ModuleGPTServer.openai.beta.threads.messages.create(
    //             thread_vo.gpt_thread_id,
    //             message
    //         );

    //         if (!message_gpt) {
    //             return null;
    //         }

    //         const message_vo = new GPTAssistantAPIThreadMessageVO();
    //         message_vo.gpt_message_id = message_gpt.id;
    //         message_vo.date = message_gpt.created_at;

    //         switch (message.role) {
    //             case 'user':
    //                 message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER;
    //                 break;
    //             default:
    //                 message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
    //                 message_vo.assistant_id = thread_vo.current_oselia_assistant_id;
    //                 break;
    //         }
    //         message_vo.prompt_id = thread_vo.current_oselia_prompt_id;
    //         message_vo.thread_id = thread_vo.id;
    //         message_vo.user_id = user_id ? user_id : thread_vo.user_id;

    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(message_vo);

    //         if (message_gpt.content && Array.isArray(message_gpt.content)) {
    //             let weight = 0;

    //             for (const i in message_gpt.content) {
    //                 const message_gpt_content = message_gpt.content[i];

    //                 switch (message_gpt_content.type) {
    //                     case 'image_file':
    //                         const image_message_content = new GPTAssistantAPIThreadMessageContentVO();
    //                         const assistant_file = await GPTAssistantAPIServerController.get_file(message_gpt_content.image_file.file_id);
    //                         image_message_content.assistant_file_id = assistant_file.assistant_file_vo.id;
    //                         image_message_content.thread_message_id = message_vo.id;
    //                         image_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
    //                         image_message_content.weight = weight++;
    //                         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_message_content);
    //                         break;

    //                     case 'text':
    //                     default:
    //                         const text_message_content = new GPTAssistantAPIThreadMessageContentVO();
    //                         text_message_content.value = message_gpt_content.text.value;
    //                         text_message_content.annotations = []; // TODO FIXME : content.text.annotations;
    //                         text_message_content.thread_message_id = message_vo.id;
    //                         text_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
    //                         text_message_content.weight = weight++;
    //                         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(text_message_content);
    //                         break;
    //                 }
    //             }
    //         }

    //         return { message_gpt, message_vo };
    //     } catch (error) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.push_message: ' + error);
    //     }

    //     return null;
    // }

    // public static async check_or_create_assistant_vo(assistant: Assistant): Promise<GPTAssistantAPIAssistantVO> {

    //     if (!assistant) {
    //         return null;
    //     }

    //     let assistant_vo = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, assistant.id).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();
    //     if (assistant_vo) {
    //         return assistant_vo;
    //     }

    //     assistant_vo = new GPTAssistantAPIAssistantVO();
    //     assistant_vo.gpt_assistant_id = assistant.id;
    //     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_vo);

    //     return assistant_vo;
    // }

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

    // public static async check_or_create_run_vo(run_gpt: Run): Promise<GPTAssistantAPIRunVO> {

    //     if (!run_gpt) {
    //         return null;
    //     }

    //     let run_vo = await query(GPTAssistantAPIRunVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_run_id, run_gpt.id).exec_as_server().select_vo<GPTAssistantAPIRunVO>();
    //     if (run_vo) {

    //         return GPTAssistantAPIServerController.update_run_if_needed(run_vo, run_gpt);
    //     }

    //     const assistant_vo = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, run_gpt.assistant_id).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();
    //     if (!assistant_vo) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_run_vo: assistant not found: ' + run_gpt.assistant_id);
    //         return null;
    //     }

    //     const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, run_gpt.thread_id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>();
    //     if (!thread_vo) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_run_vo: thread not found: ' + run_gpt.thread_id);
    //         return null;
    //     }

    //     run_vo = new GPTAssistantAPIRunVO();
    //     run_vo.gpt_run_id = run_gpt.id;
    //     run_vo.assistant_id = assistant_vo.id;
    //     run_vo.thread_id = thread_vo.id;

    //     run_vo.created_at = run_gpt.created_at;
    //     run_vo.gpt_thread_id = run_gpt.thread_id;
    //     run_vo.gpt_assistant_id = run_gpt.assistant_id;
    //     run_vo.status = run_gpt.status;
    //     run_vo.required_action = run_gpt.required_action;
    //     run_vo.last_error = run_gpt.last_error;
    //     run_vo.expires_at = run_gpt.expires_at;
    //     run_vo.started_at = run_gpt.started_at;
    //     run_vo.cancelled_at = run_gpt.cancelled_at;
    //     run_vo.failed_at = run_gpt.failed_at;
    //     run_vo.completed_at = run_gpt.completed_at;
    //     run_vo.model = run_gpt.model;
    //     run_vo.instructions = run_gpt.instructions;
    //     run_vo.tools = run_gpt.tools;
    //     run_vo.file_ids = run_gpt.file_ids;
    //     run_vo.metadata = run_gpt.metadata;
    //     run_vo.temperature = run_gpt.temperature;

    //     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);

    //     if (run_gpt.usage) {
    //         const usage = new GPTAssistantAPIRunUsageVO();
    //         usage.run_id = run_vo.id;
    //         usage.completion_tokens = run_gpt.usage.completion_tokens;
    //         usage.prompt_tokens = run_gpt.usage.prompt_tokens;
    //         usage.total_tokens = run_gpt.usage.total_tokens;
    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(usage);
    //     }

    //     return run_vo;
    // }

    // public static async check_or_create_message_vo(
    //     message_gpt: Message,
    //     thread_vo: GPTAssistantAPIThreadVO,
    //     user_id: number = null): Promise<GPTAssistantAPIThreadMessageVO> {

    //     if (!message_gpt) {
    //         return null;
    //     }

    //     if (!thread_vo) {
    //         return null;
    //     }

    //     let message_vo = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadMessageVO>().gpt_message_id, message_gpt.id).exec_as_server().select_vo<GPTAssistantAPIThreadMessageVO>();
    //     if (message_vo) {
    //         return message_vo;
    //     }

    //     let run: GPTAssistantAPIRunVO = null;
    //     if (message_gpt.run_id) {

    //         const run_gpt = await ModuleGPTServer.openai.beta.threads.runs.retrieve(thread_vo.gpt_thread_id, message_gpt.run_id);
    //         run = await GPTAssistantAPIServerController.check_or_create_run_vo(run_gpt);
    //     }

    //     message_vo = new GPTAssistantAPIThreadMessageVO();
    //     message_vo.gpt_message_id = message_gpt.id;
    //     message_vo.date = message_gpt.created_at;
    //     message_vo.run_id = run ? run.id : null;
    //     message_vo.assistant_id = run ? run.assistant_id : null;
    //     message_vo.thread_id = thread_vo.id;
    //     message_vo.user_id = user_id ? user_id : thread_vo.user_id;
    //     message_vo.prompt_id = thread_vo.current_oselia_prompt_id;
    //     message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_LABELS.indexOf(message_gpt.role);

    //     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(message_vo);

    //     if (message_gpt.content && Array.isArray(message_gpt.content)) {
    //         let weight = 0;
    //         for (const i in message_gpt.content) {
    //             const content = message_gpt.content[i];

    //             switch (content.type) {
    //                 case 'image_file':
    //                     const image_message_content = new GPTAssistantAPIThreadMessageContentVO();
    //                     const assistant_file = await GPTAssistantAPIServerController.get_file(content.image_file.file_id);
    //                     image_message_content.assistant_file_id = assistant_file.assistant_file_vo.id;
    //                     image_message_content.thread_message_id = message_vo.id;
    //                     image_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
    //                     image_message_content.weight = weight++;
    //                     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_message_content);
    //                     break;

    //                 case 'text':
    //                 default:
    //                     const text_message_content = new GPTAssistantAPIThreadMessageContentVO();
    //                     text_message_content.value = content.text.value;
    //                     text_message_content.annotations = []; // TODO FIXME : content.text.annotations;
    //                     text_message_content.thread_message_id = message_vo.id;
    //                     text_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
    //                     text_message_content.weight = weight++;
    //                     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(text_message_content);
    //                     break;
    //             }
    //         }
    //     }

    //     return message_vo;
    // }

    // public static async check_or_create_assistant_file_vo(file_gpt: FileObject): Promise<GPTAssistantAPIFileVO> {

    //     if (!file_gpt) {
    //         return null;
    //     }

    //     let assistant_file_vo = await query(GPTAssistantAPIFileVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, file_gpt.id).exec_as_server().select_vo<GPTAssistantAPIFileVO>();
    //     if (assistant_file_vo) {
    //         return assistant_file_vo;
    //     }

    //     assistant_file_vo = new GPTAssistantAPIFileVO();
    //     assistant_file_vo.gpt_file_id = file_gpt.id;
    //     assistant_file_vo.bytes = file_gpt.bytes;
    //     assistant_file_vo.created_at = file_gpt.created_at;
    //     assistant_file_vo.filename = file_gpt.filename;
    //     assistant_file_vo.purpose = GPTAssistantAPIFileVO.PURPOSE_LABELS.indexOf(file_gpt.purpose);
    //     assistant_file_vo.status = GPTAssistantAPIFileVO.STATUS_LABELS.indexOf(file_gpt.status);

    //     try {

    //         const gpt_file_content = await ModuleGPTServer.openai.files.content(file_gpt.id);
    //         console.log(gpt_file_content.headers);
    //         const bufferView = new Uint8Array(await gpt_file_content.arrayBuffer());

    //         const vo_file_name = 'gpt_' + file_gpt.id + '_' + assistant_file_vo.id + '_' + assistant_file_vo.filename;

    //         const folder = './sfiled/gpt_assistant_files/';
    //         await FileServerController.getInstance().makeSureThisFolderExists(folder);
    //         writeFileSync(folder + vo_file_name, bufferView);

    //         const file_vo = new FileVO();
    //         file_vo.file_access_policy_name = ModuleGPT.POLICY_ASSISTANT_FILES_ACCESS;
    //         file_vo.is_secured = true;
    //         file_vo.path = folder + vo_file_name;
    //         await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file_vo);

    //         assistant_file_vo.file_id = file_vo.id;
    //     } catch (error) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_file_vo: Failed to get file content: ' + error);
    //     }

    //     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_file_vo);

    //     return assistant_file_vo;
    // }

    // /**
    //  * Demander un run d'un assistant suite à un nouveau message
    //  * @param assistant_id id de l'assistant au sens de l'API GPT
    //  * @param thread_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
    //  * @param content contenu text du nouveau message
    //  * @param files ATTENTION : Limité à 10 fichiers dans l'API GPT pour le moment
    //  * @returns
    //  */
    // public static async ask_assistant(
    //     assistant_id: string,
    //     thread_id: string,
    //     content: string,
    //     files: FileVO[],
    //     user_id: number = null): Promise<GPTAssistantAPIThreadMessageVO[]> {

    //     const assistant: { assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO } = await GPTAssistantAPIServerController.get_assistant(assistant_id);

    //     if ((!assistant) || (!assistant.assistant_gpt) || (!assistant.assistant_vo)) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: assistant (gpt or vo) not found: ' + assistant_id);
    //         return null;
    //     }

    //     // On récupère les fonctions configurées sur cet assistant
    //     const { availableFunctions, availableFunctionsParameters }: {
    //         availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO },
    //         availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] }
    //     } =
    //         await GPTAssistantAPIServerController.get_availableFunctions_and_availableFunctionsParameters(assistant, user_id, thread_id);

    //     const thread: { thread_gpt: Thread, thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread(user_id, thread_id, assistant.assistant_vo.id);

    //     if ((!thread) || (!thread.thread_gpt) || (!thread.thread_vo)) {
    //         ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: thread (gpt or vo) not created');
    //         return null;
    //     }

    //     // On indique que Osélia est en train de travailler sur cette discussion
    //     thread.thread_vo.oselia_is_running = true;
    //     thread.thread_vo.current_oselia_assistant_id = assistant.assistant_vo.id;
    //     await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread.thread_vo);


    //     // On commence par synchroniser les messages entre Osélia et OpenAI
    //     //  Cela implique en particulier de supprimer de OpenAI les messages qui ne sont plus dans Osélia ou qui sont archivés
    //     await GPTAssistantAPIServerController.sync_thread(thread.thread_vo, thread.thread_gpt);

    //     const asking_message: {
    //         message_gpt: Message;
    //         message_vo: GPTAssistantAPIThreadMessageVO;
    //     } = await GPTAssistantAPIServerController.get_asking_message(thread.thread_vo, content, files, user_id);

    //     //  La discussion est en place, on peut demander à l'assistant de répondre
    //     const run_params: RunCreateParams = {
    //         assistant_id: assistant.assistant_gpt.id
    //     };

    //     let run = await ModuleGPTServer.openai.beta.threads.runs.create(
    //         thread.thread_gpt.id,
    //         run_params
    //     );

    //     // On récupère aussi les informations liées au referrer si il y en a un, de manière à préparer l'exécution des fonctions du referre si on en a
    //     // TODO FIXME : on ne prend en compte que le dernier referrer pour le moment
    //     const referrer: OseliaReferrerVO =
    //         await query(OseliaReferrerVO.API_TYPE_ID)
    //             .filter_by_num_eq(field_names<OseliaThreadReferrerVO>().thread_id, thread.thread_vo.id, OseliaThreadReferrerVO.API_TYPE_ID)
    //             .set_sort(new SortByVO(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().id, false))
    //             .exec_as_server()
    //             .set_limit(1)
    //             .select_vo<OseliaReferrerVO>();
    //     const referrer_external_apis: OseliaReferrerExternalAPIVO[] = referrer ?
    //         await query(OseliaReferrerExternalAPIVO.API_TYPE_ID)
    //             .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
    //             .exec_as_server()
    //             .select_vos<OseliaReferrerExternalAPIVO>()
    //         : [];
    //     const referrer_external_api_by_name: { [api_name: string]: OseliaReferrerExternalAPIVO } = {};

    //     for (const i in referrer_external_apis) {
    //         const referrer_external_api = referrer_external_apis[i];
    //         referrer_external_api_by_name[referrer_external_api.name] = referrer_external_api;
    //     }

    //     await GPTAssistantAPIServerController.handle_run(
    //         run,
    //         thread,
    //         availableFunctions,
    //         availableFunctionsParameters,
    //         referrer,
    //         referrer_external_api_by_name,
    //     );

    //     // Par défaut ça charge les 20 derniers messages, et en ajoutant after on a les messages après le asking_message - donc les réponses finalement
    //     const thread_messages = await ModuleGPTServer.openai.beta.threads.messages.list(thread.thread_gpt.id, (asking_message && asking_message.message_gpt) ? {
    //         before: asking_message.message_gpt.id
    //     } : null);

    //     const res: GPTAssistantAPIThreadMessageVO[] = [];

    //     for (const i in thread_messages.data) {
    //         const thread_message: Message = thread_messages.data[i];

    //         res.push(await GPTAssistantAPIServerController.check_or_create_message_vo(thread_message, thread.thread_vo));
    //     }

    //     await GPTAssistantAPIServerController.close_thread_oselia(thread.thread_vo);

    //     return res;
    // }

    /**
     * Demander un run d'un assistant suite à un nouveau message
     * @param gpt_assistant_id id de l'assistant au sens de l'API GPT
     * @param gpt_thread_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
     * @param content_text contenu text du nouveau message
     * @param files ATTENTION : Limité à 10 fichiers dans l'API GPT pour le moment
     * @param user_id id de l'utilisateur qui demande
     * @param thread_title titre de la discussion => pour éviter de passer par le système de génération de titre
     * @param hide_prompt si on veut cacher le contenu du prompt/message initial
     * @returns
     */
    public static async ask_assistant(
        gpt_assistant_id: string,
        gpt_thread_id: string,
        thread_title: string,
        content_text: string,
        files: FileVO[],
        user_id: number = null,
        hide_prompt: boolean = false,
        oselia_run: OseliaRunVO = null,
        oselia_run_purpose_state: number = null, // On utilise les states d'Osélia run pour identifier le but de ce run en particulier dans le run Osélia
        additional_run_tools: GPTAssistantAPIFunctionVO[] = null,
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {

        // Objectif : Lancer le Run le plus vite possible, pour ne pas perdre de temps

        let assistant_vo: GPTAssistantAPIAssistantVO = null;
        let thread_vo: GPTAssistantAPIThreadVO = null;

        await all_promises([
            (async () => {
                assistant_vo = await GPTAssistantAPIServerSyncAssistantsController.get_assistant_or_sync(gpt_assistant_id);
            })(),
            (async () => {
                thread_vo = gpt_thread_id ?
                    await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, gpt_thread_id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>() :
                    null;
                user_id = (user_id ? user_id : (thread_vo ? thread_vo.user_id : null));

                if (!user_id) {
                    user_id = await ModuleVersionedServer.getInstance().get_robot_user_id();
                }
            })()
        ]);

        if ((!assistant_vo) || (!assistant_vo.gpt_assistant_id)) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: assistant not found/synced: ' + gpt_assistant_id);
            return null;
        }

        if (!thread_vo) {
            thread_vo = new GPTAssistantAPIThreadVO();
            thread_vo.current_default_assistant_id = assistant_vo.id;
            thread_vo.current_oselia_assistant_id = assistant_vo.id;
            thread_vo.user_id = user_id;
        }

        if ((!thread_vo.thread_title) && (!!thread_title)) {
            thread_vo.thread_title = thread_title;
            thread_vo.needs_thread_title_build = false;
            thread_vo.thread_title_auto_build_locked = true;
        }

        // On indique que Osélia est en train de travailler sur cette discussion
        thread_vo.oselia_is_running = true;
        thread_vo.current_oselia_assistant_id = assistant_vo.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);

        if (!thread_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: thread not created');
            return null;
        }

        if (!thread_vo.gpt_thread_id) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: thread not created in OpenAI');
            thread_vo.oselia_is_running = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);
            return null;
        }

        let asking_message_vo: GPTAssistantAPIThreadMessageVO = null;
        let new_messages: GPTAssistantAPIThreadMessageVO[] = null;
        try {

            const last_thread_msg: GPTAssistantAPIThreadMessageVO = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
                .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
                .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, true))
                .set_limit(1)
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadMessageVO>();

            asking_message_vo = await this.get_asking_message(
                thread_vo,
                last_thread_msg,
                user_id,
                content_text,
                files,
                hide_prompt
            );

            //  La discussion est en place, on peut demander à l'assistant de répondre
            const run_vo = new GPTAssistantAPIRunVO();
            run_vo.assistant_id = assistant_vo.id;
            run_vo.thread_id = thread_vo.id;
            run_vo.gpt_assistant_id = assistant_vo.gpt_assistant_id;
            run_vo.gpt_thread_id = thread_vo.gpt_thread_id;

            // On ajoute la possibilité de rajouter des fonctions dédiées à un run
            if (additional_run_tools && additional_run_tools.length) {
                run_vo.tools = [];
                const get_tools_definition_from_functions = await GPTAssistantAPIServerSyncAssistantsController.get_tools_definition_from_functions(additional_run_tools);

                if (get_tools_definition_from_functions && get_tools_definition_from_functions.length) {
                    run_vo.tools.push(...get_tools_definition_from_functions);
                }
            }

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);

            // On lie le run à la discussion
            thread_vo.last_gpt_run_id = run_vo.id;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);

            // Si on a un oselia_run, on le lie
            if (oselia_run) {

                switch (oselia_run_purpose_state) {
                    case OseliaRunVO.STATE_SPLITTING:
                        oselia_run.split_gpt_run_id = run_vo.id;
                        break;
                    case OseliaRunVO.STATE_RUNNING:
                        oselia_run.run_gpt_run_id = run_vo.id;
                        break;
                    case OseliaRunVO.STATE_VALIDATING:
                        oselia_run.validation_gpt_run_id = run_vo.id;
                        break;
                    default:
                        throw new Error('ask_assistant:oselia_run_purpose_state:Not implemented');
                }
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(oselia_run);
            }

            // à cette étape, le RUN est lancé côté OpenAI, on peut faire les chargements potentiellement nécessaires pour les fonctions

            // On récupère les fonctions configurées sur cet assistant
            const { availableFunctions, availableFunctionsParameters }: {
                availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO },
                availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] }
            } =
                await GPTAssistantAPIServerController.get_availableFunctions_and_availableFunctionsParameters(assistant_vo, user_id, gpt_thread_id);

            /**
             * On ajoute les fonctions dédiées à ce run
             */
            if (additional_run_tools && additional_run_tools.length) {
                const promises = [];
                for (const i in additional_run_tools) {
                    const tool = additional_run_tools[i];
                    availableFunctions[tool.gpt_function_name] = tool;

                    promises.push((async () => {
                        const funct_params = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
                            .filter_by_num_eq(field_names<GPTAssistantAPIFunctionParamVO>().function_id, tool.id)
                            .exec_as_server()
                            .select_vos<GPTAssistantAPIFunctionParamVO>();
                        availableFunctionsParameters[tool.id] = funct_params;
                    })());
                }
                await all_promises(promises);
            }

            // On récupère aussi les informations liées au referrer si il y en a un, de manière à préparer l'exécution des fonctions du referre si on en a
            // TODO FIXME : on ne prend en compte que le dernier referrer pour le moment
            const referrer: OseliaReferrerVO =
                await query(OseliaReferrerVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaThreadReferrerVO>().thread_id, thread_vo.id, OseliaThreadReferrerVO.API_TYPE_ID)
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

            const availableFunctionsParametersByParamName: { [function_id: number]: { [param_name: string]: GPTAssistantAPIFunctionParamVO } } = {};
            for (const i in availableFunctionsParameters) {
                const function_id = parseInt(i);
                availableFunctionsParametersByParamName[function_id] = {};
                for (const j in availableFunctionsParameters[i]) {
                    const param = availableFunctionsParameters[i][j];
                    availableFunctionsParametersByParamName[function_id][param.gpt_funcparam_name] = param;
                }
            }

            await GPTAssistantAPIServerController.handle_run(
                run_vo,
                thread_vo,
                availableFunctions,
                availableFunctionsParameters,
                availableFunctionsParametersByParamName,
                referrer,
                referrer_external_api_by_name,
            );

            // Par défaut ça charge les 20 derniers messages, et en ajoutant after on a les messages après le asking_message - donc les réponses finalement
            // const thread_messages = await ModuleGPTServer.openai.beta.threads.messages.list(thread_vo.gpt_thread_id, (asking_message_vo && asking_message_vo.gpt_id) ? {
            //     before: asking_message_vo.gpt_id
            // } : null);

            // const res: GPTAssistantAPIThreadMessageVO[] = [];

            // for (const i in thread_messages.data) {
            //     const thread_message: Message = thread_messages.data[i];


            //     res.push(await GPTAssistantAPIServerController.check_or_create_message_vo(thread_message, thread_vo));
            // }

            await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);

            const run = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.beta.threads.runs.retrieve, ModuleGPTServer.openai.beta.threads.runs, thread_vo.gpt_thread_id, run_vo.gpt_run_id);
            await GPTAssistantAPIServerSyncRunsController.assign_vo_from_gpt(run_vo, run);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);


            const new_messages = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
                .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
                .filter_by_num_sup(field_names<GPTAssistantAPIThreadMessageVO>().date, asking_message_vo.date)
                .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().date, true))
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageVO>();

            return new_messages;
        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: ' + error);
        } finally {

            try {
                await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);

                new_messages = asking_message_vo ? await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
                    .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
                    .filter_by_num_sup(field_names<GPTAssistantAPIThreadMessageVO>().weight, asking_message_vo.weight)
                    .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, true))
                    .exec_as_server()
                    .select_vos<GPTAssistantAPIThreadMessageVO>() : null;
            } catch (error) {
                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: ' + error);
            }
        }

        return new_messages;
    }

    private static async resync_thread_messages(thread_vo: GPTAssistantAPIThreadVO) {
        try {
            const thread_gpt: Thread = (thread_vo.gpt_thread_id) ? await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.retrieve, ModuleGPTServer.openai.beta.threads, thread_vo.gpt_thread_id) : null;
            await GPTAssistantAPIServerSyncThreadMessagesController.sync_thread_messages(thread_vo, thread_gpt);
        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.resync_thread_messages: ' + error);
        }
    }

    private static async close_thread_oselia(thread_vo: GPTAssistantAPIThreadVO) {
        await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

        await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(thread_vo.id)
            .exec_as_server()
            .update_vos<GPTAssistantAPIThreadVO>({
                oselia_is_running: false,
                current_oselia_assistant_id: null,
                current_oselia_prompt_id: null,
            });
    }

    private static async get_asking_message(
        thread_vo: GPTAssistantAPIThreadVO,
        last_thread_msg: GPTAssistantAPIThreadMessageVO,
        user_id: number,
        new_msg_content_text: string,
        new_msg_files: FileVO[],
        hide_content: boolean = false
    ): Promise<GPTAssistantAPIThreadMessageVO> {
        let has_image_file: boolean = false;
        let asking_message_vo: GPTAssistantAPIThreadMessageVO = null;
        const files_images: FileVO[] = [];
        if (new_msg_content_text || (new_msg_files && new_msg_files.length)) {

            asking_message_vo = new GPTAssistantAPIThreadMessageVO();

            if (new_msg_files && new_msg_files.length) {

                // Si on doit ajouter des fichiers, on vérifie s'ils sont déjà dans OpenAI, et sinon on les ajoute
                // Puis on les relie à un nouveau message dont le texte est new_msg_content_text ou ' ' si on n'a pas de texte initialement
                asking_message_vo.attachments = [];
                const assistant_files: GPTAssistantAPIFileVO[] = [];
                const file_ids: string[] = [];
                for (const i in new_msg_files) {
                    const file = new_msg_files[i];

                    // On regarde si le fichier est déjà associé à un assistant_file_vo
                    let assistant_file_vo = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
                        .filter_by_num_eq(field_names<GPTAssistantAPIFileVO>().purpose, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS)
                        .filter_by_id(file.id, FileVO.API_TYPE_ID)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIFileVO>();
                    if (!assistant_file_vo) {
                        assistant_file_vo = new GPTAssistantAPIFileVO();
                        assistant_file_vo.file_id = file.id;
                        assistant_file_vo.purpose = GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS;
                        assistant_file_vo.filename = file.path;
                        assistant_file_vo.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_file_vo)).id;
                    }

                    assistant_files.push(assistant_file_vo);
                    file_ids.push(assistant_file_vo.gpt_file_id);

                    if (file.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
                        has_image_file = true;
                        files_images.push(file);
                    } else {
                        const attachment = new GPTAssistantAPIThreadMessageAttachmentVO();
                        attachment.file_id = assistant_file_vo.id;
                        attachment.gpt_file_id = assistant_file_vo.gpt_file_id;
                        attachment.add_to_tool_code_interpreter = true;
                        attachment.add_to_tool_file_search = true;
                        attachment.weight = parseInt(i);
                        asking_message_vo.attachments.push(attachment);
                    }
                }

                if (!new_msg_content_text) {
                    new_msg_content_text = ' ';
                }
            }

            asking_message_vo.date = Dates.now();
            asking_message_vo.gpt_thread_id = thread_vo.gpt_thread_id;
            asking_message_vo.thread_id = thread_vo.id;
            asking_message_vo.weight = last_thread_msg ? last_thread_msg.weight + 1 : 0;
            asking_message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
            asking_message_vo.user_id = user_id ? user_id : thread_vo.user_id;
            asking_message_vo.is_ready = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(asking_message_vo);


            const current_user = await query(UserVO.API_TYPE_ID).filter_by_id(user_id).set_limit(1).select_vo<UserVO>();
            const content = new GPTAssistantAPIThreadMessageContentVO();
            content.thread_message_id = asking_message_vo.id;
            content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content.content_type_text.value = new_msg_content_text;
            content.gpt_thread_message_id = asking_message_vo.gpt_id;
            content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content.weight = 0;
            content.hidden = hide_content;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content);

            const content_name = new GPTAssistantAPIThreadMessageContentVO();
            content_name.thread_message_id = asking_message_vo.id;
            content_name.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_name.content_type_text.value = '<name:' + current_user.name + '>';
            content_name.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_name.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_name.weight = 0;
            content_name.hidden = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content_name);

            const content_email = new GPTAssistantAPIThreadMessageContentVO();
            content_email.thread_message_id = asking_message_vo.id;
            content_email.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_email.content_type_text.value = '<email:' + current_user.email + '>';
            content_email.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_email.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_email.weight = 0;
            content_email.hidden = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content_email);

            const content_phone = new GPTAssistantAPIThreadMessageContentVO();
            content_phone.thread_message_id = asking_message_vo.id;
            content_phone.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_phone.content_type_text.value = '<phone:' + current_user.phone + '>';
            content_phone.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_phone.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_phone.weight = 0;
            content_phone.hidden = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content_phone);

            const content_user_id = new GPTAssistantAPIThreadMessageContentVO();
            content_user_id.thread_message_id = asking_message_vo.id;
            content_user_id.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_user_id.content_type_text.value = '<user_id:' + user_id.toString() + '>';
            content_user_id.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_user_id.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_user_id.weight = 0;
            content_user_id.hidden = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content_user_id);

            if (has_image_file) {
                for (const images of files_images) {
                    const content = new GPTAssistantAPIThreadMessageContentVO();
                    content.thread_message_id = asking_message_vo.id;
                    content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
                    content.content_type_text.value = "[" + images.path + ":" + images.id.toString() + "]";
                    content.gpt_thread_message_id = asking_message_vo.gpt_id;
                    content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
                    content.weight = 0;
                    content.hidden = true;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content);
                }
            }
            asking_message_vo.is_ready = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(asking_message_vo);
        }

        return asking_message_vo ? asking_message_vo : last_thread_msg;
    }

    // private static async get_asking_message(
    //     thread_vo: GPTAssistantAPIThreadVO,
    //     content: string,
    //     files: FileVO[],
    //     user_id: number = null): Promise<{ message_gpt: Message, message_vo: GPTAssistantAPIThreadMessageVO }> {

    //     if (!content) {
    //         // Si on ne demande rien de plus, on prend juste le dernier message existant dans la conversation côté openai
    //         const thread_messages = await ModuleGPTServer.openai.beta.threads.messages.list(thread_vo.gpt_thread_id);

    //         if (!thread_messages.data || !thread_messages.data.length) {
    //             return null;
    //         }

    //         const last_message = thread_messages.data[thread_messages.data.length - 1];
    //         return {
    //             message_gpt: last_message,
    //             message_vo: await GPTAssistantAPIServerController.check_or_create_message_vo(last_message, thread_vo)
    //         };
    //     }

    //     return await GPTAssistantAPIServerController.push_message(
    //         thread_vo,
    //         content,
    //         files,
    //         user_id
    //     );
    // }

    private static async handle_run(
        run_vo: GPTAssistantAPIRunVO,
        thread_vo: GPTAssistantAPIThreadVO,
        availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO },
        availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] },
        availableFunctionsParametersByParamName: { [function_id: number]: { [param_name: string]: GPTAssistantAPIFunctionParamVO } },
        referrer: OseliaReferrerVO,
        referrer_external_api_by_name: { [api_name: string]: OseliaReferrerExternalAPIVO },
    ) {

        if (!run_vo.gpt_run_id) {
            ConsoleHandler.error('GPTAssistantAPIServerController.handle_run: run not created');
            throw new Error('GPTAssistantAPIServerController.handle_run: run not created');
        }

        let run = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.beta.threads.runs.retrieve, ModuleGPTServer.openai.beta.threads.runs, thread_vo.gpt_thread_id, run_vo.gpt_run_id);

        while (run.status != "completed") {

            switch (run.status) {
                case "cancelled":
                case "cancelling":
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run cancelled');
                    await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);
                    return null;
                case "expired":
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run expired');
                    await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);
                    return null;
                case "failed":
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run failed');
                    await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);
                    return null;
                case "requires_action":

                    await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

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
                                        function_response = "UNKNOWN_FUNCTION : Check the name and retry.";
                                        throw new Error('function_vo not found: ' + tool_call.function.name);
                                    }

                                    /**
                                     * On commence par checker la cohérence des arguments passés à la fonction
                                     */
                                    for (let gpt_arg_name in function_args) {
                                        if (!availableFunctionsParametersByParamName[function_vo.id][gpt_arg_name]) {
                                            function_response = "UNKNOWN_PARAMETER : Check the arguments and retry. " + gpt_arg_name + " not found.";
                                            throw new Error('function_arg not found: ' + gpt_arg_name);
                                        }
                                    }

                                    // if (!function_vo) {

                                    // si on a un referrer et des externals apis, on peut tenter de trouver dans ses fonctions
                                    if (referrer_external_api_by_name && referrer_external_api_by_name[tool_call.function.name]) {
                                        const referrer_external_api = referrer_external_api_by_name[tool_call.function.name];

                                        try {
                                            if (ConfigurationService.node_configuration.debug_oselia_referrer_origin) {
                                                ConsoleHandler.log('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - REFERRER ExternalAPI Call - params - ' + JSON.stringify(function_args));
                                            }

                                            // /**
                                            //  * Dans le cas où l'URL contiendrait des paramètres, on les remplace par les valeurs des arguments correspondants et on pop ces arguments avant d'appeler la fonction externe
                                            //  *  On identifie les params à la composition de l'URL /<param_name>/
                                            //  */
                                            const url_params = referrer_external_api.external_api_url.match(/<([^>]*)>/g);
                                            let external_api_url = referrer_external_api.external_api_url;

                                            if (url_params && url_params.length) {
                                                for (const i in url_params) {
                                                    const url_param = url_params[i].replace(/<([^>]*)>/, '$1');
                                                    external_api_url = external_api_url.replace('<' + url_param + '>', function_args[url_param]);

                                                    const func_param: GPTAssistantAPIFunctionParamVO = availableFunctionsParametersByParamName[function_vo.id][url_param];
                                                    if (func_param && func_param.not_in_function_params) {
                                                        delete function_args[url_param];
                                                    }
                                                }
                                            }

                                            let method: "get" | "post" | "put" | "delete" = 'get';
                                            switch (referrer_external_api.external_api_method) {
                                                case OseliaReferrerExternalAPIVO.API_METHOD_POST:
                                                    method = 'post';
                                                    break;
                                                case OseliaReferrerExternalAPIVO.API_METHOD_PUT:
                                                    method = 'put';
                                                    break;
                                                case OseliaReferrerExternalAPIVO.API_METHOD_DELETE:
                                                    method = 'delete';
                                                    break;
                                                case OseliaReferrerExternalAPIVO.API_METHOD_GET:
                                                default:
                                                    method = 'get';
                                                    break;
                                            }

                                            function_response = await ExternalAPIServerController.call_external_api(
                                                method,
                                                external_api_url,
                                                function_args,
                                                referrer_external_api.external_api_authentication_id,
                                                referrer_external_api.accept,
                                                referrer_external_api.content_type,
                                            );

                                            if (ConfigurationService.node_configuration.debug_oselia_referrer_origin) {
                                                ConsoleHandler.log('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - REFERRER ExternalAPI Call - answer - ' + JSON.stringify(function_response));
                                            }

                                            function_response = await this.handle_function_response(function_response, tool_outputs, function_vo, tool_call.id);
                                            return;

                                        } catch (error) {
                                            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - Failed REFERRER ExternalAPI Call - referrer - ' +
                                                referrer.name + ' - external api name - ' + referrer_external_api.name + ' - error: ' + error);
                                            function_response = "TECHNICAL MALFUNCTION : REFERRER ExternalAPI Call Failed.";
                                            throw new Error('Failed REFERRER ExternalAPI Call - referrer - ' +
                                                referrer.name + ' - external api name - ' + referrer_external_api.name + ' - error: ' + error);
                                        }
                                    }

                                    const function_to_call: () => Promise<any> = ModulesManager.getInstance().getModuleByNameAndRole(function_vo.module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME)[function_vo.module_function];
                                    const ordered_args = function_vo.ordered_function_params_from_GPT_arguments(function_vo, thread_vo, function_args, availableFunctionsParameters[function_vo.id]);

                                    // Si la fonction est définie comme utilisant un PromisePipeline, on l'utilise, et on l'initialise si il est pas encore créé
                                    if (function_vo.use_promise_pipeline) {

                                        if (!GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id]) {
                                            GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id] = new PromisePipeline(function_vo.promise_pipeline_max_concurrency, 'Oselia-PromisePipeline-' + function_vo.gpt_function_name);
                                        }

                                        // On attend non seulement le push mais la résolution de la méthode push
                                        await (await GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id].push(async () => {
                                            try {
                                                function_response = await function_to_call.call(null, ...ordered_args);
                                            } catch (error) {
                                                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - PromisePipeline inner promise - error: ' + error);
                                                function_response = "TECHNICAL MALFUNCTION : submit_tool_outputs - error: " + error;
                                            }
                                        }))();
                                    } else {
                                        function_response = await function_to_call.call(null, ...ordered_args);
                                    }

                                    function_response = await this.handle_function_response(function_response, tool_outputs, function_vo, tool_call.id);
                                    return;

                                } catch (error) {
                                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - error: ' + error);
                                    function_response = "TECHNICAL MALFUNCTION : submit_tool_outputs - error: " + error;
                                }
                                tool_outputs.push({
                                    tool_call_id: tool_call.id,
                                    output: function_response,
                                });

                            })());
                        }

                        await all_promises(promises);

                        // // On doit vérifier que les outputs sont bien limités à 512kb comme demandé par OpenAI
                        // // (512kb et non kB donc a priori en nombre de lettres ça fait plutôt 512 / 8 = 64k lettres)
                        // // et si ce n'est pas le cas, on doit les tronquer et ajouter un message d'erreur
                        // let total_size = 0;
                        // const max_size = 60 * 1024; // On laisse un peu de marge pour les messages d'erreur et être sûr de ne pas dépasser
                        // for (const i in tool_outputs) {
                        //     const this_elt_size = tool_outputs[i].output.length;

                        //     if ((total_size + this_elt_size) > max_size) {
                        //         tool_outputs[i].output = ((max_size - total_size) > 0) ?
                        //             tool_outputs[i].output.substring(0, max_size - total_size) :
                        //             "";
                        //         tool_outputs[i].output += "[... output too big, truncated to respect OpenAI 512kb limits. try filtering the request ...]";
                        //     }
                        //     total_size += this_elt_size;
                        // }

                        try {
                            // Submit tool outputs
                            await GPTAssistantAPIServerController.wrap_api_call(
                                ModuleGPTServer.openai.beta.threads.runs.submitToolOutputs,
                                ModuleGPTServer.openai.beta.threads.runs,
                                thread_vo.gpt_thread_id,
                                run.id,
                                { tool_outputs: tool_outputs }
                            );
                        } catch (error) {

                            if ((error.status === 400) && error.error && error.error.message && error.error.message.includes('\'tool_outputs\' too large')) {

                                // Submit tool outputs - on a un message d'erreur, on doit tronquer les outputs - mais on sait pas lesquels - on log pour le moment la taille pour en déduire une limite à fixer en amont
                                let total_size = 0;
                                for (const i in tool_outputs) {
                                    const this_elt_size = tool_outputs[i].output.length;

                                    total_size += this_elt_size;
                                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - output size:i:' + i + ':' + this_elt_size + ':total:' + total_size);

                                    tool_outputs[i].output = '[... output too big, truncated to respect OpenAI 512kb limits. try filtering the request ...]';
                                }

                                await GPTAssistantAPIServerController.wrap_api_call(
                                    ModuleGPTServer.openai.beta.threads.runs.submitToolOutputs,
                                    ModuleGPTServer.openai.beta.threads.runs,
                                    thread_vo.gpt_thread_id,
                                    run.id,
                                    { tool_outputs: tool_outputs }
                                );
                            } else {
                                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - error: ' + error);
                                throw error;
                            }
                        }
                        break;

                    } else {
                        ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - type not supported: ' + run.required_action.type);
                        await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);
                        return null;
                    }

                case "queued":
                case "in_progress":
                default:
                    // await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);
                    break;
            }

            await ThreadHandler.sleep(100, 'GPTAssistantAPIServerController.ask_assistant');

            run = await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.runs.retrieve,
                ModuleGPTServer.openai.beta.threads.runs,
                thread_vo.gpt_thread_id,
                run.id
            );

            await GPTAssistantAPIServerSyncRunsController.assign_vo_from_gpt(run_vo, run);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);

            if (!run) {
                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run not found');
                await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);
                return null;
            }
        }
    }

    private static async handle_function_response(function_response: any, tool_outputs: Array<{ tool_call_id: string; output: any; }>, function_vo: GPTAssistantAPIFunctionVO, tool_call_id: string): Promise<string> {
        let res: string = function_response;

        if (!function_response) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - function_response null or undefined. Simulating ERROR response.');
            res = "FAILED";
        } else if (function_vo.json_stringify_output) {
            res = JSON.stringify(function_response);
        }

        tool_outputs.push({
            tool_call_id: tool_call_id,
            output: res,
        });

        return res;
    }

    private static async get_availableFunctions_and_availableFunctionsParameters(
        assistant_vo: GPTAssistantAPIAssistantVO,
        user_id: number,
        gpt_thread_id: string
    ): Promise<{ availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO }, availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] } }> {

        const availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO } = {};
        const availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] } = {};
        const functions: GPTAssistantAPIFunctionVO[] = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_id(assistant_vo.id, GPTAssistantAPIAssistantVO.API_TYPE_ID).using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIFunctionVO>();
        const functions_params: GPTAssistantAPIFunctionParamVO[] = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_id(assistant_vo.id, GPTAssistantAPIAssistantVO.API_TYPE_ID).using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID).using(GPTAssistantAPIFunctionVO.API_TYPE_ID)
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

        return { availableFunctions, availableFunctionsParameters };
    }
}
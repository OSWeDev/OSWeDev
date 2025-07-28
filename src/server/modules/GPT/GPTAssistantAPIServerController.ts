import { Thread } from 'openai/resources/beta/threads/threads';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
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
import IModuleBase from '../../../shared/modules/IModuleBase';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';
import OseliaReferrerExternalAPIVO from '../../../shared/modules/Oselia/vos/OseliaReferrerExternalAPIVO';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaRunFunctionCallVO from '../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import OseliaRunTemplateVO from '../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';
import OseliaThreadRoleVO from '../../../shared/modules/Oselia/vos/OseliaThreadRoleVO';
import OseliaThreadUserVO from '../../../shared/modules/Oselia/vos/OseliaThreadUserVO';
import PerfReportController from '../../../shared/modules/PerfReport/PerfReportController';
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
import ModuleProgramPlanServerBase from '../ProgramPlan/ModuleProgramPlanServerBase';
import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';
import ModuleProgramPlanBase from '../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanRDVCR from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDV from '../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import GPTRealtimeAPISessionVO from '../../../shared/modules/GPT/vos/GPTRealtimeAPISessionVO';
import ICheckListItem from '../../../shared/modules/CheckList/interfaces/ICheckListItem';
import DatatableField from '../../../shared/modules/DAO/vos/datatable/DatatableField';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import ModuleOseliaServer from '../Oselia/ModuleOseliaServer';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import OseliaRunTemplateServerController from '../Oselia/OseliaRunTemplateServerController';
/** Structure interne d'une conversation */
interface ConversationContext {
    openaiSocket: WebSocket;
    clients: Set<WebSocket>;
    buffered: any[];
    vo?: unknown;
    current_user: UserVO;
    current_thread_id: string;
    session_run?: OseliaRunVO; // Run Oselia associé à cette session realtime
    conversation_summary?: string; // Résumé de la conversation existante pour Realtime
}
export default class GPTAssistantAPIServerController {

    public static promise_pipeline_by_function: { [function_id: number]: PromisePipeline } = {};
    public static PERF_MODULE_NAME: string = 'gpt_assistant_api';
    private static wss: any | null = null;
    private static conversations: Map<string, ConversationContext> = new Map();
    private static openaiSocket: any | null = null;
    /** Maximum d'auditeurs avant le warning Node; ajusté dynamiquement */
    private static readonly MAX_LISTENERS = 5;

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

    public static async get_availableFunctions_and_availableFunctionsParameters(
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
    //         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_file_vo);

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
    //         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_vo);
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
    //             await ModuleDAOServer.instance.insertOrUpdateVO_as_server(usage);
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
    //                 await ModuleDAOServer.instance.insertOrUpdateVO_as_server(usage);
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

    //         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message_vo);

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
    //                         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(image_message_content);
    //                         break;

    //                     case 'text':
    //                     default:
    //                         const text_message_content = new GPTAssistantAPIThreadMessageContentVO();
    //                         text_message_content.value = message_gpt_content.text.value;
    //                         text_message_content.annotations = []; // TODO FIXME : content.text.annotations;
    //                         text_message_content.thread_message_id = message_vo.id;
    //                         text_message_content.content_type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
    //                         text_message_content.weight = weight++;
    //                         await ModuleDAOServer.instance.insertOrUpdateVO_as_server(text_message_content);
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
    //     await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_vo);

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
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);
            }

            return thread_vo;
        }

        thread_vo = new GPTAssistantAPIThreadVO();
        thread_vo.gpt_thread_id = thread_gpt.id;
        thread_vo.user_id = user_id ? user_id : await ModuleVersionedServer.getInstance().get_robot_user_id();
        thread_vo.current_default_assistant_id = current_default_assistant_id;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);

        // ML : Si on créer un thread, on doit aussi rajouter le créateur dans les user du thread et lui mettre le rôle propriétaire
        const thread_user_vo = new OseliaThreadUserVO();
        thread_user_vo.thread_id = thread_vo.id;
        thread_user_vo.user_id = thread_vo.user_id;
        thread_user_vo.role_id = (await query(OseliaThreadRoleVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaThreadRoleVO>().translatable_name, ModuleOselia.ROLE_OWNER)
            .select_vo<OseliaThreadRoleVO>()).id; // Propriétaire
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_user_vo);

        return thread_vo;
    }



    /**
     * On isole l'appel de fonction, pour pouvoir le relancer en mode debug
     * @param oselia_run
     * @param function_vo
     * @param oselia_run_function_call_vo
     * @param tool_call_function_name
     * @param tool_call_function_args
     * @param availableFunctionsParametersByParamName
     * @param referrer_external_api_by_name
     * @returns
     */
    public static async do_function_call(
        oselia_run: OseliaRunVO,
        run_vo: GPTAssistantAPIRunVO,
        thread_vo: GPTAssistantAPIThreadVO,
        referrer: OseliaReferrerVO,
        function_vo: GPTAssistantAPIFunctionVO,
        oselia_run_function_call_vo: OseliaRunFunctionCallVO,
        tool_call_function_name: string,
        tool_call_function_args: string,
        availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] },
        availableFunctionsParametersByParamName: { [function_id: number]: { [param_name: string]: GPTAssistantAPIFunctionParamVO } },
        referrer_external_api_by_name: { [api_name: string]: OseliaReferrerExternalAPIVO },
    ): Promise<string> {

        const function_perf_name = 'Osélia Run Function Call - ' + function_vo.gpt_function_name;
        const function_perf_description = 'Osélia Run Function Call - ' + function_vo.gpt_function_description;

        const thread_perf_name = 'Osélia Run Thread [' + thread_vo.id + ']';
        const thread_perf_description = 'Osélia Run Thread [' + thread_vo.id + '] - ' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? thread_vo.thread_title : '');
        PerfReportController.add_event(
            GPTAssistantAPIServerController.PERF_MODULE_NAME,
            function_perf_name,
            function_perf_name,
            function_perf_description,
            Dates.now_ms(),
            'For thread [' + thread_vo.id + ']' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? ' - ' + thread_vo.thread_title : ''),
        );
        PerfReportController.add_event(
            GPTAssistantAPIServerController.PERF_MODULE_NAME,
            thread_perf_name,
            thread_perf_name,
            thread_perf_description,
            Dates.now_ms(),
            'Run function - ' + function_vo.gpt_function_name + ' - ' + function_vo.gpt_function_description,
        );

        const in_ts_ms = Dates.now_ms();

        let function_response = null;

        if (!function_vo) {
            throw new Error('UNKNOWN_FUNCTION : Check the name and retry. Not found: ' + tool_call_function_name);
        }

        const function_args = JSON.parse(tool_call_function_args);

        /**
         * On commence par checker la cohérence des arguments passés à la fonction
         */
        for (const gpt_arg_name in function_args) {
            if (!availableFunctionsParametersByParamName[function_vo.id][gpt_arg_name]) {
                throw new Error('UNKNOWN_PARAMETER : Check the arguments and retry. Not found: ' + gpt_arg_name);
            }
        }

        // if (!function_vo) {

        // si on a un referrer et des externals apis, on peut tenter de trouver dans ses fonctions
        if (referrer_external_api_by_name && referrer_external_api_by_name[tool_call_function_name]) {
            const referrer_external_api = referrer_external_api_by_name[tool_call_function_name];

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

                let post_api_ts_ms = Dates.now_ms();
                await all_promises([ // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
                    (async () => {
                        // On stocke l'info qu'on a lancé un appel de fonction externe
                        oselia_run_function_call_vo.creation_date = Dates.now();
                        oselia_run_function_call_vo.oselia_run_id = oselia_run ? oselia_run.id : thread_vo.last_oselia_run_id; // Si on a pas d'osélia run id, on associe au denier du thread dans le doute
                        oselia_run_function_call_vo.external_api_id = referrer_external_api.id;
                        oselia_run_function_call_vo.function_call_parameters_initial = JSON.parse(tool_call_function_args);
                        oselia_run_function_call_vo.function_call_parameters_transcripted = function_args;
                        oselia_run_function_call_vo.gpt_function_id = function_vo.id;
                        oselia_run_function_call_vo.gpt_run_id = run_vo ? run_vo.id : null; // Si on replay, on a pas de gptrun
                        oselia_run_function_call_vo.start_date = Dates.now();
                        oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_RUNNING;
                        oselia_run_function_call_vo.thread_id = thread_vo.id;
                        oselia_run_function_call_vo.user_id = thread_vo.user_id;
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);
                    })(),
                    (async () => {

                        const pre_api_ts_ms = Dates.now_ms();
                        PerfReportController.add_cooldown(
                            GPTAssistantAPIServerController.PERF_MODULE_NAME,
                            function_perf_name,
                            function_perf_name,
                            function_perf_description,
                            in_ts_ms,
                            pre_api_ts_ms,
                            'For thread [' + thread_vo.id + ']' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? ' - ' + thread_vo.thread_title : '') +
                            '<br>' +
                            'External API Call - ' + method + ' - ' + external_api_url + ' - ' + JSON.stringify(function_args),
                        );
                        PerfReportController.add_cooldown(
                            GPTAssistantAPIServerController.PERF_MODULE_NAME,
                            thread_perf_name,
                            thread_perf_name,
                            thread_perf_description,
                            in_ts_ms,
                            pre_api_ts_ms,
                            'Run function - ' + function_vo.gpt_function_name + ' - ' + function_vo.gpt_function_description +
                            '<br>' +
                            'External API Call - ' + method + ' - ' + external_api_url + ' - ' + JSON.stringify(function_args),
                        );

                        function_response = await ExternalAPIServerController.call_external_api(
                            method,
                            external_api_url,
                            function_args,
                            referrer_external_api.external_api_authentication_id,
                            referrer_external_api.accept,
                            referrer_external_api.content_type,
                        );

                        post_api_ts_ms = Dates.now_ms();
                        PerfReportController.add_call(
                            GPTAssistantAPIServerController.PERF_MODULE_NAME,
                            function_perf_name,
                            function_perf_name,
                            function_perf_description,
                            pre_api_ts_ms,
                            post_api_ts_ms,
                            'For thread [' + thread_vo.id + ']' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? ' - ' + thread_vo.thread_title : '') +
                            '<br>' +
                            'External API Call - ' + method + ' - ' + external_api_url + ' - ' + JSON.stringify(function_args),
                        );
                        PerfReportController.add_call(
                            GPTAssistantAPIServerController.PERF_MODULE_NAME,
                            thread_perf_name,
                            thread_perf_name,
                            thread_perf_description,
                            pre_api_ts_ms,
                            post_api_ts_ms,
                            'Run function - ' + function_vo.gpt_function_name + ' - ' + function_vo.gpt_function_description +
                            '<br>' +
                            'External API Call - ' + method + ' - ' + external_api_url + ' - ' + JSON.stringify(function_args),
                        );
                    })()
                ]);

                oselia_run_function_call_vo.end_date = Dates.now();
                oselia_run_function_call_vo.result = function_vo.json_stringify_output ? JSON.stringify(function_response) : function_response;
                oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_DONE;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);

                if (ConfigurationService.node_configuration.debug_oselia_referrer_origin) {
                    ConsoleHandler.log('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - REFERRER ExternalAPI Call - answer - ' + JSON.stringify(function_response));
                }

                const post_ts_ms = Dates.now_ms();
                PerfReportController.add_cooldown(
                    GPTAssistantAPIServerController.PERF_MODULE_NAME,
                    function_perf_name,
                    function_perf_name,
                    function_perf_description,
                    post_api_ts_ms,
                    post_ts_ms,
                    'For thread [' + thread_vo.id + ']' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? ' - ' + thread_vo.thread_title : '') +
                    '<br>' +
                    'External API Call - ' + method + ' - ' + external_api_url + ' - ' + JSON.stringify(function_args),
                );
                PerfReportController.add_cooldown(
                    GPTAssistantAPIServerController.PERF_MODULE_NAME,
                    thread_perf_name,
                    thread_perf_name,
                    thread_perf_description,
                    post_api_ts_ms,
                    post_ts_ms,
                    'Run function - ' + function_vo.gpt_function_name + ' - ' + function_vo.gpt_function_description +
                    '<br>' +
                    'External API Call - ' + method + ' - ' + external_api_url + ' - ' + JSON.stringify(function_args),
                );

                return function_response;

            } catch (error) {
                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - Failed REFERRER ExternalAPI Call - referrer - ' +
                    referrer.name + ' - external api name - ' + referrer_external_api.name + ' - error: ' + error);

                oselia_run_function_call_vo.end_date = Dates.now();
                oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_ERROR;
                oselia_run_function_call_vo.error_msg = error;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);

                throw new Error('Failed REFERRER ExternalAPI Call - referrer - ' +
                    referrer.name + ' - external api name - ' + referrer_external_api.name + ' - error: ' + error);
            }
        }

        const module_of_function_to_call = ModulesManager.getModuleByNameAndRole(function_vo.module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME);
        const function_to_call: () => Promise<any> = module_of_function_to_call[function_vo.module_function];
        const ordered_args: any[] = function_vo.ordered_function_params_from_GPT_arguments(function_vo, thread_vo, function_args, availableFunctionsParameters[function_vo.id]);

        oselia_run_function_call_vo.creation_date = Dates.now();
        oselia_run_function_call_vo.oselia_run_id = oselia_run ? oselia_run.id : thread_vo.last_oselia_run_id; // Si on a pas d'osélia run id, on associe au denier du thread dans le doute
        oselia_run_function_call_vo.function_call_parameters_initial = JSON.parse(tool_call_function_args);
        oselia_run_function_call_vo.function_call_parameters_transcripted = function_args;
        oselia_run_function_call_vo.gpt_function_id = function_vo.id;
        oselia_run_function_call_vo.gpt_run_id = run_vo ? run_vo.id : null;
        oselia_run_function_call_vo.thread_id = thread_vo.id;
        oselia_run_function_call_vo.user_id = thread_vo.user_id;
        oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_TODO;

        // Si la fonction est définie comme utilisant un PromisePipeline, on l'utilise, et on l'initialise si il est pas encore créé
        if (function_vo.use_promise_pipeline) {

            if (!GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id]) {
                GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id] = new PromisePipeline(function_vo.promise_pipeline_max_concurrency, 'Oselia-PromisePipeline-' + function_vo.gpt_function_name);
            }

            if (!GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id].has_free_slot) {
                // Si on sait qu'on va devoir attendre un slot on met à jour la base sinon osef on avance
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);
            }

            // On attend non seulement le push mais la résolution de la méthode push
            await (await GPTAssistantAPIServerController.promise_pipeline_by_function[function_vo.id].push(async () => {
                try {
                    function_response = await this.call_function_and_perf_report(
                        function_vo,
                        oselia_run_function_call_vo,
                        function_to_call,
                        module_of_function_to_call,
                        ordered_args,

                        function_perf_name,
                        function_perf_description,

                        thread_vo,
                        thread_perf_name,
                        thread_perf_description,

                        in_ts_ms,
                    );
                } catch (error) {
                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - PromisePipeline inner promise - error: ' + error);
                    function_response = "TECHNICAL MALFUNCTION : submit_tool_outputs - error: " + error;
                }
            }))();
        } else {
            function_response = await this.call_function_and_perf_report(
                function_vo,
                oselia_run_function_call_vo,
                function_to_call,
                module_of_function_to_call,
                ordered_args,

                function_perf_name,
                function_perf_description,

                thread_vo,
                thread_perf_name,
                thread_perf_description,

                in_ts_ms,
            );
        }

        oselia_run_function_call_vo.end_date = Dates.now();
        oselia_run_function_call_vo.result = function_vo.json_stringify_output ? JSON.stringify(function_response) : function_response;
        oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_DONE;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);

        return function_response;
    }

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
        referrer_id: number = null,
        generate_voice_summary: boolean = false,
    ): Promise<GPTAssistantAPIThreadMessageVO[]> {

        // Objectif : Lancer le Run le plus vite possible, pour ne pas perdre de temps

        let assistant_vo: GPTAssistantAPIAssistantVO = null;
        let thread_vo: GPTAssistantAPIThreadVO = null;

        await all_promises([ // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
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
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);

        if (!thread_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: thread not created');
            return null;
        }

        if (!thread_vo.gpt_thread_id) {
            ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: thread not created in OpenAI');
            thread_vo.oselia_is_running = false;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);
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

            //  La discussion est en place, on peut demander à l'assistant de répondre
            const run_vo = new GPTAssistantAPIRunVO();
            run_vo.assistant_id = assistant_vo.id;
            run_vo.thread_id = thread_vo.id;
            run_vo.gpt_assistant_id = assistant_vo.gpt_assistant_id;
            run_vo.gpt_thread_id = thread_vo.gpt_thread_id;

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
                await all_promises(promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
            }

            // On ajoute la possibilité de rajouter des fonctions dédiées à un run - en complément des fonctions de l'assistant
            if (additional_run_tools && additional_run_tools.length) {
                run_vo.tools = await GPTAssistantAPIServerSyncAssistantsController.get_tools_definition_from_functions(Object.values(availableFunctions));
            }

            // On gère la liaison à l'OséliaRun, on le crée au besoin
            oselia_run = await GPTAssistantAPIServerController.link_oselia_run_to_thread(
                content_text,
                thread_vo,
                oselia_run,
                assistant_vo.id,
                user_id,
                referrer_id,
                generate_voice_summary,
            );

            // Vérifier si une session Realtime est active pour ce thread
            const activeRealtimeConversation = this.get_active_realtime_conversation(thread_vo);

            if (activeRealtimeConversation && !hide_prompt) {
                // Si Realtime est actif, créer le message utilisateur pour l'historique
                asking_message_vo = await this.get_asking_message(
                    thread_vo,
                    oselia_run,
                    last_thread_msg,
                    user_id,
                    content_text,
                    files,
                    hide_prompt,
                    false
                );

                // Envoyer le message via Realtime pour obtenir une réponse vocale
                await this.send_message_to_realtime_if_active(thread_vo, content_text, user_id);

                // Resynchroniser les messages après envoi realtime
                await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

                // Retourner le message créé pour l'historique
                return [asking_message_vo];
            }

            asking_message_vo = await this.get_asking_message(
                thread_vo,
                oselia_run,
                last_thread_msg,
                user_id,
                content_text,
                files,
                hide_prompt,
                false  // toujours false maintenant
            );

            // à cette étape, le RUN est lancé côté OpenAI, on peut faire les chargements potentiellement nécessaires pour les fonctions

            // On récupère aussi les informations liées au referrer si il y en a un, de manière à préparer l'exécution des fonctions du referre si on en a
            // TODO FIXME : on ne prend en compte que le dernier referrer pour le moment
            const referrer_query = query(OseliaReferrerVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaThreadReferrerVO>().thread_id, thread_vo.id, OseliaThreadReferrerVO.API_TYPE_ID)
                .set_sort(new SortByVO(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().id, false))
                .exec_as_server()
                .set_limit(1);
            if (referrer_id) {
                referrer_query.filter_by_id(referrer_id);
            }
            let referrer: OseliaReferrerVO = await referrer_query.select_vo<OseliaReferrerVO>();

            if (referrer_id && (!referrer || (referrer.id != referrer_id))) {
                referrer = await query(OseliaReferrerVO.API_TYPE_ID).filter_by_id(referrer_id).exec_as_server().select_vo<OseliaReferrerVO>();
                const thread_referrer = new OseliaThreadReferrerVO();
                thread_referrer.thread_id = thread_vo.id;
                thread_referrer.referrer_id = referrer.id;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_referrer);
            }

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

            try {

                // On lance le run
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_vo);

                // On a le run_id on en profite pour recoller à tous les vos importants
                // On lie le run à la discussion
                thread_vo.last_gpt_run_id = run_vo.id;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);

                // et à l'osélia run
                switch (oselia_run_purpose_state) {
                    case OseliaRunVO.STATE_SPLITTING:
                        oselia_run.split_gpt_run_id = run_vo.id;
                        break;
                    case OseliaRunVO.STATE_RUNNING:
                    default:
                        oselia_run.run_gpt_run_id = run_vo.id;
                        break;
                    case OseliaRunVO.STATE_VALIDATING:
                        oselia_run.validation_gpt_run_id = run_vo.id;
                        break;
                }
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run);

                // On attend la résolution du run
                await GPTAssistantAPIServerController.handle_run(
                    run_vo,
                    oselia_run,
                    thread_vo,
                    availableFunctions,
                    availableFunctionsParameters,
                    availableFunctionsParametersByParamName,
                    referrer,
                    referrer_external_api_by_name,
                );

            } catch (error) {
                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: handle_run: ' + error);
                await GPTAssistantAPIServerController.close_thread_oselia(thread_vo);
                return null;
            }

            // TODO fixme : faire du tri dans ce qui est encore pertinent / nécessaire pour les synchros, et ce qui fait juste perdre du temps...
            await all_promises([
                GPTAssistantAPIServerController.close_thread_oselia(thread_vo),
                (async () => {
                    const run = await GPTAssistantAPIServerController.wrap_api_call(ModuleGPTServer.openai.beta.threads.runs.retrieve, ModuleGPTServer.openai.beta.threads.runs, thread_vo.gpt_thread_id, run_vo.gpt_run_id);
                    await GPTAssistantAPIServerSyncRunsController.assign_vo_from_gpt(run_vo, run);
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_vo);
                })(),
            ]);

            // On récupère les nouveaux messages => réponses de gpt
            new_messages = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
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

    /**
     * Créer un message technique (système) dans un thread sans déclencher d'assistant
     * Utilisé pour ajouter des informations contextuelles qui ne nécessitent pas de réponse
     * @param gpt_thread_id ID du thread GPT
     * @param content_text Contenu du message technique
     * @param user_id ID de l'utilisateur
     * @returns Le message créé
     */
    public static async create_technical_message(
        gpt_thread_id: string,
        content_text: string,
        user_id: number = null
    ): Promise<GPTAssistantAPIThreadMessageVO> {

        if (!gpt_thread_id || !content_text?.trim()) {
            return null;
        }

        const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, gpt_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.create_technical_message: thread not found: ' + gpt_thread_id);
            return null;
        }

        if (!user_id) {
            user_id = thread_vo.user_id || await ModuleVersionedServer.getInstance().get_robot_user_id();
        }

        try {
            // TOUJOURS créer le message dans OpenAI d'abord
            const openai_message = await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.messages.create,
                ModuleGPTServer.openai.beta.threads.messages,
                gpt_thread_id,
                {
                    role: 'user',
                    content: `[TECHNICAL INFO] ${content_text}`,
                }
            );

            if (!openai_message) {
                throw new Error('Impossible de créer le message dans OpenAI');
            }

            // ENSUITE vérifier si une session Realtime est active
            const activeRealtimeConversation = this.get_active_realtime_conversation(thread_vo);

            if (activeRealtimeConversation) {
                ConsoleHandler.log('GPTAssistantAPIServerController: Session realtime active, envoi du message via WebSocket');

                try {
                    const conversationItem = {
                        type: 'conversation.item.create',
                        item: {
                            type: 'message',
                            role: 'user',
                            content: [
                                {
                                    type: 'input_text',
                                    text: `[TECHNICAL INFO] ${content_text}`
                                }
                            ]
                        }
                    };

                    if (activeRealtimeConversation.openaiSocket.readyState === activeRealtimeConversation.openaiSocket.OPEN) {
                        activeRealtimeConversation.openaiSocket.send(JSON.stringify(conversationItem));
                        ConsoleHandler.log('GPTAssistantAPIServerController: Message technique envoyé à la session realtime');
                    }
                } catch (wsError) {
                    ConsoleHandler.error('GPTAssistantAPIServerController: Erreur envoi WebSocket (message déjà créé dans OpenAI):', wsError);
                }
            }

            // TOUJOURS synchroniser depuis OpenAI vers notre base
            await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

            // Récupération du message créé dans notre base après synchronisation
            const technical_message = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<GPTAssistantAPIThreadMessageVO>().gpt_id, openai_message.id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadMessageVO>();

            if (technical_message) {
                technical_message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
                technical_message.user_id = user_id;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(technical_message);

                ConsoleHandler.log('GPTAssistantAPIServerController: Message technique créé et synchronisé avec succès');
                return technical_message;
            }

            ConsoleHandler.error('GPTAssistantAPIServerController.create_technical_message: message created in OpenAI but not found after sync');
            return null;

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.create_technical_message: ' + error);
            return null;
        }
    }

    /**
     * Ferme tous les runs en cours pour un thread donné (utilisé pour le realtime)
     * @param thread_id L'ID du thread pour lequel fermer les runs
     */
    public static async close_realtime_runs(thread_id: number): Promise<void> {
        if (!thread_id) {
            return;
        }

        try {
            const runs: OseliaRunVO[] = await query(OseliaRunVO.API_TYPE_ID)
                .filter_by_num_eq('thread_id', thread_id)
                .filter_by_num_eq('run_type', OseliaRunVO.RUN_TYPE_REALTIME)
                .filter_is_null('end_date')
                .select_vos<OseliaRunVO>();

            if (runs?.length) {
                for (const run of runs) {
                    run.end_date = Dates.now();
                    run.state = OseliaRunVO.STATE_DONE;
                }

                await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(runs);
                ConsoleHandler.log('GPTAssistantAPIServerController.close_realtime_runs: Closed ' + runs.length + ' realtime runs for thread_id: ' + thread_id);
            }
        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.close_realtime_runs:ERROR: thread_id:' + thread_id + ':' + error);
        }
    }

    public static async postupdate_rdv_cr_vo_handle_pipe(vo: DAOUpdateVOHolder<any>) {
        // const convCtx = GPTAssistantAPIServerController.conversations.forEach(async (ctx) => {
        //     if (!ctx || !ctx.openaiSocket || !ctx.vo) {
        //         return;
        //     }

        //     if (ctx.vo) {
        //         if ((ctx.vo as IPlanRDVCR)?.id && vo.post_update_vo.id === (ctx.vo as IPlanRDVCR).id) {
        //             ctx.cr_vo = vo.post_update_vo;
        //             ctx.cr_field_titles = await ModuleProgramPlanBase.getInstance().getRDVCRType(vo.post_update_vo.rdv_id);
        //             ctx.openaiSocket.send(JSON.stringify({
        //                 type: 'conversation.item.create',
        //                 item: {
        //                     type: 'message',
        //                     role: "system",
        //                     content: [
        //                         {
        //                             type: "input_text",
        //                             text: "Le compte rendu vient d'être modifié par l'utilisateur"
        //                         }
        //                     ]
        //                 },
        //             }));
        //         }
        //     }
        // });
    }

    /**
     * Demander un run d'un assistant suite à un nouveau message
     * @param session_id null pour une nouvelle session, id de la session au sens de l'API GPT
     * @param conversation_id null pour un nouveau thread, sinon l'id du thread au sens de l'API GPT
     * @param user_id contenu text du nouveau message
     * @returns
     */
    public static async connect_to_realtime_voice(
        session_id: string,
        conversation_id: string,
        thread_id: string,
        user_id: number,
        oselia_run_template?: OseliaRunTemplateVO,
        initial_cache_key?: string,
        technical_message_prompt?: string  // Nouveau paramètre pour le message technique
    ): Promise<void> {
        try {
            let session: GPTRealtimeAPISessionVO = null;
            if (!conversation_id || !thread_id || !user_id) {
                ConsoleHandler.error('GPTAssistantAPIServerController.connect_to_realtime_voice: Invalid parameters');
                return;
            }

            if (session_id) {
                session = await query(GPTRealtimeAPISessionVO.API_TYPE_ID)
                    .filter_by_id(parseInt(session_id))
                    .exec_as_server()
                    .select_vo<GPTRealtimeAPISessionVO>();
            } else {
                const current_user = await query(UserVO.API_TYPE_ID).filter_by_id(user_id).set_limit(1).select_vo<UserVO>();
                session = new GPTRealtimeAPISessionVO();
                session.name = "Session " + Dates.now() + " - " + current_user.name;
                session.modalities = ['text', 'audio'];
                session.output_audio_format = 'pcm16';
                session.input_audio_transcription_model = 'whisper-1';
                session.input_audio_format = 'pcm16';
                session.turn_detection_type = 'server_vad';
                session.turn_detection_threshold = 0.5;
                session.turn_detection_silence_duration_ms = 400;
                session.turn_detection_prefix_padding_ms = 150;
                session.voice = 'shimmer';
                session.tool_choice = 'auto';
                session.id = (await ModuleDAO.getInstance().insertOrUpdateVO(session)).id;
            }
            await this.create_realtime_session(session, conversation_id, thread_id, user_id, oselia_run_template, initial_cache_key, technical_message_prompt);
        } catch(error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.connect_to_realtime_voice: ' + error);
        }
        return;
    }


    /**
     * Vérifie si un thread a une session realtime active
     * @param thread_vo Le thread à vérifier
     * @returns La conversation realtime active ou null
     */
    private static get_active_realtime_conversation(thread_vo: GPTAssistantAPIThreadVO): ConversationContext | null {
        if (!thread_vo) {
            return null;
        }

        // Rechercher une conversation active pour ce thread
        for (const conversation of this.conversations.values()) {
            if (conversation.current_thread_id === thread_vo.id.toString() &&
                conversation.openaiSocket &&
                conversation.openaiSocket.readyState === conversation.openaiSocket.OPEN) {
                return conversation;
            }
        }

        return null;
    }

    /**
     * Envoie un message vers une session realtime active si elle existe
     * @param thread_vo Le thread concerné
     * @param content_text Le contenu du message
     * @param user_id L'ID de l'utilisateur
     */
    private static async send_message_to_realtime_if_active(
        thread_vo: GPTAssistantAPIThreadVO,
        content_text: string,
        user_id: number = null
    ): Promise<void> {
        const activeConversation = this.get_active_realtime_conversation(thread_vo);

        if (!activeConversation || !content_text?.trim()) {
            return;
        }

        try {
        // Générer un ID unique pour tracer le message
            const messageId = `thread_msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;

            // Créer un message conversation item pour le realtime
            const conversationItem = {
                type: 'conversation.item.create',
                item: {
                    id: messageId,
                    type: 'message',
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: content_text
                        }
                    ]
                }
            };

            // Envoyer le message à la session realtime
            if (activeConversation.openaiSocket.readyState === activeConversation.openaiSocket.OPEN) {
                activeConversation.openaiSocket.send(JSON.stringify(conversationItem));

                ConsoleHandler.log(`GPTAssistantAPIServerController: Message thread envoyé à realtime [${messageId}]: ${content_text.substring(0, 50)}...`);

                // Déclencher une réponse automatique
                setTimeout(() => {
                    if (activeConversation.openaiSocket.readyState === activeConversation.openaiSocket.OPEN) {
                        activeConversation.openaiSocket.send(JSON.stringify({
                            type: 'response.create',
                            response: {
                                modalities: ['text', 'audio'],
                                instructions: 'Réponds au message utilisateur qui vient d\'être envoyé depuis le thread.'
                            }
                        }));
                    }
                }, 100);
            }

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.send_message_to_realtime_if_active:', error);
        }
    }

    /**
 * Synchronise un message realtime avec le thread OpenAI traditionnel
 */
    private static async sync_realtime_message_to_thread(
        thread_vo: GPTAssistantAPIThreadVO,
        message_item: any,
        user_id: number,
        message_source: string
    ): Promise<void> {
        if (!thread_vo || !message_item) {
            return;
        }

        try {
        // Extraire le contenu texte du message
            let content_text = '';
            if (message_item.content && Array.isArray(message_item.content)) {
                for (const content of message_item.content) {
                    if (content.type === 'text' && content.text) {
                        content_text += content.text;
                    } else if (content.type === 'input_text' && content.text) {
                        content_text += content.text;
                    }
                }
            } else if (typeof message_item.content === 'string') {
                content_text = message_item.content;
            }

            if (!content_text.trim()) {
                return;
            }

            // Créer le message dans OpenAI (pour la cohérence)
            const openai_message = await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.messages.create,
                ModuleGPTServer.openai.beta.threads.messages,
                thread_vo.gpt_thread_id,
                {
                    role: message_item.role || 'user',
                    content: message_source ? `[${message_source.toUpperCase()}] ${content_text}` : content_text,
                }
            );

            if (openai_message) {
            // Synchroniser les messages du thread pour inclure le nouveau message
                await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

                ConsoleHandler.log(`GPTAssistantAPIServerController: Message realtime synchronisé avec le thread (${message_source}): ${content_text.substring(0, 50)}...`);
            }

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.sync_realtime_message_to_thread:', error);
        }
    }

    /**
     * Initialise (si besoin) le serveur WebSocket local **et** la socket OpenAI pour la conversation.
     * @param conversationId identifiant logique de la conversation – un seul par socket OpenAI
     */
    private static async create_realtime_session(
        session: GPTRealtimeAPISessionVO,
        conversationId: string,
        thread_id: string,
        user_id: number,
        oselia_run_template?: OseliaRunTemplateVO,
        initial_cache_key?: string,
        technical_message_prompt?: string  // Nouveau paramètre pour le message technique
    ): Promise<void> {
        try {
            if (!session) {
                ConsoleHandler.error('GPTAssistantAPIServerController.create_realtime_session: Invalid session');
                return;
            }

            // Récupération du thread et de l'assistant
            const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadVO>().id, parseInt(thread_id))
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadVO>();
            if (!thread_vo) {
                ConsoleHandler.error('GPTAssistantAPIServerController.create_realtime_session: thread not found for id: ' + thread_id);
                return;
            }
            if (!oselia_run_template) {
                ConsoleHandler.error('GPTAssistantAPIServerController.create_realtime_session: oselia_run_template not found');
                throw new Error('GPTAssistantAPIServerController.create_realtime_session: oselia_run_template not found');
            }

            // Déterminer l'assistant à utiliser :
            // 1. Assistant du template (priorité)
            // 2. Assistant Osélia actuel du thread
            // 3. Assistant par défaut du thread
            const target_assistant_id = oselia_run_template.assistant_id ||
                           thread_vo.current_oselia_assistant_id ||
                           thread_vo.current_default_assistant_id;


            const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIAssistantVO>().id, target_assistant_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            if (!assistant) {
                ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: assistant not found for id: ${target_assistant_id}`);
                throw new Error(`GPTAssistantAPIServerController.create_realtime_session: assistant not found for id: ${target_assistant_id}`);
            }

            // Mettre à jour le thread avec l'assistant choisi pour maintenir la cohérence
            if (thread_vo.current_oselia_assistant_id !== assistant.id) {
                thread_vo.current_oselia_assistant_id = assistant.id;
                thread_vo.current_default_assistant_id = assistant.id;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);
                ConsoleHandler.log(`GPTAssistantAPIServerController.create_realtime_session: Thread ${thread_vo.id} mis à jour avec assistant ${assistant.id}`);
            }
            const user = await query(UserVO.API_TYPE_ID)
                .filter_by_id(user_id)
                .exec_as_server()
                .select_vo<UserVO>();
            if (!user) {
                ConsoleHandler.error('GPTAssistantAPIServerController.create_realtime_session: user not found for id: ' + user_id);
                throw new Error('GPTAssistantAPIServerController.create_realtime_session: user not found for id: ' + user_id);
            }
            // Récupération des fonctions et paramètres
            const { availableFunctions, availableFunctionsParameters } =
                await GPTAssistantAPIServerController.get_availableFunctions_and_availableFunctionsParameters(
                    assistant,
                    user_id,
                    thread_vo.gpt_thread_id
                );
            const availableFunctionsParametersByParamName = {};
            for (const i in availableFunctionsParameters) {
                availableFunctionsParametersByParamName[i] = {};
                for (const param of availableFunctionsParameters[i]) {
                    availableFunctionsParametersByParamName[i][param.gpt_funcparam_name] = param;
                }
            }
            let initial_cache_values = null;
            // Création du run Osélia pour la session realtime
            if(initial_cache_key) {
                initial_cache_values = await ModuleOseliaServer.getInstance().get_cache_value(thread_vo, initial_cache_key);
            }

            // Vérifier s'il existe déjà un run realtime actif pour ce thread
            let session_run = await query(OseliaRunVO.API_TYPE_ID)
                .filter_by_num_eq('thread_id', thread_vo.id)
                .filter_by_num_eq('run_type', OseliaRunVO.RUN_TYPE_REALTIME)
                .filter_is_null('end_date')
                .exec_as_server()
                .select_vo<OseliaRunVO>();

            if (!session_run) {
                // Aucun run realtime actif trouvé, créer un nouveau run
                session_run = await OseliaRunTemplateServerController.create_run_from_template(
                    oselia_run_template,
                    null,
                    initial_cache_values ? { [initial_cache_key]: initial_cache_values } : null,
                    null,
                    thread_vo,
                    user,
                    null,
                    null,
                    null,
                    false
                );
                session_run.run_type = OseliaRunVO.RUN_TYPE_REALTIME;
                session_run.state = OseliaRunVO.STATE_RUNNING;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(session_run);
                ConsoleHandler.log(`GPTAssistantAPIServerController.create_realtime_session: Nouveau run realtime créé (id: ${session_run.id}) pour thread_id: ${thread_vo.id}`);
            } else {
                // Réutiliser le run existant et le marquer comme actif
                session_run.state = OseliaRunVO.STATE_RUNNING;
                session_run.end_date = null; // S'assurer qu'il n'est pas marqué comme terminé
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(session_run);
                ConsoleHandler.log(`GPTAssistantAPIServerController.create_realtime_session: Réutilisation du run realtime existant (id: ${session_run.id}) pour thread_id: ${thread_vo.id}`);
            }

            // Générer un résumé de la conversation si le thread a du contenu existant
            let conversationSummary = '';
            if (thread_vo.has_content) {
                try {
                    conversationSummary = await this.generate_conversation_summary(thread_vo);
                    if (conversationSummary && conversationSummary.length > 0) {
                        ConsoleHandler.log(`GPTAssistantAPIServerController.create_realtime_session: Résumé généré pour le thread ${thread_vo.id} (${conversationSummary.length} caractères)`);
                    }
                } catch (error) {
                    ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: Erreur lors de la génération du résumé: ${error}`);
                }
            }

            // Préparation des tools pour OpenAI
            const functions: GPTAssistantAPIFunctionVO[] = Object.values(availableFunctions);
            const params_by_function_id = availableFunctionsParameters;
            const tools = functions.map(f => ({
                type: 'function',
                name: f.gpt_function_name,
                description: f.gpt_function_description,
                parameters: {
                    type: 'object',
                    properties: (params_by_function_id[f.id] || []).reduce((acc, param) => {
                        acc[param.gpt_funcparam_name] = {
                            type: GPTAssistantAPIFunctionParamVO.TYPE_TO_OPENAI[param.type],
                            description: param.gpt_funcparam_description,
                        };
                        return acc;
                    }, {}),
                    required: (params_by_function_id[f.id] || []).filter(p => p.required).map(p => p.gpt_funcparam_name),
                },
            }));

            /* ────────────────────────────────────────────────────────────────
            0)  Récupère l’utilisateur courant pour l’injecter dans le contexte
            ──────────────────────────────────────────────────────────────────*/
            const current_user = await query(UserVO.API_TYPE_ID)
                .filter_by_id(user_id)
                .set_limit(1)
                .select_vo<UserVO>();
            // 1) ----------------------------------------------------------------------
            //    Création du WebSocketServer local (une seule instance)
            if (!this.wss) {
                const PORT = Number(ConfigurationService.node_configuration.port) + 10;
                this.wss = new WebSocketServer({ port: PORT });
                if(ConfigurationService.node_configuration.debug_oselia_realtime) {
                    ConsoleHandler.log(`WebSocket Server en écoute sur ws://localhost:${PORT}`);
                }
                // —> Connexion d’un client navigateur / app
                this.wss.on('connection', (clientSocket: WebSocket) => {
                    let joinedConversationId: string | null = null;

                    /**
               * Message reçu du client
               * → JSON : relais vers OpenAI
               * → Binaire : buffer audio PCM16 24 kHz mono
               */
                    clientSocket.on('message', async (data: RawData) => {
                        try {
                            const str = data.toString('utf8');
                            const msg = JSON.parse(str);
                            if (ConfigurationService.node_configuration.debug_oselia_realtime) {
                                ConsoleHandler.log('Client → Server :', msg);
                            }
                            // — Handshake : le client indique la conversation qu’il rejoint
                            if (!joinedConversationId && msg?.conversation_id) {
                                joinedConversationId = msg.conversation_id;
                                const convCtx = GPTAssistantAPIServerController.conversations.get(joinedConversationId);
                                if (!convCtx) {
                                    ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: Conversation inconnue : ${joinedConversationId}`);
                                    clientSocket.close();
                                    return;
                                }
                                convCtx.clients.add(clientSocket);
                                convCtx.current_thread_id = thread_id;

                                // Maintenant qu'on connaît la conversation, on peut activer le bon run
                                if (convCtx.session_run && convCtx.session_run.state !== OseliaRunVO.STATE_RUNNING) {
                                    convCtx.session_run.state = OseliaRunVO.STATE_RUNNING;
                                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(convCtx.session_run);
                                    ConsoleHandler.log(`GPTAssistantAPIServerController: Run ${convCtx.session_run.id} remis en état RUNNING pour la conversation ${joinedConversationId}`);
                                }

                                /* replay tous les messages manqués */
                                for (const bufferedMsg of convCtx.buffered) {
                                    clientSocket.send(JSON.stringify(bufferedMsg));
                                }
                                convCtx.buffered.length = 0;
                                clientSocket.send(JSON.stringify({
                                    type: 'connected_to_conversation',
                                    msg: 'Vous êtes connecté à la conversation.'
                                }));
                                return;
                            }

                            // — Après handshake : relais texte → OpenAI
                            if (joinedConversationId) {
                                const convCtx = GPTAssistantAPIServerController.conversations.get(joinedConversationId)!;
                                if (convCtx.openaiSocket.readyState === WebSocket.OPEN) {
                                    convCtx.openaiSocket.send(str);
                                }
                            }
                        } catch (_) {
                            // — Binaire (audio) ---------------------------------------------------
                            if (joinedConversationId) {
                                const convCtx = GPTAssistantAPIServerController.conversations.get(joinedConversationId)!;
                                if (convCtx.openaiSocket.readyState === WebSocket.OPEN) {
                                    const payload = {
                                        type: 'input_audio_buffer.append',
                                        audio: (data as Buffer).toString('base64'), // PCM 16 bits / 24 kHz mono
                                    } as const;
                                    convCtx.openaiSocket.send(JSON.stringify(payload));
                                }
                            }
                        }
                    });

                    // — Fermeture côté client ----------------------------------------------
                    clientSocket.on('close', () => {
                        if (joinedConversationId) {
                            const convCtx = GPTAssistantAPIServerController.conversations.get(joinedConversationId);
                            if (convCtx) {
                                convCtx.clients.delete(clientSocket);
                                if (convCtx.clients.size === 0) {
                                    // Dernier participant : on ferme la socket OpenAI et synchronise les messages
                                    if (convCtx.openaiSocket.readyState === WebSocket.OPEN) convCtx.openaiSocket.close();

                                    // Synchroniser les messages Realtime avec OpenAI après la fermeture de la session
                                    this.sync_realtime_messages_to_openai(convCtx.current_thread_id).then(() => {
                                        ConsoleHandler.log(`GPTAssistantAPIServerController: Messages Realtime synchronisés avec OpenAI pour le thread ${convCtx.current_thread_id}`);
                                    }).catch((error) => {
                                        ConsoleHandler.error(`GPTAssistantAPIServerController: Erreur lors de la synchronisation des messages Realtime: ${error}`);
                                    });

                                    this.conversations.delete(joinedConversationId);
                                }
                            }
                        }
                    });
                });
            }

            // 2) ----------------------------------------------------------------------
            //    Conversation déjà initialisée ?
            if (this.conversations.has(conversationId)) {
                const oldCtx = this.conversations.get(conversationId)!;
                for (const c of oldCtx.clients) c.close();
                oldCtx.openaiSocket.close();
                this.conversations.delete(conversationId);
            }

            // 3) ----------------------------------------------------------------------
            //    Ouverture de la socket OpenAI pour cette conversation
            const openaiSocket = new WebSocket(
                'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03',
                {
                    headers: {
                        Authorization: `Bearer ${ConfigurationService.node_configuration.open_api_api_key}`,
                        'OpenAI-Beta': 'realtime=v1',
                    },
                },
            );

            const convCtx: ConversationContext = {
                openaiSocket,
                clients: new Set<WebSocket>(),
                buffered: [],
                current_user,
                current_thread_id: thread_id,
                vo: undefined,
                session_run: session_run, // Stocker le run pour pouvoir l'arrêter proprement
                conversation_summary: conversationSummary, // Résumé de la conversation existante
            } as const;
            this.conversations.set(conversationId, convCtx);

            openaiSocket.setMaxListeners(this.MAX_LISTENERS);

            // ——————————————————————————————————————————
            //  OPENAI → SERVER
            // ——————————————————————————————————————————

            /**
           * Génère un ID unique côté serveur pour les items créés
           */
            const newItemId = () => `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`;

            /**
           * Envoie un item function_call_output + relance la génération
           */
            const sendFunctionCallOutput = (
                callId: string,
                previousItemId: string,
                output: any,
            ) => {
                openaiSocket.send(JSON.stringify({
                    type: 'conversation.item.create',
                    previous_item_id: previousItemId,
                    item: {
                        id: newItemId(),
                        type: 'function_call_output',
                        call_id: callId,
                        output: JSON.stringify(output ?? null),
                    },
                }));

                // ► relance la génération (texte + audio suivant les préférences)
                openaiSocket.send(JSON.stringify({ type: 'response.create', response: { modalities: ['text', 'audio'] }}));
            };
            // — Socket OPEN ------------------------------------------------------------
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    modalities: session.modalities ?? ['text', 'audio'],
                    output_audio_format: session.output_audio_format ?? 'pcm16',
                    input_audio_transcription: { model: session.input_audio_transcription_model ?? 'whisper-1' },
                    input_audio_format: session.input_audio_format ?? 'pcm16',
                    turn_detection: {
                        type: session.turn_detection_type ?? 'server_vad',
                        threshold: session.turn_detection_threshold ?? 0.5,
                        silence_duration_ms: session.turn_detection_silence_duration_ms ?? 400,
                        prefix_padding_ms: session.turn_detection_prefix_padding_ms ?? 150,
                        create_response: true,
                        interrupt_response: true,
                    },
                    voice: session.voice ?? 'shimmer',
                    instructions: assistant.instructions ?? 'Vous êtes un assistant virtuel.',
                    tools,
                    tool_choice: 'auto',
                    speed: 1.2,
                },
            };

            openaiSocket.once('open', async () => {
                openaiSocket.send(JSON.stringify(sessionUpdate));
                if(initial_cache_key && initial_cache_values) {
                    openaiSocket.send(JSON.stringify({
                        type: 'conversation.item.create',
                        item: {
                            type: 'message',
                            role: "system",
                            content: [
                                {
                                    type: "input_text",
                                    text: `Cache key available: ${initial_cache_key}. Use this key when calling cache functions.`
                                }
                            ]
                        },
                    }));
                }

                // Envoyer le message technique initial si fourni (contexte prime, CR, etc.)
                if (technical_message_prompt && technical_message_prompt.trim()) {
                    openaiSocket.send(JSON.stringify({
                        type: 'conversation.item.create',
                        item: {
                            type: 'message',
                            role: "system",
                            content: [
                                {
                                    type: "input_text",
                                    text: `[TECHNICAL INFO] ${technical_message_prompt}`
                                }
                            ]
                        },
                    }));

                    // Créer aussi le message en base pour l'historique permanent
                    await this.create_technical_message(thread_vo.gpt_thread_id, technical_message_prompt, user_id);
                }

                // Envoyer le résumé de la conversation existante en mode technique si disponible
                if (convCtx.conversation_summary && convCtx.conversation_summary.length > 0) {
                    openaiSocket.send(JSON.stringify({
                        type: 'conversation.item.create',
                        item: {
                            type: 'message',
                            role: "system",
                            content: [
                                {
                                    type: "input_text",
                                    text: convCtx.conversation_summary
                                }
                            ]
                        },
                    }));
                    ConsoleHandler.log(`GPTAssistantAPIServerController: Résumé de conversation envoyé à Realtime pour le thread ${convCtx.current_thread_id}`);
                }
            });

            // ——————————————————————————————————————————
            //  Gestion des messages venant d’OpenAI
            // ——————————————————————————————————————————
            openaiSocket.on('message', async (data: RawData) => {
                const { clients } = convCtx;

                // 1) — Essaye de parser en JSON
                let msg: any = null;
                try {
                    msg = JSON.parse(data.toString('utf8'));
                } catch {
                    // Binaire → on broadcast tel quel
                    for (const c of clients) if (c.readyState === WebSocket.OPEN) c.send(data, { binary: true });
                    return;
                }

                // --- AUCUN client connecté : on stocke et on sort ---
                if (convCtx.clients.size === 0) {
                    convCtx.buffered.push(msg ?? data);
                    return;
                }

                if (ConfigurationService.node_configuration.debug_oselia_realtime) {
                    ConsoleHandler.log('OpenAI → Server :', msg);
                }

                switch (msg.type) {
                    case 'conversation.item.created':
                        // Message utilisateur créé
                        if (msg.item?.type === 'message' && msg.item?.role === 'user') {
                            // Extraire le contenu
                            let content_text = '';
                            if (msg.item.content && Array.isArray(msg.item.content)) {
                                for (const content of msg.item.content) {
                                    if (content.type === 'text' && content.text) {
                                        content_text += content.text;
                                    } else if (content.type === 'input_text' && content.text) {
                                        content_text += content.text;
                                    }
                                }
                            }

                            if (content_text.trim()) {
                                await this.send_transcription_to_thread(
                                    convCtx.current_thread_id,
                                    content_text,
                                    convCtx.current_user.id,
                                    false // from_oselia = false pour utilisateur
                                );
                            }
                        }
                        break;

                    case 'response.content_part.done':
                        if (msg.part?.transcript) {
                            await this.send_transcription_to_thread(
                                convCtx.current_thread_id,
                                (msg.part.transcript),
                                convCtx.current_user.id,
                                true // from_oselia = true pour assistant
                            );
                        } else if (msg.part?.type === 'text' && msg.part?.text) {
                            await this.send_transcription_to_thread(
                                convCtx.current_thread_id,
                                msg.part.text,
                                convCtx.current_user.id,
                                true // from_oselia = true pour assistant
                            );
                        }
                        break;

                    case 'conversation.item.input_audio_transcription.completed':
                        // Transcription de l'audio utilisateur
                        if (msg.transcript) {
                            await this.send_transcription_to_thread(
                                convCtx.current_thread_id,
                                msg.transcript,
                                convCtx.current_user.id,
                                false // from_oselia = true pour assistant
                            );
                        }
                        break;

                    case 'input_audio_buffer.speech_started':
                        // ► Dis aux clients de couper le son immédiatement
                        for (const c of clients) if (c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ type: 'stop_audio_playback' }));
                        }
                        return;

                    case 'output_audio_buffer':
                        if (msg.audio) {
                            const raw = Buffer.from(msg.audio, 'base64');
                            for (const c of clients) if (c.readyState === WebSocket.OPEN) c.send(raw, { binary: true });
                            return;
                        }
                        break;

                    case 'session.updated':
                        for (const c of clients) if (c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({ type: 'oselia_listening' }));
                        }
                        return;

                    case 'response.output_item.done':
                        if (msg.item?.type === 'function_call') {
                            const { name: fnName, arguments: rawArgs, call_id: callId, id: itemId } = msg.item;
                            session_run.state = OseliaRunVO.STATE_TODO;
                            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(session_run);
                            /**
                             * Parse JSON de façon robuste :
                             * - si `rawArgs` est déjà un objet → on le renvoie tel quel ;
                             * - si c’est une string, on tente un JSON.parse ;
                             * - en cas d’échec, on log et on retourne `{}` pour éviter le crash.
                             */
                            const args: Record<string, any> = (() => {
                                if (rawArgs == null) return {};

                                // Cas : OpenAI renvoie parfois directement un objet (rare, mais déjà vu)
                                if (typeof rawArgs === 'object') return rawArgs as Record<string, any>;

                                if (typeof rawArgs === 'string') {
                                    try {
                                        return JSON.parse(rawArgs);
                                    } catch (e) {
                                        ConsoleHandler.error(
                                            `GPTAssistantAPIServerController.create_realtime_session: Impossible de parser les arguments de la fonction «${fnName}» : ${rawArgs}`,
                                            e
                                        );
                                        return {};            // on continue sans planter
                                    }
                                }

                                // Type inattendu
                                ConsoleHandler.warn(`GPTAssistantAPIServerController.create_realtime_session: Type inattendu pour arguments de ${fnName} :`, typeof rawArgs);
                                return {};
                            })();

                            let output: unknown = null;
                            const confidence_error_msg = "Confiance trop faible dans la demande, pose les questions qu'il te manquerait pour être sûr.";
                            const retry_error_msg = "La demande d'appel de fonction ne nous semble pas cohérente, vérifie ce que tu fais, ou pose des questions s'il faut puis retente.";
                            try {
                                const function_vo = availableFunctions[fnName];
                                if (!function_vo) {
                                    output = { error: `Fonction inconnue : ${fnName}` };
                                } else {
                                    // 4. Instancie un OseliaRunFunctionCallVO vierge (pour traçabilité)
                                    const oselia_run_function_call_vo = new OseliaRunFunctionCallVO();
                                    // ICI On check avec l'assistant fait pour ça
                                    if (await this.check_with_assistant(fnName, JSON.stringify(args), availableFunctionsParametersByParamName)) {
                                        // 5. Appelle la fonction via ta logique
                                        output = await GPTAssistantAPIServerController.do_function_call(
                                            session_run, // récupéré dans ta session
                                            null, // ou le run_vo si tu veux tracker le run aussi
                                            thread_vo,
                                            null, // referrer (à récupérer si besoin)
                                            function_vo,
                                            oselia_run_function_call_vo,
                                            fnName,
                                            JSON.stringify(args),
                                            availableFunctionsParameters,
                                            availableFunctionsParametersByParamName,
                                            {} // referrer_external_api_by_name
                                        );
                                    } else {
                                        // On renvoie un message à realtime pour demander de poser des questions ou de retenter en vérifiant les arguments
                                        output = {
                                            error: retry_error_msg,
                                        };
                                    }
                                }
                            } catch (err) {
                                ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: ${err}`);
                                session_run.state = OseliaRunVO.STATE_ERROR;
                                session_run.error_msg = String(err);
                                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(session_run);
                                output = { error: String(err) };
                            }

                            // —> On envoie la sortie & on relance la génération
                            sendFunctionCallOutput(callId, itemId, output);
                            return;
                        }
                        break;
                }

                // Le reste du code existant continue ici...
                if (msg?.type === 'input_audio_buffer.speech_started') {
                    // ► Dis aux clients de couper le son immédiatement
                    for (const c of clients) if (c.readyState === WebSocket.OPEN) {
                        c.send(JSON.stringify({ type: 'stop_audio_playback' }));
                    }
                    return;
                }
                // 2) — Output audio (base64)
                if (msg?.type === 'output_audio_buffer' && msg.audio) {
                    const raw = Buffer.from(msg.audio, 'base64');
                    for (const c of clients) if (c.readyState === WebSocket.OPEN) c.send(raw, { binary: true });
                    return;
                }

                // 3) — Session prête : on fais jouer aux utilisateurs un son
                if (msg?.type === 'session.updated') {
                    for (const c of clients) if (c.readyState === WebSocket.OPEN) {
                        c.send(JSON.stringify({ type: 'oselia_listening' }));
                    }
                    return;
                }

                // 5.1) — Response créée (par OpenAI) - on sauvegarde la réponse de l'assistant dans le thread
                // if (msg?.type === 'response.done' && msg.response?.output?.length > 0) {
                //     // Extraire le contenu des messages de réponse
                //     for (const output_item of msg.response.output) {
                //         if (output_item.type === 'message' && output_item.content?.length > 0) {
                //             for (const content_part of output_item.content) {
                //                 if (content_part.type === 'text' && content_part.text) {
                //                     // Sauvegarder la réponse de l'assistant dans le thread
                //                     // Utiliser send_transcription_to_thread pour créer directement en base (mode Realtime)
                //                     try {
                //                         this.send_transcription_to_thread(
                //                             convCtx.current_thread_id,
                //                             content_part.text,
                //                             convCtx.current_user.id,
                //                             true // from_oselia = true pour indiquer que c'est une réponse d'assistant
                //                         );
                //                     } catch (error) {
                //                         ConsoleHandler.error('GPTAssistantAPIServerController.create_realtime_session: Error saving assistant response to thread: ' + error);
                //                     }
                //                 }
                //             }
                //         }
                //     }
                // }

                // // // 6) Transcription audio
                // if (msg?.type === 'response.audio_transcript.done' && msg.transcript) {
                //     this.send_transcription_to_thread(
                //         convCtx.current_thread_id,
                //         msg.transcript,
                //         convCtx.current_user.id,
                //         true
                //     );
                // }

                // if (msg?.type === 'conversation.item.input_audio_transcription.completed') {
                //     this.send_transcription_to_thread(
                //         convCtx.current_thread_id,
                //         msg.transcript,
                //         convCtx.current_user.id,
                //     );
                // }

                // 7) — Tout le reste : broadcast JSON tel quel
                for (const c of clients) if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(msg));
            });

            // ——————————————————————————————————————————
            //  Fermeture / Erreur socket OpenAI
            // ——————————————————————————————————————————
            openaiSocket.on('close', async () => {
                // Synchroniser une dernière fois le thread pour s'assurer que tous les messages sont envoyés à OpenAI
                if (convCtx.current_thread_id) {
                    try {
                        // Récupérer le thread_vo depuis l'ID
                        const closing_thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                            .filter_by_id(parseInt(convCtx.current_thread_id))
                            .exec_as_server()
                            .select_vo<GPTAssistantAPIThreadVO>();

                        if (closing_thread_vo) {
                            ConsoleHandler.log(`GPTAssistantAPIServerController.create_realtime_session: Synchronisation finale des messages pour le thread ${closing_thread_vo.id}`);
                            await GPTAssistantAPIServerController.resync_thread_messages(closing_thread_vo);
                        }
                    } catch (error) {
                        ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: Erreur lors de la synchronisation finale: ${error}`);
                    }
                }

                // Fermer proprement le run Oselia associé à cette session
                if (convCtx.session_run) {
                    try {
                        convCtx.session_run.state = OseliaRunVO.STATE_DONE;
                        convCtx.session_run.end_date = Dates.now();
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(convCtx.session_run);
                        ConsoleHandler.log(`GPTAssistantAPIServerController.create_realtime_session: Realtime session run ${convCtx.session_run.id} properly closed`);
                    } catch (error) {
                        ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session:Error closing realtime session run: ${error}`);
                    }
                }

                for (const c of convCtx.clients) if (c.readyState === WebSocket.OPEN) c.close();
                this.conversations.delete(conversationId);
            });

            openaiSocket.on('error', async (err) => {
                ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: OpenAI socket error [${conversationId}] : ${err}`);

                // Marquer le run comme erreur lors d'une erreur de socket
                if (convCtx.session_run) {
                    convCtx.session_run.state = OseliaRunVO.STATE_ERROR;
                    convCtx.session_run.error_msg = String(err);
                    convCtx.session_run.end_date = Dates.now();
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(convCtx.session_run);
                }

                openaiSocket.close();
            });
        } catch (error) {
            ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: ${error}`);
        }
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

    private static async send_transcription_to_thread(
        thread_id: string,
        transcription: string,
        user_id: number,
        from_oselia?: boolean
    ) {
        if (!transcription || transcription.length === 0) {
            return;
        }

        const thread_vo: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(parseInt(thread_id))
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread_vo) {
            ConsoleHandler.error('send_transcription_to_thread: Thread not found');
            return;
        }

        try {
        // Vérifier si une session Realtime est active pour ce thread
            const activeRealtimeConversation = this.get_active_realtime_conversation(thread_vo);

            if (activeRealtimeConversation) {
            // Si Realtime est actif, créer directement le message en base sans passer par l'API OpenAI
            // pour éviter les conflits tout en gardant l'historique
                ConsoleHandler.log('send_transcription_to_thread: Creating local message because Realtime is active for thread: ' + thread_id);

                // Obtenir le poids suivant pour ce thread
                const lastMessage = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
                    .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
                    .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, false))
                    .set_limit(1)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIThreadMessageVO>();

                const nextWeight = (lastMessage ? lastMessage.weight : 0) + 1;

                // Créer le message directement en base
                const transcription_message = new GPTAssistantAPIThreadMessageVO();
                transcription_message.thread_id = thread_vo.id;
                transcription_message.gpt_thread_id = thread_vo.gpt_thread_id;
                transcription_message.user_id = user_id || thread_vo.user_id;
                transcription_message.role = from_oselia ? GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT : GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
                transcription_message.date = Dates.now();
                transcription_message.weight = nextWeight;
                transcription_message.archived = false;

                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(transcription_message);

                // Créer le contenu texte d'abord
                const text_content = new GPTAssistantAPIThreadMessageContentTextVO();
                text_content.value = transcription;
                text_content.annotations = [];

                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(text_content);

                // Créer le contenu du message et le lier au texte
                const message_content = new GPTAssistantAPIThreadMessageContentVO();
                message_content.thread_message_id = transcription_message.id;
                message_content.gpt_thread_message_id = transcription_message.gpt_id;
                message_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
                message_content.weight = 0;
                message_content.content_type_text = text_content;

                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message_content);

                // Marquer le thread comme ayant du contenu
                if (!thread_vo.has_content) {
                    thread_vo.has_content = true;
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);
                }

                // Déclencher la synchronisation du thread pour actualiser l'interface
                await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

                ConsoleHandler.log('send_transcription_to_thread: Message de transcription créé localement pour thread: ' + thread_id + ' - contenu: ' + transcription.substring(0, 50) + '...');
                return;
            }

            // Créer le message directement via l'API OpenAI pour assurer la synchronisation
            const role = from_oselia ? 'assistant' : 'user';

            await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.messages.create,
                ModuleGPTServer.openai.beta.threads.messages,
                thread_vo.gpt_thread_id,
                {
                    role: role,
                    content: transcription,
                }
            );

            // Resynchroniser automatiquement le thread pour récupérer le message créé
            await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

        } catch (error) {
            ConsoleHandler.error('send_transcription_to_thread: Error creating message in OpenAI: ' + error);
        }
    }

    /**
     * Génère un résumé textuel de la conversation existante dans un thread
     * pour l'envoyer en mode technique à Realtime
     */
    private static async generate_conversation_summary(thread_vo: GPTAssistantAPIThreadVO): Promise<string> {
        if (!thread_vo) {
            return '';
        }

        try {
            // Récupérer tous les messages du thread (non archivés)
            const messages = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
                .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
                .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, true))
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageVO>();

            if (!messages || messages.length === 0) {
                return '';
            }

            let summary = `**RÉSUMÉ DE LA CONVERSATION PRÉCÉDENTE**\n\n`;
            summary += `Thread: ${thread_vo.thread_title || `Thread ${thread_vo.id}`}\n`;
            summary += `Nombre de messages: ${messages.length}\n\n`;

            // Parcourir les messages et extraire le contenu
            for (const message of messages) {
                try {
                    // Récupérer le contenu du message
                    const contents = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
                        .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, message.id)
                        .exec_as_server()
                        .select_vos<GPTAssistantAPIThreadMessageContentVO>();

                    if (!contents || contents.length === 0) {
                        continue;
                    }

                    // Prendre le premier contenu de type texte
                    const content = contents.find(c => c.content_type_text) || contents[0];
                    if (!content || !content.content_type_text) {
                        continue;
                    }

                    const text_content = await query(GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID)
                        .filter_by_id(content.content_type_text.id)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIThreadMessageContentTextVO>();

                    if (!text_content || !text_content.value) {
                        continue;
                    }

                    // Formater le message selon le rôle
                    const role_label = message.role === GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT ? 'Assistant' : 'Utilisateur';
                    const date_str = message.date ? Dates.format(message.date, 'dd/MM/yyyy HH:mm') : '';

                    summary += `**${role_label}** ${date_str ? `(${date_str})` : ''}:\n`;
                    summary += `${text_content.value}\n\n`;

                } catch (error) {
                    ConsoleHandler.error(`generate_conversation_summary: Erreur lors de la récupération du message ${message.id}: ${error}`);
                }
            }

            summary += `**FIN DU RÉSUMÉ**\n\n`;
            summary += `Tu peux maintenant continuer la conversation en tenant compte de cet historique. L'utilisateur va maintenant communiquer avec toi en mode vocal temps réel.`;

            return summary;

        } catch (error) {
            ConsoleHandler.error(`generate_conversation_summary: Erreur générale: ${error}`);
            return '';
        }
    }


    private static async check_with_assistant(fnName: string, args: string, availableFunctionsParametersByParamName: Record<string, any>): Promise<boolean> {
        try {
            const check_assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, ModuleGPT.ASSISTANT_CHECK_OSELIA_REALTIME_FUNCTION)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            if (!check_assistant) {
                ConsoleHandler.error(`check_with_assistant: Assistant de vérification non trouvé pour la fonction ${fnName}`);
                // En cas d'erreur, on autorise par défaut pour ne pas bloquer le système
                return true;
            }

            if (!check_assistant.gpt_assistant_id) {
                ConsoleHandler.warn(`check_with_assistant: Assistant de vérification pas encore synchronisé avec OpenAI pour la fonction ${fnName}`);
                // En cas d'erreur, on autorise par défaut pour ne pas bloquer le système
                return true;
            }

            // Préparer le message de vérification pour l'assistant
            const verification_message = `Veuillez analyser cet appel de fonction pour vérifier sa cohérence :

**Fonction :** ${fnName}
**Arguments fournis :** ${args}

Paramètres attendus pour cette fonction :
${JSON.stringify(availableFunctionsParametersByParamName, null, 2)}

Évaluez si cet appel de fonction est cohérent et logique. 
Répondez par "AUTORISE" si l'appel est correct, ou "REFUSE" suivi de vos recommandations si il y a des problèmes.`;

            // Créer un thread temporaire pour la vérification
            const temp_thread = await GPTAssistantAPIServerController.get_thread(
                await ModuleVersionedServer.getInstance().get_robot_user_id(),
                null,
                check_assistant.id
            );

            if (!temp_thread || !temp_thread.thread_vo) {
                ConsoleHandler.error(`check_with_assistant: Impossible de créer un thread temporaire pour la vérification de ${fnName}`);
                return true; // Autoriser par défaut en cas d'erreur
            }

            // Faire l'appel à l'assistant de vérification
            const verification_messages = await GPTAssistantAPIServerController.ask_assistant(
                check_assistant.gpt_assistant_id,
                temp_thread.thread_vo.gpt_thread_id,
                `Vérification fonction ${fnName}`,
                verification_message,
                [], // pas de fichiers
                await ModuleVersionedServer.getInstance().get_robot_user_id(),
                false, // ne pas cacher le prompt
                null, // pas d'osélia run
                null, // pas de purpose state
                null, // pas d'additional tools
                null, // pas de referrer
                false // pas de voice summary
            );

            if (!verification_messages || verification_messages.length === 0) {
                ConsoleHandler.error(`check_with_assistant: Aucune réponse de l'assistant de vérification pour ${fnName}`);
                return true; // Autoriser par défaut en cas d'erreur
            }

            // Analyser la réponse de l'assistant
            let assistant_response = '';
            for (const message of verification_messages) {
                if (message.role === GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT) {
                    // Récupérer le contenu du message
                    const contents = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
                        .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, message.id)
                        .exec_as_server()
                        .select_vos<GPTAssistantAPIThreadMessageContentVO>();

                    for (const content of contents) {
                        if (content.content_type_text) {
                            const text_content = await query(GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID)
                                .filter_by_id(content.content_type_text.id)
                                .exec_as_server()
                                .select_vo<GPTAssistantAPIThreadMessageContentTextVO>();

                            if (text_content && text_content.value) {
                                assistant_response += text_content.value + ' ';
                            }
                        }
                    }
                }
            }

            // Analyser la réponse
            const response_upper = assistant_response.toUpperCase();
            if (response_upper.includes('AUTORISE')) {
                ConsoleHandler.log(`check_with_assistant: Fonction ${fnName} autorisée par l'assistant de vérification`);
                return true;
            } else if (response_upper.includes('REFUSE')) {
                ConsoleHandler.warn(`check_with_assistant: Fonction ${fnName} refusée par l'assistant de vérification: ${assistant_response}`);
                return false;
            } else {
                ConsoleHandler.warn(`check_with_assistant: Réponse ambiguë de l'assistant de vérification pour ${fnName}: ${assistant_response}`);
                // En cas de réponse ambiguë, on penche vers la prudence mais on autorise pour ne pas bloquer
                return true;
            }

        } catch (error) {
            ConsoleHandler.error(`check_with_assistant: Erreur lors de la vérification de ${fnName}: ${error}`);
            // En cas d'erreur, on autorise par défaut pour ne pas bloquer le système
            return true;
        }
    }
    /**
     * Synchronise les messages Realtime stockés en local avec OpenAI après la fermeture d'une session Realtime
     */
    private static async sync_realtime_messages_to_openai(thread_id: string) {
        if (!thread_id) {
            return;
        }

        try {
            const thread_vo: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(parseInt(thread_id))
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadVO>();

            if (!thread_vo) {
                ConsoleHandler.error('sync_realtime_messages_to_openai: Thread not found');
                return;
            }

            // Récupérer tous les messages créés localement (avec gpt_id commençant par 'realtime_')
            const realtime_messages = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
                .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageVO>();

            if (!realtime_messages || realtime_messages.length === 0) {
                return;
            }

            // Filtrer les messages créés pendant la session Realtime (gpt_id commence par 'realtime_')
            const messages_to_sync = realtime_messages.filter(msg =>
                msg.gpt_id && msg.gpt_id.startsWith('realtime_')
            );

            if (messages_to_sync.length === 0) {
                return;
            }

            ConsoleHandler.log(`sync_realtime_messages_to_openai: Synchronisation de ${messages_to_sync.length} messages Realtime avec OpenAI pour le thread ${thread_id}`);

            // Trier les messages par poids pour maintenir l'ordre
            messages_to_sync.sort((a, b) => a.weight - b.weight);

            // Synchroniser chaque message avec OpenAI
            for (const message of messages_to_sync) {
                try {
                    // Récupérer le contenu du message
                    const content = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
                        .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id, message.id)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIThreadMessageContentVO>();

                    if (!content || !content.content_type_text) {
                        continue;
                    }

                    const text_content = await query(GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID)
                        .filter_by_id(content.content_type_text.id)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIThreadMessageContentTextVO>();

                    if (!text_content || !text_content.value) {
                        continue;
                    }

                    // Créer le message dans OpenAI
                    const openai_message = await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.threads.messages.create,
                        ModuleGPTServer.openai.beta.threads.messages,
                        thread_vo.gpt_thread_id,
                        {
                            role: message.role === GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT ? 'assistant' : 'user',
                            content: text_content.value,
                        }
                    );

                    // Mettre à jour le gpt_id avec l'ID OpenAI réel
                    if (openai_message && openai_message.id) {
                        message.gpt_id = openai_message.id;
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message);
                        ConsoleHandler.log(`sync_realtime_messages_to_openai: Message ${message.id} synchronisé avec OpenAI (ID: ${openai_message.id})`);
                    }

                } catch (error) {
                    ConsoleHandler.error(`sync_realtime_messages_to_openai: Erreur lors de la synchronisation du message ${message.id}: ${error}`);
                }
            }

            // Resynchroniser le thread complet après l'ajout des messages
            await GPTAssistantAPIServerController.resync_thread_messages(thread_vo);

            ConsoleHandler.log(`sync_realtime_messages_to_openai: Synchronisation terminée pour le thread ${thread_id}`);

        } catch (error) {
            ConsoleHandler.error(`sync_realtime_messages_to_openai: Erreur générale: ${error}`);
        }
    }

    private static async close_thread_oselia(thread_vo: GPTAssistantAPIThreadVO) {
        await all_promises([
            GPTAssistantAPIServerController.resync_thread_messages(thread_vo),
            query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(thread_vo.id)
                .exec_as_server()
                .update_vos<GPTAssistantAPIThreadVO>({
                oselia_is_running: false,
                current_oselia_assistant_id: null,
                current_oselia_prompt_id: null,
            }),
        ]);
    }

    private static async get_asking_message(
        thread_vo: GPTAssistantAPIThreadVO,
        oselia_run: OseliaRunVO,
        last_thread_msg: GPTAssistantAPIThreadMessageVO,
        user_id: number,
        new_msg_content_text: string,
        new_msg_files: FileVO[],
        hide_content: boolean = false,
        is_system_message: boolean = false
    ): Promise<GPTAssistantAPIThreadMessageVO> {
        let has_image_file: boolean = false;
        const has_sound_file: boolean = false;
        let asking_message_vo: GPTAssistantAPIThreadMessageVO = null;
        const files_images: FileVO[] = [];
        if (new_msg_content_text || (new_msg_files && new_msg_files.length)) {

            asking_message_vo = new GPTAssistantAPIThreadMessageVO();

            asking_message_vo.oselia_run_id = oselia_run ? oselia_run.id : null;
            asking_message_vo.autogen_voice_summary = oselia_run.generate_voice_summary;

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
                        assistant_file_vo.id = (await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_file_vo)).id;
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
            asking_message_vo.role = is_system_message ? GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_SYSTEM : GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
            asking_message_vo.user_id = user_id ? user_id : thread_vo.user_id;
            asking_message_vo.is_ready = false;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(asking_message_vo);

            const contents = [];
            const current_user = await query(UserVO.API_TYPE_ID).filter_by_id(user_id).set_limit(1).select_vo<UserVO>();
            const content = new GPTAssistantAPIThreadMessageContentVO();
            content.thread_message_id = asking_message_vo.id;
            content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content.content_type_text.value = new_msg_content_text;
            content.gpt_thread_message_id = asking_message_vo.gpt_id;
            content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content.weight = 0;
            content.hidden = hide_content;
            contents.push(content);

            const content_name = new GPTAssistantAPIThreadMessageContentVO();
            content_name.thread_message_id = asking_message_vo.id;
            content_name.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_name.content_type_text.value = '<name:' + current_user.name + '>';
            content_name.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_name.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_name.weight = 1;
            content_name.hidden = true;
            contents.push(content_name);

            const content_email = new GPTAssistantAPIThreadMessageContentVO();
            content_email.thread_message_id = asking_message_vo.id;
            content_email.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_email.content_type_text.value = '<email:' + current_user.email + '>';
            content_email.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_email.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_email.weight = 2;
            content_email.hidden = true;
            contents.push(content_email);

            const content_phone = new GPTAssistantAPIThreadMessageContentVO();
            content_phone.thread_message_id = asking_message_vo.id;
            content_phone.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_phone.content_type_text.value = '<phone:' + current_user.phone + '>';
            content_phone.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_phone.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_phone.weight = 3;
            content_phone.hidden = true;
            contents.push(content_phone);

            const content_user_id = new GPTAssistantAPIThreadMessageContentVO();
            content_user_id.thread_message_id = asking_message_vo.id;
            content_user_id.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            content_user_id.content_type_text.value = '<user_id:' + user_id.toString() + '>';
            content_user_id.gpt_thread_message_id = asking_message_vo.gpt_id;
            content_user_id.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            content_user_id.weight = 4;
            content_user_id.hidden = true;
            contents.push(content_user_id);

            if (has_image_file) {
                let i = 0;
                for (const images of files_images) {
                    const c = new GPTAssistantAPIThreadMessageContentVO();
                    c.thread_message_id = asking_message_vo.id;
                    c.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
                    c.content_type_text.value = "[" + images.path + ":" + images.id.toString() + "]";
                    c.gpt_thread_message_id = asking_message_vo.gpt_id;
                    c.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
                    c.weight = 5 + i++;
                    c.hidden = true;
                    contents.push(c);
                }
            }
            await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(contents);

            asking_message_vo.is_ready = true;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(asking_message_vo);
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
        oselia_run: OseliaRunVO,
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
                                const oselia_run_function_call_vo = new OseliaRunFunctionCallVO();

                                try {

                                    const function_vo: GPTAssistantAPIFunctionVO = availableFunctions[tool_call.function.name];

                                    function_response = await this.do_function_call(
                                        oselia_run,
                                        run_vo,
                                        thread_vo,
                                        referrer,
                                        function_vo,
                                        oselia_run_function_call_vo,
                                        tool_call.function.name,
                                        tool_call.function.arguments,
                                        availableFunctionsParameters,
                                        availableFunctionsParametersByParamName,
                                        referrer_external_api_by_name,
                                    );

                                    await this.handle_function_response(function_response, tool_outputs, function_vo, tool_call.id);
                                    return;

                                } catch (error) {
                                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - error: ' + error);
                                    function_response = "TECHNICAL MALFUNCTION : submit_tool_outputs - error: " + error;

                                    oselia_run_function_call_vo.end_date = Dates.now();
                                    oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_ERROR;
                                    oselia_run_function_call_vo.error_msg = error;
                                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);

                                    tool_outputs.push({
                                        tool_call_id: tool_call.id,
                                        output: function_response,
                                    });
                                }
                            })());
                        }

                        await all_promises(promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici

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

                            } else if ((error.status === 400) && error.error && error.error.message && error.error.message.includes('Runs in status ') && error.error.message.includes(' do not accept tool outputs')) {
                                // Cas erreur : 'Error: 400 Runs in status "queued" do not accept tool outputs.'
                                // On attend un peu et on reteste
                                await ThreadHandler.sleep(1000, 'GPTAssistantAPIServerController.ask_assistant');

                                try {
                                    // Submit tool outputs
                                    await GPTAssistantAPIServerController.wrap_api_call(
                                        ModuleGPTServer.openai.beta.threads.runs.submitToolOutputs,
                                        ModuleGPTServer.openai.beta.threads.runs,
                                        thread_vo.gpt_thread_id,
                                        run.id,
                                        { tool_outputs: tool_outputs }
                                    );
                                } catch (e) {
                                    ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: run requires_action - submit_tool_outputs - error - retried from error 400 Runs in status ...:new error: ' + e);
                                    throw e;
                                }
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
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_vo);

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


    private static async call_function_and_perf_report(
        oselia_function: GPTAssistantAPIFunctionVO,
        oselia_run_function_call_vo: OseliaRunFunctionCallVO,
        function_to_call: () => Promise<any>,
        module_of_function_to_call: IModuleBase,
        ordered_args: any[],

        function_perf_name: string,
        function_perf_description: string,

        thread_vo: GPTAssistantAPIThreadVO,
        thread_perf_name: string,
        thread_perf_description: string,

        in_ts_ms: number,

    ): Promise<unknown> {

        let function_response = null;

        await all_promises([ // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
            (async () => {
                oselia_run_function_call_vo.start_date = Dates.now();
                oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_RUNNING;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);
            })(),
            (async () => {

                const pre_ts_ms = Dates.now_ms();
                PerfReportController.add_cooldown(
                    GPTAssistantAPIServerController.PERF_MODULE_NAME,
                    function_perf_name,
                    function_perf_name,
                    function_perf_description,
                    in_ts_ms,
                    pre_ts_ms,
                    'For thread [' + thread_vo.id + ']' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? ' - ' + thread_vo.thread_title : '') +
                    '<br>' +
                    'Internal - ' + oselia_function.module_name + '.' + oselia_function.module_function + ' - ' + JSON.stringify(ordered_args),
                );
                PerfReportController.add_cooldown(
                    GPTAssistantAPIServerController.PERF_MODULE_NAME,
                    thread_perf_name,
                    thread_perf_name,
                    thread_perf_description,
                    in_ts_ms,
                    pre_ts_ms,
                    'Run function - ' + oselia_function.gpt_function_name + ' - ' + oselia_function.gpt_function_description +
                    '<br>' +
                    'Internal - ' + oselia_function.module_name + '.' + oselia_function.module_function + ' - ' + JSON.stringify(ordered_args),
                );

                function_response = await function_to_call.call(module_of_function_to_call, ...ordered_args);

                const post_ts_ms = Dates.now_ms();
                PerfReportController.add_call(
                    GPTAssistantAPIServerController.PERF_MODULE_NAME,
                    function_perf_name,
                    function_perf_name,
                    function_perf_description,
                    pre_ts_ms,
                    post_ts_ms,
                    'For thread [' + thread_vo.id + ']' + (((!thread_vo.needs_thread_title_build) && thread_vo.thread_title) ? ' - ' + thread_vo.thread_title : '') +
                    '<br>' +
                    'Internal - ' + oselia_function.module_name + '.' + oselia_function.module_function + ' - ' + JSON.stringify(ordered_args),
                );
                PerfReportController.add_call(
                    GPTAssistantAPIServerController.PERF_MODULE_NAME,
                    thread_perf_name,
                    thread_perf_name,
                    thread_perf_description,
                    pre_ts_ms,
                    post_ts_ms,
                    'Run function - ' + oselia_function.gpt_function_name + ' - ' + oselia_function.gpt_function_description +
                    '<br>' +
                    'Internal - ' + oselia_function.module_name + '.' + oselia_function.module_function + ' - ' + JSON.stringify(ordered_args),
                );
            })(),
        ]);

        return function_response;
    }

    private static async link_oselia_run_to_thread(
        prompt: string,
        thread_vo: GPTAssistantAPIThreadVO,
        oselia_run: OseliaRunVO,
        assistant_id: number,
        user_id: number,
        referrer_id: number,
        generate_voice_summary: boolean,
    ): Promise<OseliaRunVO> {

        if (!oselia_run) {

            const ask_assistant_run_template: OseliaRunTemplateVO = await query(OseliaRunTemplateVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, OseliaRunTemplateVO.ASK_ASSISTANT_OSELIA_RUN_TEMPLATE)
                .exec_as_server()
                .set_max_age_ms(120000)
                .select_vo<OseliaRunTemplateVO>();

            if (!ask_assistant_run_template) {
                ConsoleHandler.error('GPTAssistantAPIServerController.ask_assistant: oselia_run_template not found');
                throw new Error('GPTAssistantAPIServerController.ask_assistant: oselia_run_template not found');
            }

            const weight = (await query(OseliaRunVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaRunVO>().thread_id, thread_vo.id)
                .filter_is_null_or_empty(field_names<OseliaRunVO>().parent_run_id)
                .exec_as_server()
                .select_count()) + 1;

            oselia_run = new OseliaRunVO();
            oselia_run.thread_id = thread_vo.id;
            oselia_run.template_id = ask_assistant_run_template.id;
            oselia_run.template_name = ask_assistant_run_template.name;
            oselia_run.assistant_id = assistant_id;
            oselia_run.user_id = user_id;
            oselia_run.childrens_are_multithreaded = ask_assistant_run_template.childrens_are_multithreaded;
            oselia_run.file_id_ranges = ask_assistant_run_template.file_id_ranges;
            oselia_run.hide_outputs = ask_assistant_run_template.hide_outputs;
            oselia_run.hide_prompt = ask_assistant_run_template.hide_outputs;
            oselia_run.initial_content_text = prompt;
            oselia_run.name = ask_assistant_run_template.name;
            oselia_run.start_date = Dates.now();
            oselia_run.run_start_date = Dates.now();
            oselia_run.run_type = OseliaRunVO.RUN_TYPE_ASSISTANT;
            oselia_run.state = OseliaRunVO.STATE_RUNNING;
            ask_assistant_run_template.thread_title = thread_vo.thread_title;
            oselia_run.use_splitter = ask_assistant_run_template.use_splitter;
            oselia_run.use_validator = ask_assistant_run_template.use_validator;
            oselia_run.weight = weight;
            oselia_run.referrer_id = referrer_id;
        }

        oselia_run.generate_voice_summary = oselia_run.generate_voice_summary || generate_voice_summary;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run);

        // Et l'inverse : on lie la discussion à l'osélia run
        thread_vo.last_oselia_run_id = oselia_run.id;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread_vo);

        return oselia_run;
    }
}
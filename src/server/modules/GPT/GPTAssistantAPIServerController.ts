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

            asking_message_vo = await this.get_asking_message(
                thread_vo,
                oselia_run,
                last_thread_msg,
                user_id,
                content_text,
                files,
                hide_prompt
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
        initial_cache_key?: string
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
            await this.create_realtime_session(session, conversation_id, thread_id, user_id, oselia_run_template, initial_cache_key);
        } catch(error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.connect_to_realtime_voice: ' + error);
        }
        return;
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
        initial_cache_key?: string
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
            const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIAssistantVO>().id, thread_vo.current_default_assistant_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            if (!assistant) {
                ConsoleHandler.error('GPTAssistantAPIServerController.create_realtime_session: assistant not found');
                throw new Error('GPTAssistantAPIServerController.create_realtime_session: assistant not found');
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

            // Création du run Osélia pour la session realtime
            const initial_cache_values = await ModuleOseliaServer.getInstance().get_cache_value(thread_vo, initial_cache_key);
            const session_run = await OseliaRunTemplateServerController.create_run_from_template(
                oselia_run_template,
                null,
                { [initial_cache_key]: initial_cache_values },
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
                    session_run.state = OseliaRunVO.STATE_RUNNING;
                    ModuleDAOServer.instance.insertOrUpdateVO_as_server(session_run);
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
                                    // Dernier participant : on ferme la socket OpenAI
                                    if (convCtx.openaiSocket.readyState === WebSocket.OPEN) convCtx.openaiSocket.close();
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

            openaiSocket.once('open', () => {
                openaiSocket.send(JSON.stringify(sessionUpdate));
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
                    convCtx.buffered.push(msg ?? data);   // on garde aussi le binaire
                    return;
                }
                if (ConfigurationService.node_configuration.debug_oselia_realtime) {
                    ConsoleHandler.log('OpenAI → Server :', msg);
                }
                if (convCtx.clients.size === 0) {
                    convCtx.buffered.push(msg);
                    return;
                }

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

                // 4) — APPels de fonctions ------------------------------------------------
                if (msg?.type === 'response.output_item.done' && msg.item?.type === 'function_call') {

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
                        ConsoleHandler.warn(`Type inattendu pour arguments de ${fnName} :`, typeof rawArgs);
                        return {};
                    })();

                    let output: unknown = null;
                    const confidence_error_msg = "Confiance trop faible dans la demande, pose les questions qu'il te manquerait pour être sûr.";
                    try {
                        const function_vo = availableFunctions[fnName];
                        if (!function_vo) {
                            output = { error: `Fonction inconnue : ${fnName}` };
                        } else {
                            // 4. Instancie un OseliaRunFunctionCallVO vierge (pour traçabilité)
                            const oselia_run_function_call_vo = new OseliaRunFunctionCallVO();

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
                        }

                        // try {
                        //     switch (fnName) {
                        //         case 'edit_cr_word': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             output = await ModuleGPT.getInstance().edit_cr_word(
                        //                 args.new_content,
                        //                 args.section,
                        //                 convCtx.cr_vo,
                        //                 convCtx.cr_field_titles,
                        //             );
                        //             break;
                        //         }
                        //         case 'get_cr_field_titles': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             output = convCtx.cr_field_titles ?? [];
                        //             break;
                        //         }
                        //         case 'get_current_cr_field': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             const cr_titles = convCtx.cr_field_titles ? convCtx.cr_field_titles.map(str => str.trim()).filter(str => str.length > 0) : [];
                        //             const idx = cr_titles?.indexOf(args.section) ?? -1;
                        //             output = idx >= 0 ? (convCtx.cr_vo as any)?.html_contents[idx] : null;
                        //             break;
                        //         }
                        //         case 'get_current_user_name': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             output = convCtx.current_user?.name ?? null;
                        //             break;
                        //         }
                        //         case 'get_current_consultant': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             const name = convCtx.cr_vo ? await ModuleProgramPlanBase.getInstance().getCurrentConsultant(convCtx.cr_vo): null;
                        //             output = name;
                        //             break;
                        //         }
                        //         case 'get_all_consultants': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             const consultants_names = await ModuleProgramPlanBase.getInstance()
                        //                 .getAllConsultantsName();
                        //             output = consultants_names;
                        //             break;
                        //         }
                        //         case 'set_current_consultant': {
                        //             if(args.confidence && args.confidence < 100) {
                        //                 output = { error: confidence_error_msg };
                        //                 break;
                        //             }
                        //             const list_of_consultants = await ModuleProgramPlanBase.getInstance()
                        //                 .getAllConsultantsName();
                        //             if (args.consultant_name && !list_of_consultants.includes(args.consultant_name)) {
                        //                 output = { error: `Le consultant ${args.consultant_name} n'existe pas dans la liste des consultants. Il faut strictement un consultant existant de cette liste.` };
                        //                 break;
                        //             }
                        //             output = await ModuleProgramPlanBase.getInstance()
                        //                 .setConsultantName(
                        //                     convCtx.cr_vo,
                        //                     args.consultant_name
                        //                 );
                        //             break;
                        //         }
                        //         case 'set_first_etape': {

                        //             output = await ModuleProgramPlanBase.getInstance()
                        //                 .setFirstEtape(convCtx.prime_object);
                        //             break;
                        //         }
                        //         case 'set_second_etape': {

                        //             output = await ModuleProgramPlanBase.getInstance()
                        //                 .setSecondEtape(convCtx.prime_object);
                        //             break;
                        //         }
                        //         case 'set_third_etape': {

                        //             output = await ModuleProgramPlanBase.getInstance()
                        //                 .setThirdEtape(convCtx.prime_object);
                        //             break;
                        //         }
                        //         case 'set_fourth_etape': {

                    //             output = await ModuleProgramPlanBase.getInstance()
                    //                 .setFourthEtape(convCtx.prime_object);
                    //             break;
                    //         }
                    //         default:
                    //             output = { error: `Fonction inconnue : ${fnName}` };
                    //     }
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

                // 5) — Item utilisateur créé (par OpenAI)
                if (msg?.type === 'conversation.item.created' && msg.item?.role === 'user') {
                    // En mode server_vad, OpenAI gère la création de la réponse ;
                    // on relaie seulement l’évènement au(x) client(s)
                    for (const c of clients) if (c.readyState === WebSocket.OPEN) {
                        c.send(JSON.stringify(msg));
                    }
                    return;
                }

                // 6) Transcription audio
                if (msg?.type === 'response.audio_transcript.done' && msg.transcript) {
                    this.send_transcription_to_thread(
                        convCtx.current_thread_id,
                        msg.transcript,
                        convCtx.current_user.id,
                        true
                    );
                }

                if (msg?.type === 'conversation.item.input_audio_transcription.completed') {
                    this.send_transcription_to_thread(
                        convCtx.current_thread_id,
                        msg.transcript,
                        convCtx.current_user.id,
                    );
                }

                // 7) — Tout le reste : broadcast JSON tel quel
                for (const c of clients) if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(msg));
            });

            // ——————————————————————————————————————————
            //  Fermeture / Erreur socket OpenAI
            // ——————————————————————————————————————————
            openaiSocket.on('close', () => {
                for (const c of convCtx.clients) if (c.readyState === WebSocket.OPEN) c.close();
                this.conversations.delete(conversationId);
            });

            openaiSocket.on('error', (err) => {
                ConsoleHandler.error(`GPTAssistantAPIServerController.create_realtime_session: OpenAI socket error [${conversationId}] : ${err}`);
                session_run.state = OseliaRunVO.STATE_ERROR;
                session_run.error_msg = String(err);
                ModuleDAOServer.instance.insertOrUpdateVO_as_server(session_run);
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


        const last_thread_msg: GPTAssistantAPIThreadMessageVO = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIThreadMessageVO>().thread_id, thread_vo.id)
            .filter_is_false(field_names<GPTAssistantAPIThreadMessageVO>().archived)
            .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, true))
            .set_limit(1)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadMessageVO>();

        const asking_message_vo = new GPTAssistantAPIThreadMessageVO();
        asking_message_vo.date = Dates.now();
        asking_message_vo.gpt_thread_id = thread_vo.gpt_thread_id;
        asking_message_vo.thread_id = thread_vo.id;
        asking_message_vo.weight = last_thread_msg ? last_thread_msg.weight + 1 : 0;
        if (from_oselia) {
            asking_message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT;
        } else {
            asking_message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
        }
        asking_message_vo.user_id = user_id ? user_id : thread_vo.user_id;
        asking_message_vo.is_ready = false;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(asking_message_vo);

        const message_content = new GPTAssistantAPIThreadMessageContentVO();
        message_content.thread_message_id = asking_message_vo.id;
        message_content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        message_content.content_type_text.value = transcription;
        message_content.gpt_thread_message_id = asking_message_vo.gpt_id;
        message_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        message_content.weight = 0;
        message_content.hidden = false;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(message_content);

        asking_message_vo.is_ready = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(asking_message_vo);
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
        hide_content: boolean = false
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
            asking_message_vo.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
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
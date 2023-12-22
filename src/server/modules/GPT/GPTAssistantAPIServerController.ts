import { Assistant } from 'openai/resources/beta/assistants/assistants';
import { MessageContentImageFile, MessageCreateParams, ThreadMessage } from 'openai/resources/beta/threads/messages/messages';
import { Thread } from 'openai/resources/beta/threads/threads';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ModuleGPTServer from './ModuleGPTServer';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { Run, RunCreateParams } from 'openai/resources/beta/threads/runs/runs';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import ModulesManagerServer from '../ModulesManagerServer';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleServerBase from '../ModuleServerBase';
import { all_promises } from '../../../shared/tools/PromiseTools';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import { FileContent, FileObject } from 'openai/resources';
import { createReadStream, writeFileSync } from 'fs';
import FileServerController from '../File/FileServerController';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import { Uploadable } from 'openai/uploads';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';

export default class GPTAssistantAPIServerController {

    public static async get_file(file_id: string): Promise<{ file_gpt: FileObject, assistant_file_vo: GPTAssistantAPIFileVO }> {

        try {

            let file_gpt = await ModuleGPTServer.openai.files.retrieve(file_id);

            let assistant_file_vo = await GPTAssistantAPIServerController.check_or_create_assistant_file_vo(file_gpt);
            return { file_gpt, assistant_file_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.get_file: ' + error);
        }
        return null;
    }

    public static async send_file(file_vo: FileVO, purpose: number): Promise<{ file_gpt: FileObject, assistant_file_vo: GPTAssistantAPIFileVO }> {

        try {

            let file_gpt = await ModuleGPTServer.openai.files.create({
                purpose: GPTAssistantAPIFileVO.PURPOSE_LABELS[purpose] as 'fine-tune' | 'assistants',
                file: createReadStream(file_vo.path) as any as Uploadable
            });

            let assistant_file_vo = new GPTAssistantAPIFileVO();
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

            let assistant_gpt = await ModuleGPTServer.openai.beta.assistants.retrieve(assistant_id);

            // On crée l'assistant en base si il n'existe pas, sinon on le charge simplement pour faire le lien avec les messages
            let assistant_vo = await GPTAssistantAPIServerController.check_or_create_assistant_vo(assistant_gpt);
            return { assistant_gpt, assistant_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.getAssistant: ' + error);
        }
        return null;
    }

    public static async get_thread(thread_id: string = null): Promise<{ thread_gpt: Thread, thread_vo: GPTAssistantAPIThreadVO }> {

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
            let thread_vo = await GPTAssistantAPIServerController.check_or_create_thread_vo(thread_gpt);
            return { thread_gpt, thread_vo };

        } catch (error) {
            ConsoleHandler.error('GPTAssistantAPIServerController.getThread: ' + error);
        }

        return null;
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
        message: MessageCreateParams,
        files: FileVO[]): Promise<{ message_gpt: ThreadMessage, message_vo: GPTAssistantAPIThreadMessageVO }> {

        try {

            let assistant_files: GPTAssistantAPIFileVO[] = [];
            let file_ids: string[] = [];
            for (let i in files) {
                let file = files[i];

                // On regarde si le fichier est déjà associé à un assistant_file_vo
                let assistant_file_vo = await query(GPTAssistantAPIFileVO.API_TYPE_ID).filter_by_id(file.id, FileVO.API_TYPE_ID).exec_as_server().select_vo<GPTAssistantAPIFileVO>();
                if (!!assistant_file_vo) {
                    assistant_files.push(assistant_file_vo);
                    file_ids.push(assistant_file_vo.gpt_file_id);
                    continue;
                }

                // On doit push le fichier sur l'API GPT
                let file_w = await GPTAssistantAPIServerController.send_file(file, GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS);
                if (!file_w) {
                    continue;
                }

                assistant_files.push(file_w.assistant_file_vo);
                file_ids.push(file_w.assistant_file_vo.gpt_file_id);
            }

            message.file_ids = file_ids;

            let message_gpt = await ModuleGPTServer.openai.beta.threads.messages.create(
                thread_vo.gpt_thread_id,
                message
            );

            if (!message_gpt) {
                return null;
            }

            let message_vo = new GPTAssistantAPIThreadMessageVO();
            message_vo.gpt_message_id = message_gpt.id;
            message_vo.date = message_gpt.created_at;

            switch (message.role) {
                case 'user':
                    message_vo.role_type = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER;
                    break;
                default:
                    message_vo.role_type = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
                    break;
            }
            message_vo.thread_id = thread_vo.id;
            message_vo.user_id = thread_vo.user_id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(message_vo);

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
        if (!!assistant_vo) {
            return assistant_vo;
        }

        assistant_vo = new GPTAssistantAPIAssistantVO();
        assistant_vo.gpt_assistant_id = assistant.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(assistant_vo);

        return assistant_vo;
    }

    public static async check_or_create_thread_vo(thread_gpt: Thread): Promise<GPTAssistantAPIThreadVO> {

        if (!thread_gpt) {
            return null;
        }

        let thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, thread_gpt.id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>();
        if (!!thread_vo) {
            return thread_vo;
        }

        thread_vo = new GPTAssistantAPIThreadVO();
        thread_vo.gpt_thread_id = thread_gpt.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);

        return thread_vo;
    }

    public static async check_or_create_run_vo(run_gpt: Run): Promise<GPTAssistantAPIRunVO> {

        if (!run_gpt) {
            return null;
        }

        let run_vo = await query(GPTAssistantAPIRunVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIRunVO>().gpt_run_id, run_gpt.id).exec_as_server().select_vo<GPTAssistantAPIRunVO>();
        if (!!run_vo) {
            return run_vo;
        }

        let assistant_vo = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, run_gpt.assistant_id).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();
        if (!assistant_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_run_vo: assistant not found: ' + run_gpt.assistant_id);
            return null;
        }

        let thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadVO>().gpt_thread_id, run_gpt.thread_id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>();
        if (!thread_vo) {
            ConsoleHandler.error('GPTAssistantAPIServerController.check_or_create_run_vo: thread not found: ' + run_gpt.thread_id);
            return null;
        }

        run_vo = new GPTAssistantAPIRunVO();
        run_vo.gpt_run_id = run_gpt.id;
        run_vo.assistant_id = assistant_vo.id;
        run_vo.thread_id = thread_vo.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run_vo);

        return run_vo;
    }

    public static async check_or_create_message_vo(message_gpt: ThreadMessage, thread_vo: GPTAssistantAPIThreadVO): Promise<GPTAssistantAPIThreadMessageVO> {

        if (!message_gpt) {
            return null;
        }

        if (!thread_vo) {
            return null;
        }

        let message_vo = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIThreadMessageVO>().gpt_message_id, message_gpt.id).exec_as_server().select_vo<GPTAssistantAPIThreadMessageVO>();
        if (!!message_vo) {
            return message_vo;
        }

        let run: GPTAssistantAPIRunVO = null;
        if (!!message_gpt.run_id) {

            let run_gpt = await ModuleGPTServer.openai.beta.threads.runs.retrieve(thread_vo.gpt_thread_id, message_gpt.run_id);
            run = await GPTAssistantAPIServerController.check_or_create_run_vo(run_gpt);
        }

        message_vo = new GPTAssistantAPIThreadMessageVO();
        message_vo.gpt_message_id = message_gpt.id;
        message_vo.date = message_gpt.created_at;
        message_vo.run_id = run ? run.id : null;
        message_vo.assistant_id = run ? run.assistant_id : null;
        message_vo.thread_id = thread_vo.id;
        message_vo.user_id = thread_vo.user_id;
        message_vo.role_type = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_LABELS.indexOf(message_gpt.role);

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(message_vo);

        if (message_gpt.content && Array.isArray(message_gpt.content)) {
            let weight = 0;
            for (let i in message_gpt.content) {
                let content = message_gpt.content[i];

                switch (content.type) {
                    case 'image_file':
                        let image_message_content = new GPTAssistantAPIThreadMessageContentVO();
                        let assistant_file = await GPTAssistantAPIServerController.get_file(content.image_file.file_id);
                        image_message_content.assistant_file_id = assistant_file.assistant_file_vo.id;
                        image_message_content.message_id = message_vo.id;
                        image_message_content.weight = weight++;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_message_content);
                        break;

                    case 'text':
                    default:
                        let text_message_content = new GPTAssistantAPIThreadMessageContentVO();
                        text_message_content.value = content.text.value;
                        text_message_content.annotations = []; // TODO FIXME : content.text.annotations;
                        text_message_content.message_id = message_vo.id;
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
        if (!!assistant_file_vo) {
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

            let vo_file_name = 'gpt_' + file_gpt.id + '_' + assistant_file_vo.id + '_' + assistant_file_vo.filename;

            let folder = './sfiled/gpt_assistant_files/';
            await FileServerController.getInstance().makeSureThisFolderExists(folder);
            writeFileSync(folder + vo_file_name, bufferView);

            let file_vo = new FileVO();
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
     *
     * @param assistant_id
     * @param message
     * @param files ATTENTION : Limité à 10 fichiers dans l'API GPT pour le moment
     * @returns
     */
    public static async askAssistant(assistant_id: string, message: MessageCreateParams, files: FileVO[]): Promise<string> {

        let assistant: { assistant_gpt: Assistant, assistant_vo: GPTAssistantAPIAssistantVO } = await GPTAssistantAPIServerController.get_assistant(assistant_id);

        if ((!assistant) || (!assistant.assistant_gpt) || (!assistant.assistant_vo)) {
            ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: assistant (gpt or vo) not found: ' + assistant_id);
            return null;
        }

        // On récupère les fonctions configurées sur cet assistant
        let availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO } = {};
        let functions: GPTAssistantAPIFunctionVO[] = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_id(assistant.assistant_vo.id, GPTAssistantAPIAssistantVO.API_TYPE_ID).using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIFunctionVO>();

        for (let i in functions) {
            let functionVO = functions[i];

            availableFunctions[functionVO.name] = functionVO;
        }

        let thread: { thread_gpt: Thread, thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread();

        if ((!thread) || (!thread.thread_gpt) || (!thread.thread_vo)) {
            ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: thread (gpt or vo) not created');
            return null;
        }

        let asking_message: {
            message_gpt: ThreadMessage;
            message_vo: GPTAssistantAPIThreadMessageVO;
        } = await GPTAssistantAPIServerController.push_message(
            thread.thread_vo,
            message as MessageCreateParams,
            files
        );

        //  La discussion est en place, on peut demander à l'assistant de répondre
        let run_params: RunCreateParams = {
            assistant_id: assistant.assistant_gpt.id
        };

        let run = await ModuleGPTServer.openai.beta.threads.runs.create(
            thread.thread_gpt.id,
            run_params
        );

        while (run.status != "completed") {

            switch (run.status) {
                case "cancelled":
                case "cancelling":
                    ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: run cancelled');
                    return null;
                case "expired":
                    ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: run expired');
                    return null;
                case "failed":
                    ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: run failed');
                    return null;
                case "requires_action":

                    // On doit appeler la fonction suivante pour que l'assistant puisse répondre
                    if (run.required_action && run.required_action.type == 'submit_tool_outputs') {

                        let tool_outputs = [];
                        let promises = [];

                        for (let tooli in run.required_action.submit_tool_outputs.tool_calls) {
                            let tool_call = run.required_action.submit_tool_outputs.tool_calls[tooli];

                            promises.push((async () => {
                                let function_response = null;

                                try {

                                    let function_vo: GPTAssistantAPIFunctionVO = availableFunctions[tool_call.function.name];
                                    let function_to_call: () => Promise<any> = ModulesManager.getInstance().getModuleByNameAndRole(function_vo.module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME)[function_vo.module_function];
                                    let function_args = JSON.parse(tool_call.function.arguments);
                                    function_response = await function_to_call.call(null, function_vo.ordered_function_params_from_GPT_arguments(function_args));
                                } catch (error) {
                                    ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: run requires_action - submit_tool_outputs - error: ' + error);
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
                        ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: run requires_action - type not supported: ' + run.required_action.type);
                        return null;
                    }

                case "queued":
                case "in_progress":
                default:
                    break;
            }

            await ThreadHandler.sleep(100, 'GPTAssistantAPIServerController.askAssistant');
            run = await ModuleGPTServer.openai.beta.threads.runs.retrieve(
                thread.thread_gpt.id,
                run.id
            );

            if (!run) {
                ConsoleHandler.error('GPTAssistantAPIServerController.askAssistant: run not found');
                return null;
            }
        }

        // Par défaut ça charge les 20 derniers messages, et en ajoutant after on a les messages après le asking_message - donc les réponses finalement
        let thread_messages = await ModuleGPTServer.openai.beta.threads.messages.list(thread.thread_gpt.id, {
            after: asking_message.message_gpt.id
        });

        let res: string = "";

        for (let i in thread_messages.data) {
            let thread_message: ThreadMessage = thread_messages.data[i];

            await GPTAssistantAPIServerController.check_or_create_message_vo(thread_message, thread.thread_vo);
        }

        return res;
    }
}
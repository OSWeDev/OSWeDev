import { FunctionDefinition, FunctionParameters } from 'openai/resources';
import { Assistant, AssistantTool, AssistantsPage } from 'openai/resources/beta/assistants';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleGPTServer from './ModuleGPTServer';
import { cloneDeep } from 'lodash';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../env/ConfigurationService';
import { Thread } from 'openai/resources/beta/threads/threads';
import { Message, MessagesPage } from 'openai/resources/beta/threads/messages';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIThreadMessageAttachmentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageAttachmentVO';

export default class GPTAssistantAPIServerSyncThreadsController {

    /**
     * On récupère tous les threads de l'API GPT et on les synchronise avec Osélia
     *  Ce qui signifie créer dans Osélia les Threads de GPT qui n'existent pas encore => sauf qu'on a pas de get_all_threads dans l'API GPT... donc on peut pas faire ça
     *  Archiver les threads d'Osélia qui n'existent plus dans GPT (et pas encore archivés dans Osélia)
     */
    private static async sync_threads() {
        const threads_vos: GPTAssistantAPIThreadVO[] = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIThreadVO>();

        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
        for (const i in threads_vos) {
            const thread_vo = threads_vos[i];

            await promise_pipeline.push(async () => {
                const thread_gpt = await ModuleGPTServer.openai.beta.threads.retrieve(thread_vo.gpt_thread_id);

                if (!thread_gpt) {

                    // On archive le thread dans Osélia
                    if (!thread_vo.archived) {
                        thread_vo.archived = true;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo);
                    }

                    return;
                }


                // On synchronise les messages du thread
                await this.sync_thread_messages(thread_vo, thread_gpt);
            });
        }
    }

    /**
     * On récupère tous les messages d'un thread de l'API GPT et on les intègre dans Osélia si on ne les a pas encore
     * Et on archive les messages qui n'existent plus dans GPT
     * @param thread_vo
     * @param thread_gpt
     */
    private static async sync_thread_messages(
        thread_vo: GPTAssistantAPIThreadVO,
        thread_gpt: Thread
    ) {
        const thread_messages: Message[] = await this.get_all_messages(thread_gpt.id);
        const thread_messages_vos: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_id(thread_vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIThreadMessageVO>();
        const thread_messages_vos_by_gpt_message_id: { [gpt_message_id: string]: GPTAssistantAPIThreadMessageVO } = {};

        for (const i in thread_messages_vos) {
            const thread_message_vo = thread_messages_vos[i];
            thread_messages_vos_by_gpt_message_id[thread_message_vo.gpt_id] = thread_message_vo;
        }

        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
        for (const i in thread_messages) {
            const thread_message = thread_messages[i];

            await promise_pipeline.push(GPTAssistantAPIServerSyncThreadsController.sync_thread_message(thread_vo, thread_message, thread_messages_vos_by_gpt_message_id));
        }
    }

    private async sync_thread_message(
        thread_vo: GPTAssistantAPIThreadVO,
        thread_message: Message,
        thread_messages_vos_by_gpt_message_id: { [gpt_message_id: string]: GPTAssistantAPIThreadMessageVO }
    ) {
        let thread_message_vo = thread_messages_vos_by_gpt_message_id[thread_message.id];

        if (!thread_message_vo) {
            // On le crée
            thread_message_vo = new GPTAssistantAPIThreadMessageVO();
            thread_message_vo.gpt_id = thread_message.id;
            thread_message_vo.thread_id = thread_vo.id;
            thread_message_vo.archived = false;

            if (!thread_message.assistant_id) {
                thread_message_vo.assistant_id = null;
            } else {
                const assistant = await GPTAssistantAPIServerSyncAssistantsController.get_assistant_or_sync(thread_message.assistant_id);
                thread_message_vo.assistant_id = assistant.id;
            }

            for (const i in thread_message.attachments) {
                const attachment = thread_message.attachments[i];

                // On crée les attachments
                const attachment_vo = new GPTAssistantAPIThreadMessageAttachmentVO();
                attachment_vo.gpt_file_id = attachment.file_id;

                const file_id

            }
            thread_message_vo.attachments = cloneDeep(thread_message.attachments);
        }

        thread_message_vo.content = thread_message.content;
        thread_message_vo.created_at = thread_message.created_at;
        thread_message_vo.updated_at = thread_message.updated_at;

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_message_vo);
    }

    private static async get_all_messages(gpt_thread_id: string): Promise<Message[]> {

        const res: Message[] = [];

        let messages_page: MessagesPage = await ModuleGPTServer.openai.beta.threads.messages.list(gpt_thread_id);

        if (!messages_page) {
            return res;
        }

        if (messages_page.data && messages_page.data.length) {
            res.concat(messages_page.data);
        }

        while (messages_page.hasNextPage()) {
            messages_page = await messages_page.getNextPage();
            res.concat(messages_page.data);
        }

        return res;
    }
}
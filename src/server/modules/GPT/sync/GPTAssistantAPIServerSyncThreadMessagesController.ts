import { cloneDeep } from 'lodash';
import { ImageFileContentBlock, ImageURLContentBlock, Message, MessageContentPartParam, MessageCreateParams, MessagesPage, TextContentBlockParam } from 'openai/resources/beta/threads/messages';
import { Thread } from 'openai/resources/beta/threads/threads';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import GPTAssistantAPIThreadMessageAttachmentVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageAttachmentVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncRunsController from './GPTAssistantAPIServerSyncRunsController';
import GPTAssistantAPIServerSyncThreadsController from './GPTAssistantAPIServerSyncThreadsController';

export default class GPTAssistantAPIServerSyncThreadMessagesController {

    /**
         * à utiliser pour la création ou la mise à jour vers OpenAI
         * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
         * @param vo le vo à pousser vers OpenAI
         * @returns OpenAI obj
         */
    public static async push_thread_message_to_openai(vo: GPTAssistantAPIThreadMessageVO): Promise<Message> {
        try {

            if (!vo) {
                throw new Error('No thread_message_vo provided');
            }

            /**
             * Si le rôle ne concerne pas OpenAI (system, function, tool), on ne fait rien
             */
            if ((vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_SYSTEM) || (vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_FUNCTION) || (vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TOOL)) {
                return null;
            }

            let gpt_obj: Message = (vo.gpt_thread_id && vo.gpt_id) ? await ModuleGPTServer.openai.beta.threads.messages.retrieve(vo.gpt_thread_id, vo.gpt_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing thread_msg to OpenAI : thread_msg is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            const attachments: MessageCreateParams.Attachment[] = GPTAssistantAPIServerSyncThreadMessagesController.attachments_to_openai_api(vo);
            const message_contents: MessageContentPartParam[] = await GPTAssistantAPIServerSyncThreadMessagesController.message_contents_to_openai_api(vo);

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_thread_message_to_openai: Creating thread message in OpenAI : ' + vo.id);
                }

                gpt_obj = await ModuleGPTServer.openai.beta.threads.messages.create(vo.gpt_thread_id, {
                    content: message_contents,
                    role: GPTAssistantAPIThreadMessageVO.TO_OPENAI_ROLE_MAP[vo.role] as "user" | "assistant",
                    attachments: attachments,
                    metadata: cloneDeep(vo.metadata),
                });

                if (!gpt_obj) {
                    throw new Error('Error while creating thread message in OpenAI');
                }
            } else {
                if (GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(vo, attachments, message_contents, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_thread_message_to_openai: Updating thread message in OpenAI : ' + vo.id);
                    }

                    // On doit mettre à jour
                    // Celà dit, comme on peut pas update grand chose, grosse proba que la diff si elle existait avant existe toujours après ...
                    gpt_obj = await ModuleGPTServer.openai.beta.threads.messages.update(gpt_obj.thread_id, gpt_obj.id, {
                        metadata: cloneDeep(vo.metadata),
                    });

                    if (!gpt_obj) {
                        throw new Error('Error while creating thread message in OpenAI');
                    }
                }
            }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(vo, attachments, message_contents, gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_thread_message_to_openai: Updating thread message in Osélia : ' + vo.id);
                }

                await GPTAssistantAPIServerSyncThreadMessagesController.assign_vo_from_gpt(vo, gpt_obj);
                vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);

                // On synchronise les messages du thread - en mode push
                const msg_vos = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                    .filter_by_id(vo.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                    .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().weight, false))
                    .exec_as_server()
                    .select_vos<GPTAssistantAPIThreadMessageVO>();
                for (const i in msg_vos) {
                    await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_to_openai(msg_vos[i]);
                }
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing thread message to OpenAI : ' + error);
            throw error;
        }
    }

    /**
     * On récupère tous les messages d'un thread de l'API GPT et on les intègre dans Osélia si on ne les a pas encore
     * Et on archive les messages qui n'existent plus dans GPT
     * @param thread_vo
     * @param thread_gpt
     */
    public static async sync_thread_messages(
        thread_vo: GPTAssistantAPIThreadVO,
        thread_gpt: Thread
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_thread_messages: Syncing thread messages for thread ' + thread_vo.id);
        }

        const thread_messages: Message[] = await GPTAssistantAPIServerSyncThreadMessagesController.get_all_messages(thread_gpt.id);
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

            await promise_pipeline.push(async () => {
                GPTAssistantAPIServerSyncThreadMessagesController.sync_thread_message(thread_vo, thread_message, thread_messages_vos_by_gpt_message_id);
            });
        }

        await promise_pipeline.end();
    }

    private static async sync_thread_message(
        thread_vo: GPTAssistantAPIThreadVO,
        thread_message: Message,
        thread_messages_vos_by_gpt_message_id: { [gpt_message_id: string]: GPTAssistantAPIThreadMessageVO },
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_thread_message: Syncing thread message ' + thread_message.id);
        }

        let thread_message_vo = thread_messages_vos_by_gpt_message_id[thread_message.id];
        let needs_update = false;

        if (!thread_message_vo) {
            // On le crée
            thread_message_vo = new GPTAssistantAPIThreadMessageVO();
            needs_update = true;
        }

        const attachments = GPTAssistantAPIServerSyncThreadMessagesController.attachments_to_openai_api(thread_message_vo);
        const contents = await GPTAssistantAPIServerSyncThreadMessagesController.message_contents_to_openai_api(thread_message_vo);
        needs_update = needs_update ||
            GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(
                thread_message_vo,
                attachments,
                contents,
                thread_message);

        if (!needs_update) {
            return;
        }

        await GPTAssistantAPIServerSyncThreadMessagesController.assign_vo_from_gpt(thread_message_vo, thread_message);
        thread_message_vo.archived = false;

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

    private static attachments_to_openai_api(vo: GPTAssistantAPIThreadMessageVO): MessageCreateParams.Attachment[] {
        const res: MessageCreateParams.Attachment[] = [];

        for (const i in vo.attachments) {
            const attachment_vo = vo.attachments[i];

            const tools = [];

            if (attachment_vo.add_to_tool_code_interpreter) {
                tools.push({
                    type: "code_interpreter"
                });
            }

            if (attachment_vo.add_to_tool_file_search) {
                tools.push({
                    type: "file_search"
                });
            }

            res.push({
                file_id: attachment_vo.gpt_file_id,
                tools: tools
            });
        }

        return res;
    }

    private static attachments_from_openai_api(gpt_attachments: MessageCreateParams.Attachment[]): GPTAssistantAPIThreadMessageAttachmentVO[] {
        const res: GPTAssistantAPIThreadMessageAttachmentVO[] = [];

        for (const i in gpt_attachments) {
            const gpt_attachment_vo = gpt_attachments[i];

            const attachment_vo = new GPTAssistantAPIThreadMessageAttachmentVO();
            attachment_vo.gpt_file_id = gpt_attachment_vo.file_id;

            for (const j in gpt_attachment_vo.tools) {
                const tool = gpt_attachment_vo.tools[j];

                switch (tool.type) {
                    case "code_interpreter":
                        attachment_vo.add_to_tool_code_interpreter = true;
                        break;
                    case "file_search":
                        attachment_vo.add_to_tool_file_search = true;
                        break;
                }
            }

            res.push(attachment_vo);
        }

        return res;
    }

    private static async message_contents_to_openai_api(vo: GPTAssistantAPIThreadMessageVO): Promise<MessageContentPartParam[]> {
        const res: MessageContentPartParam[] = [];

        if (!vo) {
            return res;
        }

        const contents = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
            .filter_by_id(vo.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .set_sort(new SortByVO(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().weight, true))
            .exec_as_server()
            .select_vos<GPTAssistantAPIThreadMessageContentVO>();

        for (const i in contents) {
            const content = contents[i];

            switch (content.type) {
                case GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT:
                    res.push({
                        type: GPTAssistantAPIThreadMessageContentVO.TO_OPENAI_TYPE_MAP[content.type],
                        text: content.content_type_text.value,
                    } as TextContentBlockParam);
                    break;
                case GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE_URL:
                    res.push({
                        type: GPTAssistantAPIThreadMessageContentVO.TO_OPENAI_TYPE_MAP[content.type],
                        image_url: {
                            url: content.content_type_image_url.url,
                            detail: content.content_type_image_url.detail,
                        }
                    } as ImageURLContentBlock);
                    break;
                case GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE:
                    res.push({
                        type: GPTAssistantAPIThreadMessageContentVO.TO_OPENAI_TYPE_MAP[content.type],
                        image_file: {
                            file_id: content.content_type_image_file.gpt_file_id,
                            detail: content.content_type_image_file.detail,
                        }
                    } as ImageFileContentBlock);
                    break;

                case GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL:
                case GPTAssistantAPIThreadMessageContentVO.TYPE_EMAIL:
                    // Ne concernent pas OpenAI.
                    break;

                default:
                    throw new Error('Unknown content type');
            }
        }

        return res;
    }

    private static thread_message_has_diff(
        vo: GPTAssistantAPIThreadMessageVO,
        attachments: MessageCreateParams.Attachment[],
        message_contents: MessageContentPartParam[],
        gpt_obj: Message
    ): boolean {

        if ((!vo) && (!gpt_obj)) {
            return false;
        }

        if ((!vo) || (!gpt_obj)) {
            return true;
        }

        return (vo.gpt_assistant_id != gpt_obj.assistant_id) ||
            (JSON.stringify(message_contents) != JSON.stringify(gpt_obj.content)) ||
            (JSON.stringify(attachments) != JSON.stringify(gpt_obj.attachments)) ||
            (vo.completed_at != gpt_obj.completed_at) ||
            (vo.created_at != gpt_obj.created_at) ||
            (vo.gpt_id != gpt_obj.id) ||
            (vo.gpt_run_id != gpt_obj.run_id) ||
            (vo.gpt_thread_id != gpt_obj.thread_id) ||
            (vo.incomplete_at != gpt_obj.incomplete_at) ||
            (JSON.stringify(vo.incomplete_details) != JSON.stringify(gpt_obj.incomplete_details)) ||
            (JSON.stringify(vo.metadata) != JSON.stringify(gpt_obj.metadata)) ||
            (vo.role != GPTAssistantAPIThreadMessageVO.FROM_OPENAI_ROLE_MAP[gpt_obj.role]) ||
            (vo.status != GPTAssistantAPIThreadMessageVO.FROM_OPENAI_STATUS_MAP[gpt_obj.status]);
    }

    private static async assign_vo_from_gpt(vo: GPTAssistantAPIThreadMessageVO, gpt_obj: Message) {
        if (gpt_obj.assistant_id) {
            const assistant = await GPTAssistantAPIServerSyncAssistantsController.get_assistant_or_sync(gpt_obj.assistant_id);

            if (!assistant) {
                throw new Error('Error while pushing thread message to OpenAI : assistant not found : ' + gpt_obj.assistant_id);
            }

            vo.gpt_assistant_id = gpt_obj.assistant_id;
            vo.assistant_id = assistant.id;
        } else {
            vo.gpt_assistant_id = null;
            vo.assistant_id = null;
        }

        if (gpt_obj.run_id) {
            const run = await GPTAssistantAPIServerSyncRunsController.get_run_or_sync(gpt_obj.thread_id, gpt_obj.run_id);

            if (!run) {
                throw new Error('Error while pushing thread message to OpenAI : run not found : ' + gpt_obj.run_id);
            }

            vo.gpt_run_id = gpt_obj.run_id;
            vo.run_id = run.id;
        } else {
            vo.gpt_run_id = null;
            vo.run_id = null;
        }

        if (gpt_obj.thread_id) {
            const thread = await GPTAssistantAPIServerSyncThreadsController.get_thread_or_sync(gpt_obj.thread_id);

            if (!thread) {
                throw new Error('Error while pushing thread message to OpenAI : thread not found : ' + gpt_obj.thread_id);
            }

            vo.gpt_thread_id = gpt_obj.thread_id;
            vo.thread_id = thread.id;
        } else {
            vo.gpt_thread_id = null;
            vo.thread_id = null;
        }

        vo.created_at = gpt_obj.created_at;
        vo.metadata = cloneDeep(gpt_obj.metadata);
        vo.attachments = GPTAssistantAPIServerSyncThreadMessagesController.attachments_from_openai_api(gpt_obj.attachments);
        vo.completed_at = gpt_obj.completed_at;
        vo.incomplete_at = gpt_obj.incomplete_at;
        vo.incomplete_details = cloneDeep(gpt_obj.incomplete_details);
        vo.gpt_id = gpt_obj.id;
        vo.role = GPTAssistantAPIThreadMessageVO.FROM_OPENAI_ROLE_MAP[gpt_obj.role];
        vo.status = GPTAssistantAPIThreadMessageVO.FROM_OPENAI_STATUS_MAP[gpt_obj.status];
    }
}
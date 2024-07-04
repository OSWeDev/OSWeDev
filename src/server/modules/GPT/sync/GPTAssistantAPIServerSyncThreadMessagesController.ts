import { cloneDeep } from 'lodash';
import { Annotation, FileCitationAnnotation, FilePathAnnotation, ImageFileContentBlock, ImageURLContentBlock, Message, MessageContent, MessageContentPartParam, MessageCreateParams, MessagesPage, TextContentBlock, TextContentBlockParam } from 'openai/resources/beta/threads/messages';
import { Thread } from 'openai/resources/beta/threads/threads';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import GPTAssistantAPIFileVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIThreadMessageAttachmentVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageAttachmentVO';
import GPTAssistantAPIThreadMessageContentFileCitationVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentFileCitationVO';
import GPTAssistantAPIThreadMessageContentFilePathVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentFilePathVO';
import GPTAssistantAPIThreadMessageContentImageFileVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentImageFileVO';
import GPTAssistantAPIThreadMessageContentImageURLVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentImageURLVO';
import GPTAssistantAPIThreadMessageContentTextVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentTextVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import GPTAssistantAPIServerController from '../GPTAssistantAPIServerController';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from './GPTAssistantAPIServerSyncAssistantsController';
import GPTAssistantAPIServerSyncController from './GPTAssistantAPIServerSyncController';
import GPTAssistantAPIServerSyncFilesController from './GPTAssistantAPIServerSyncFilesController';
import GPTAssistantAPIServerSyncRunsController from './GPTAssistantAPIServerSyncRunsController';
import GPTAssistantAPIServerSyncThreadsController from './GPTAssistantAPIServerSyncThreadsController';

export default class GPTAssistantAPIServerSyncThreadMessagesController {

    public static syncing_semaphores_promises: { [gpt_thread_id: string]: Promise<void> } = {};

    public static already_syncing_thread_message: { [id: number]: boolean } = {};

    /**
     * GPTAssistantAPIThreadMessageContentVO
     * On est en post, car on pousse l'assistant qui ensuite fait des requetes pour charger les fonctions depuis la bdd
     */
    public static async post_update_trigger_handler_for_ThreadMessageContentVO(params: DAOUpdateVOHolder<GPTAssistantAPIThreadMessageContentVO>, exec_as_server?: boolean) {
        await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_id(params.post_update_vo.thread_message_id);
    }
    public static async post_create_trigger_handler_for_ThreadMessageContentVO(vo: GPTAssistantAPIThreadMessageContentVO, exec_as_server?: boolean) {
        await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_id(vo.thread_message_id);
    }
    public static async post_delete_trigger_handler_for_ThreadMessageContentVO(vo: GPTAssistantAPIThreadMessageContentVO, exec_as_server?: boolean) {
        await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_id(vo.thread_message_id);
    }

    /**
     * GPTAssistantAPIThreadMessageVO
     *  On refuse la suppression. On doit archiver.
     */
    public static async pre_update_trigger_handler_for_ThreadMessageVO(params: DAOUpdateVOHolder<GPTAssistantAPIThreadMessageVO>, exec_as_server?: boolean): Promise<boolean> {
        try {
            await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_to_openai(params.post_update_vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing thread message to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_create_trigger_handler_for_ThreadMessageVO(vo: GPTAssistantAPIThreadMessageVO, exec_as_server?: boolean): Promise<boolean> {

        if (vo.gpt_id) {
            // Si on a l'id GPT, c'est que la création vient de OpenAI, pas l'inverse. Donc on ne fait rien de plus
            return true;
        }

        try {
            await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_to_openai(vo);
        } catch (error) {
            ConsoleHandler.error('Error while pushing thread message to OpenAI : ' + error);
            return false;
        }
        return true;
    }
    public static async pre_delete_trigger_handler_for_ThreadMessageVO(vo: GPTAssistantAPIThreadMessageVO, exec_as_server?: boolean): Promise<boolean> {
        return false;
    }

    public static async push_thread_message_id(thread_message_id: number) {
        const thread_message = thread_message_id ? await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID).filter_by_id(thread_message_id).exec_as_server().select_vo<GPTAssistantAPIThreadMessageVO>() : null;

        if (!thread_message) {
            throw new Error('thread_message not found by id : ' + thread_message_id);
        }

        await GPTAssistantAPIServerSyncThreadMessagesController.push_thread_message_to_openai(thread_message, false);
    }

    /**
         * à utiliser pour la création ou la mise à jour vers OpenAI
         * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
         * @param vo le vo à pousser vers OpenAI
         * @returns OpenAI obj
         */
    public static async push_thread_message_to_openai(vo: GPTAssistantAPIThreadMessageVO, is_trigger_pre_x: boolean = true): Promise<Message> {
        try {

            if (!vo) {
                throw new Error('No thread_message_vo provided');
            }

            if (vo.id && GPTAssistantAPIServerSyncThreadMessagesController.already_syncing_thread_message[vo.id]) {
                ConsoleHandler.log('push_thread_message_to_openai: Already syncing thread message for thread ' + vo.id);
                return null;
            }

            /**
             * Si le rôle ne concerne pas OpenAI (system, function, tool), on ne fait rien
             * Et si le rôle est assistant, on ne peut pas push correctement, car on ne peut pas mettre à jour les messages assistants dans OpenAI
             */
            if ((vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_SYSTEM) || (vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_FUNCTION) || (vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TOOL) || (vo.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT)) {
                return null;
            }

            let gpt_obj: Message = (vo.gpt_thread_id && vo.gpt_id) ? await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.beta.threads.messages.retrieve, ModuleGPTServer.openai.beta.threads.messages, vo.gpt_thread_id, vo.gpt_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing thread_msg to OpenAI : thread_msg is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            const attachments: MessageCreateParams.Attachment[] = GPTAssistantAPIServerSyncThreadMessagesController.attachments_to_openai_api(vo);
            const message_contents_full: MessageContent[] = await GPTAssistantAPIServerSyncThreadMessagesController.message_contents_to_openai_api(vo);
            const message_contents_create: MessageContentPartParam[] = await GPTAssistantAPIServerSyncThreadMessagesController.message_contents_to_openai_create_api(vo);

            if (!gpt_obj) {

                // Si on a aucun contenu à envoyer à OpenAI, on a pas de message non plus et c'est normal
                if ((!message_contents_create) || (!message_contents_create.length)) {
                    return null;
                }

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_thread_message_to_openai: Creating thread message in OpenAI : ' + vo.id);
                }

                if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai && !ConfigurationService.node_configuration.unblock_openai_push_to_openai_gpt_assistant_thread_msg) {
                    throw new Error('Error while pushing obj to OpenAI : blocked :api_type_id:' + vo._type + ':vo_id:' + vo.id);
                }

                gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                    ModuleGPTServer.openai.beta.threads.messages.create,
                    ModuleGPTServer.openai.beta.threads.messages,
                    vo.gpt_thread_id,
                    {
                        content: message_contents_create,
                        role: GPTAssistantAPIThreadMessageVO.TO_OPENAI_ROLE_MAP[vo.role] as "user" | "assistant",
                        attachments: attachments,
                        metadata: cloneDeep(vo.metadata),
                    });

                if (!gpt_obj) {
                    throw new Error('Error while creating thread message in OpenAI');
                }
            } else {
                // if (GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(vo, attachments, message_contents_full, gpt_obj)) {
                // On ne peut modifier que la metadata, donc on ne peut pas avoir de diff sur le contenu. Si modif de contenu alors c'est un nouveau message
                if (!GPTAssistantAPIServerSyncController.compare_values(vo.metadata, gpt_obj.metadata)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_thread_message_to_openai: Updating thread message in OpenAI : ' + vo.id);
                    }

                    if (ConfigurationService.node_configuration.block_openai_sync_push_to_openai) {
                        throw new Error('Error while pushing obj to OpenAI : blocked :api_type_id:' + vo._type + ':vo_id:' + vo.id);
                    }

                    // On doit mettre à jour
                    // Celà dit, comme on peut pas update grand chose, grosse proba que la diff si elle existait avant existe toujours après ...
                    gpt_obj = await GPTAssistantAPIServerController.wrap_api_call(
                        ModuleGPTServer.openai.beta.threads.messages.update,
                        ModuleGPTServer.openai.beta.threads.messages,
                        gpt_obj.thread_id,
                        gpt_obj.id,
                        {
                            metadata: cloneDeep(vo.metadata),
                        });

                    if (!gpt_obj) {
                        throw new Error('Error while creating thread message in OpenAI');
                    }
                }
            }

            // // Si on repère une diff de données, alors qu'on est en push, c'est un pb de synchro à remonter
            // if (GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(vo, attachments, message_contents, gpt_obj) || vo.archived) {
            //     throw new Error('Error while pushing obj to OpenAI : has diff :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
            // }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            // On récupère le poids, en listant les messages du thread dans OpenAI
            let weight: number = null;
            const thread_messages: Message[] = await GPTAssistantAPIServerSyncThreadMessagesController.get_all_messages(vo.gpt_thread_id);
            for (const i in thread_messages) {
                const thread_message = thread_messages[i];

                if (thread_message.id == gpt_obj.id) {
                    weight = parseInt(i);
                    break;
                }
            }

            // Si on a une diff sur les contenus, et qu'on est en pleine synchro, on peut pas pousser une nouvelle modif du VO
            // TODO FIXME : Par contre est-ce qu'il faudrait pas relancer une synchro sur ce threadmessage à la limite à la fin de la synchro ? pour s'assurer que tout est ok ? et sinon peter une erreur ?
            if (!GPTAssistantAPIServerSyncController.compare_values(message_contents_full, gpt_obj.content)) {
                if (GPTAssistantAPIServerSyncThreadMessagesController.syncing_semaphores_promises[gpt_obj.id]) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_thread_message_to_openai: message_contents_full != gpt_obj.content mais GPTAssistantAPIServerSyncThreadMessagesController.is_syncing : ' + vo.id);
                    }

                    return gpt_obj;
                } else {
                    throw new Error('Error while pushing thread message to OpenAI : has diff on contents :api_type_id:' + vo._type + ':vo_id:' + vo.id + ':gpt_id:' + gpt_obj.id);
                }
            }

            if (GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(vo, attachments, /*message_contents_full,*/ gpt_obj) || vo.archived) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_thread_message_to_openai: Updating thread message in Osélia : ' + vo.id);
                }

                await GPTAssistantAPIServerSyncThreadMessagesController.assign_vo_from_gpt(vo, gpt_obj, weight);

                if (!is_trigger_pre_x) {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
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

        if (GPTAssistantAPIServerSyncThreadMessagesController.syncing_semaphores_promises[thread_gpt.id]) {
            ConsoleHandler.log('sync_thread_messages: Already syncing thread messages for thread ' + thread_vo.id + ' - ' + thread_gpt.id + ' - loop ?');
            return GPTAssistantAPIServerSyncThreadMessagesController.syncing_semaphores_promises[thread_gpt.id];
        }
        GPTAssistantAPIServerSyncThreadMessagesController.syncing_semaphores_promises[thread_gpt.id] = (async () => {

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_thread_messages: Syncing thread messages for thread ' + thread_vo.id + ' - ' + thread_gpt.id);
            }

            const thread_messages: Message[] = await GPTAssistantAPIServerSyncThreadMessagesController.get_all_messages(thread_gpt.id);
            const thread_messages_vos: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_id(thread_vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageVO>();
            const thread_messages_vos_by_gpt_message_id: { [gpt_message_id: string]: GPTAssistantAPIThreadMessageVO } = {};

            for (const i in thread_messages_vos) {
                const thread_message_vo = thread_messages_vos[i];

                if (thread_message_vo.gpt_id) {
                    thread_messages_vos_by_gpt_message_id[thread_message_vo.gpt_id] = thread_message_vo;
                }
            }

            const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
            for (const i in thread_messages) {
                const thread_message = thread_messages[i];

                await promise_pipeline.push(async () => {
                    await GPTAssistantAPIServerSyncThreadMessagesController.sync_thread_message(
                        thread_vo,
                        thread_message,
                        thread_messages_vos_by_gpt_message_id,
                        parseInt(i),
                    );
                });
            }

            await promise_pipeline.end();

            GPTAssistantAPIServerSyncThreadMessagesController.syncing_semaphores_promises[thread_gpt.id] = null;
        })();

        return GPTAssistantAPIServerSyncThreadMessagesController.syncing_semaphores_promises[thread_gpt.id];
    }

    private static async sync_thread_message(
        thread_vo: GPTAssistantAPIThreadVO,
        thread_message: Message,
        thread_messages_vos_by_gpt_message_id: { [gpt_message_id: string]: GPTAssistantAPIThreadMessageVO },
        weight: number
    ) {

        if (GPTAssistantAPIServerSyncThreadMessagesController.already_syncing_thread_message[thread_vo.id]) {
            ConsoleHandler.warn('sync_thread_message: Already syncing thread message for thread ' + thread_vo.id);
            return;
        }

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_thread_message: Syncing thread message ' + thread_message.id);
        }

        let thread_message_vo = thread_messages_vos_by_gpt_message_id[thread_message.id];
        let needs_update = false;

        if (!thread_message_vo) {
            // On le crée
            thread_message_vo = new GPTAssistantAPIThreadMessageVO();
            needs_update = true;

            // Si on a pas de user à associé, on prend celui du thread
            thread_message_vo.user_id = thread_vo.user_id;

            await GPTAssistantAPIServerSyncThreadMessagesController.assign_vo_from_gpt(thread_message_vo, thread_message, weight);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_message_vo);
        }

        const attachments = GPTAssistantAPIServerSyncThreadMessagesController.attachments_to_openai_api(thread_message_vo);

        GPTAssistantAPIServerSyncThreadMessagesController.already_syncing_thread_message[thread_message_vo.id] = true;
        await this.sync_thread_message_contents(thread_message_vo, thread_message);
        const contents = await GPTAssistantAPIServerSyncThreadMessagesController.message_contents_to_openai_api(thread_message_vo);

        if (!GPTAssistantAPIServerSyncController.compare_values(contents, thread_message.content)) {
            GPTAssistantAPIServerSyncThreadMessagesController.already_syncing_thread_message[thread_message_vo.id] = false;
            throw new Error('Error while syncing thread message : has diff on contents :api_type_id:' + thread_message_vo._type + ':vo_id:' + thread_message_vo.id + ':gpt_id:' + thread_message.id);
        }

        needs_update = needs_update ||
            GPTAssistantAPIServerSyncThreadMessagesController.thread_message_has_diff(
                thread_message_vo,
                attachments,
                // contents,
                thread_message);

        if (!needs_update) {
            GPTAssistantAPIServerSyncThreadMessagesController.already_syncing_thread_message[thread_message_vo.id] = false;
            return;
        }

        await GPTAssistantAPIServerSyncThreadMessagesController.assign_vo_from_gpt(thread_message_vo, thread_message, weight);

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_thread_message: Updating thread message in Osélia : ' + thread_message_vo.id);
        }

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_message_vo);
        GPTAssistantAPIServerSyncThreadMessagesController.already_syncing_thread_message[thread_message_vo.id] = false;
    }

    private static async sync_thread_message_contents(
        thread_message_vo: GPTAssistantAPIThreadMessageVO,
        thread_message: Message,
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_thread_message_contents: Syncing thread message contents : ' + thread_message_vo.id + ' : ' + thread_message_vo.gpt_id);
        }

        const thread_message_content_vos: GPTAssistantAPIThreadMessageContentVO[] = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
            .filter_by_id(thread_message_vo.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIThreadMessageContentVO>();
        // const thread_message_content_vos_to_handle_: { [gpt_id: string]: GPTAssistantAPIThreadMessageContentVO } = {};

        // Si il nous manque des contenus, on les crées, mais on peut pas mettre à jour en fait openai, donc on crée chez nous pour pas perdre de datas,
        // et on supprime rien automatiquement pour le moment sauf demande explicite de suppression

        // On commence par partir des contenus de GPT pour les récupérer.
        // Puis on insère les contenus qui n'existent pas encore dans GPT (si on peut). => beaucoup trop complexe on peut pas créer n'importe quoi chez eux (type annotations, ...)

        let weight = 0;
        for (const i in thread_message.content) {
            const msg_content: MessageContent = thread_message.content[i];

            switch (msg_content.type) {
                case 'text':
                    await GPTAssistantAPIServerSyncThreadMessagesController.sync_msg_content_text(
                        thread_message_vo,
                        thread_message,
                        msg_content,
                        thread_message_content_vos,
                        weight++,
                    );
                    break;
                case 'image_file':
                    await GPTAssistantAPIServerSyncThreadMessagesController.sync_msg_content_image_file(
                        thread_message_vo,
                        thread_message,
                        msg_content,
                        thread_message_content_vos,
                        weight++,
                    );
                    break;
                case 'image_url':
                    await GPTAssistantAPIServerSyncThreadMessagesController.sync_msg_content_image_url(
                        thread_message_vo,
                        thread_message,
                        msg_content,
                        thread_message_content_vos,
                        weight++,
                    );
                    break;

                default:
                    throw new Error('Unknown content type');
            }
        }

        // Les contenus qu'on trouve dans Osélia mais pas dans OpenAI, on fait rien pour le moment
    }

    private static async sync_msg_content_text(
        thread_message_vo: GPTAssistantAPIThreadMessageVO,
        thread_message: Message,
        msg_content: TextContentBlock,
        thread_message_content_vos: GPTAssistantAPIThreadMessageContentVO[],
        weight: number,
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_msg_content_text: Syncing message content text : ' + thread_message.id + ' : ' + msg_content.text.value);
        }

        let found_vo: GPTAssistantAPIThreadMessageContentVO = null;
        for (const i in thread_message_content_vos) {
            const thread_message_content_vo = thread_message_content_vos[i];

            if (thread_message_content_vo.type !== GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT) {
                continue;
            }

            if (thread_message_content_vo.content_type_text && (thread_message_content_vo.content_type_text.value == msg_content.text.value)) {
                found_vo = thread_message_content_vo;
                break;
            }
        }

        let needs_update = false;

        if (!found_vo) {

            found_vo = new GPTAssistantAPIThreadMessageContentVO();
            needs_update = true;
        }

        needs_update = needs_update || !(
            (found_vo.content_type_text && (found_vo.content_type_text.value == msg_content.text.value)) &&
            (found_vo.gpt_thread_message_id == thread_message_vo.gpt_id) &&
            (found_vo.thread_message_id == thread_message_vo.id)
        );

        if (needs_update) {

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_msg_content_text: Updating message content text in Osélia : ' + thread_message.id);
            }

            found_vo.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
            found_vo.content_type_text.value = msg_content.text.value;
            found_vo.gpt_thread_message_id = thread_message_vo.gpt_id;
            found_vo.thread_message_id = thread_message_vo.id;
            found_vo.weight = (found_vo.weight != null) ? found_vo.weight : weight;
            found_vo.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async sync_msg_content_image_file(
        thread_message_vo: GPTAssistantAPIThreadMessageVO,
        thread_message: Message,
        msg_content: ImageFileContentBlock,
        thread_message_content_vos: GPTAssistantAPIThreadMessageContentVO[],
        weight: number,
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_msg_content_image_file: Syncing message content image file : ' + thread_message.id + ' : ' + msg_content.image_file.file_id);
        }

        let found_vo: GPTAssistantAPIThreadMessageContentVO = null;
        for (const i in thread_message_content_vos) {
            const thread_message_content_vo = thread_message_content_vos[i];

            if (thread_message_content_vo.type !== GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE) {
                continue;
            }

            if (thread_message_content_vo.content_type_image_file && (thread_message_content_vo.content_type_image_file.gpt_file_id == msg_content.image_file.file_id)) {
                found_vo = thread_message_content_vo;
                break;
            }
        }

        let needs_update = false;

        if (!found_vo) {

            found_vo = new GPTAssistantAPIThreadMessageContentVO();
            needs_update = true;
        }

        needs_update = needs_update || !(
            (found_vo.content_type_image_file && (found_vo.content_type_image_file.gpt_file_id == msg_content.image_file.file_id)) &&
            (found_vo.gpt_thread_message_id == thread_message_vo.gpt_id) &&
            (found_vo.thread_message_id == thread_message_vo.id)
        );

        if (needs_update) {

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_msg_content_image_file: Updating message content image file in Osélia : ' + thread_message.id);
            }

            found_vo.content_type_image_file = new GPTAssistantAPIThreadMessageContentImageFileVO();
            found_vo.content_type_image_file.gpt_file_id = msg_content.image_file.file_id;

            const file: GPTAssistantAPIFileVO = await GPTAssistantAPIServerSyncFilesController.get_file_or_sync(msg_content.image_file.file_id, true);
            if (!file) {
                throw new Error('Error while syncing image file');
            }

            found_vo.content_type_image_file.file_id = file.id;
            found_vo.content_type_image_file.detail = msg_content.image_file.detail;
            found_vo.gpt_thread_message_id = thread_message_vo.gpt_id;
            found_vo.thread_message_id = thread_message_vo.id;
            found_vo.weight = (found_vo.weight != null) ? found_vo.weight : weight;
            found_vo.type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async sync_msg_content_image_url(
        thread_message_vo: GPTAssistantAPIThreadMessageVO,
        thread_message: Message,
        msg_content: ImageURLContentBlock,
        thread_message_content_vos: GPTAssistantAPIThreadMessageContentVO[],
        weight: number,
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_msg_content_image_url: Syncing message content image url : ' + thread_message.id + ' : ' + msg_content.image_url.url);
        }

        let found_vo: GPTAssistantAPIThreadMessageContentVO = null;
        for (const i in thread_message_content_vos) {
            const thread_message_content_vo = thread_message_content_vos[i];

            if (thread_message_content_vo.type !== GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE_URL) {
                continue;
            }

            if (thread_message_content_vo.content_type_image_url && (thread_message_content_vo.content_type_image_url.url == msg_content.image_url.url)) {
                found_vo = thread_message_content_vo;
                break;
            }
        }

        let needs_update = false;

        if (!found_vo) {

            found_vo = new GPTAssistantAPIThreadMessageContentVO();
            needs_update = true;
        }

        needs_update = needs_update || !(
            (found_vo.content_type_image_url && (found_vo.content_type_image_url.url == msg_content.image_url.url)) &&
            (found_vo.gpt_thread_message_id == thread_message_vo.gpt_id) &&
            (found_vo.thread_message_id == thread_message_vo.id)
        );

        if (needs_update) {

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_msg_content_image_url: Updating message content image url in Osélia : ' + thread_message.id);
            }

            found_vo.content_type_image_url = new GPTAssistantAPIThreadMessageContentImageURLVO();
            found_vo.content_type_image_url.url = msg_content.image_url.url;
            found_vo.gpt_thread_message_id = thread_message_vo.gpt_id;
            found_vo.thread_message_id = thread_message_vo.id;
            found_vo.weight = (found_vo.weight != null) ? found_vo.weight : weight;
            found_vo.type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE_URL;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async get_all_messages(gpt_thread_id: string): Promise<Message[]> {

        let res: Message[] = [];

        let messages_page: MessagesPage = await GPTAssistantAPIServerController.wrap_api_call(
            ModuleGPTServer.openai.beta.threads.messages.list, ModuleGPTServer.openai.beta.threads.messages, gpt_thread_id);

        if (!messages_page) {
            return res;
        }

        if (messages_page.data && messages_page.data.length) {
            res = res.concat(messages_page.data);
        }

        while (messages_page.hasNextPage()) {
            messages_page = await messages_page.getNextPage();
            res = res.concat(messages_page.data);
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

    private static async message_contents_to_openai_api(vo: GPTAssistantAPIThreadMessageVO): Promise<MessageContent[]> {
        const res: MessageContent[] = [];

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

                    const annotations: Annotation[] = [];

                    for (const j in content.content_type_text.annotations) {
                        const annotation = content.content_type_text.annotations[j];

                        switch (annotation._type) {
                            case GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID:
                                annotations.push({
                                    start_index: annotation.start_index,
                                    end_index: annotation.end_index,
                                    text: annotation.text,
                                    file_citation: {
                                        file_id: (annotation as GPTAssistantAPIThreadMessageContentFileCitationVO).gpt_file_id,
                                        quote: (annotation as GPTAssistantAPIThreadMessageContentFileCitationVO).quote,
                                    } as FileCitationAnnotation.FileCitation,
                                    type: 'file_citation',
                                    // (annotation as GPTAssistantAPIThreadMessageContentFileCitationVO).quote
                                } as FileCitationAnnotation);
                                break;
                            case GPTAssistantAPIThreadMessageContentFilePathVO.API_TYPE_ID:
                                annotations.push({
                                    start_index: annotation.start_index,
                                    end_index: annotation.end_index,
                                    file_path: {
                                        file_id: (annotation as GPTAssistantAPIThreadMessageContentFilePathVO).gpt_file_id,
                                    } as FilePathAnnotation.FilePath,
                                    text: annotation.text,
                                    type: 'file_path'
                                } as FilePathAnnotation);
                                break;
                        }
                    }

                    res.push({
                        type: GPTAssistantAPIThreadMessageContentVO.TO_OPENAI_TYPE_MAP[content.type],
                        text: {
                            value: content.content_type_text.value,
                            annotations: annotations,
                        }
                    } as TextContentBlock);
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

    private static async message_contents_to_openai_create_api(vo: GPTAssistantAPIThreadMessageVO): Promise<MessageContentPartParam[]> {
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

    /**
     * Les diffs de contenus sont gérées par ailleurs
     * @param vo
     * @param attachments
     * @param gpt_obj
     * @param weight
     * @returns
     */
    private static thread_message_has_diff(
        vo: GPTAssistantAPIThreadMessageVO,
        attachments: MessageCreateParams.Attachment[],
        // message_contents: MessageContent[],
        gpt_obj: Message,
    ): boolean {

        if ((!vo) && (!gpt_obj)) {
            return false;
        }

        if ((!vo) || (!gpt_obj)) {
            return true;
        }

        return !(
            GPTAssistantAPIServerSyncController.compare_values(vo.gpt_assistant_id, gpt_obj.assistant_id) &&
            // GPTAssistantAPIServerSyncController.compare_values(message_contents, gpt_obj.content) &&
            GPTAssistantAPIServerSyncController.compare_values(attachments, gpt_obj.attachments) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.completed_at, gpt_obj.completed_at) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.created_at, gpt_obj.created_at) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.gpt_id, gpt_obj.id) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.gpt_run_id, gpt_obj.run_id) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.gpt_thread_id, gpt_obj.thread_id) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.incomplete_at, gpt_obj.incomplete_at) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.incomplete_details, gpt_obj.incomplete_details) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.metadata, gpt_obj.metadata) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.role, GPTAssistantAPIThreadMessageVO.FROM_OPENAI_ROLE_MAP[gpt_obj.role]) &&
            GPTAssistantAPIServerSyncController.compare_values(vo.status, GPTAssistantAPIThreadMessageVO.FROM_OPENAI_STATUS_MAP[gpt_obj.status]));
    }

    private static async assign_vo_from_gpt(vo: GPTAssistantAPIThreadMessageVO, gpt_obj: Message, weight: number) {
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
        vo.weight = (vo.weight !== null) ? vo.weight : weight;
        vo.archived = false;
    }
}
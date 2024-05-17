import { Message, MessagesPage } from 'openai/resources/beta/threads/messages';
import { Thread } from 'openai/resources/beta/threads/threads';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleGPTServer from './ModuleGPTServer';

/**
 * Pour la synchronisation - on n'est pas sur une demande de création de thread par exemple, mais bien une resynchro, donc si on a pas créé un thread dans openai, on considère qu'il n'a rien à faire dans Osélia (mais comme souvent on essaie de ne rien supprimer, dans le doute) :
 *  - pour les assistants :
 *     - on récupère le contenu de openai et on le met dans oselia. Si des contenus existent dans Osélia mais pas dans OpenAI, on les archive
 *     - il faut par ailleurs des triggers on_create_assistant, on_update_assistant et on_delete_assistant pour mettre à jour les assistants dans OpenAI depuis Osélia
 *  - pour les threads :
 *     - on récupère le contenu de openai et on le met dans oselia. Si des contenus existent dans Osélia mais pas dans OpenAI, on les archive
 *     - il faut par ailleurs des triggers on_create_thread, on_update_thread et on_delete_thread pour mettre à jour les threads dans OpenAI depuis Osélia
 *  - pour les messages (et donc les messages contents de tout type) :
 *     - on récupère le contenu de openai et on le met dans oselia. Si des contenus existent dans Osélia mais pas dans OpenAI - et de type OpenAI (donc on ne synchro pas les mails, pas les action_urls, ...), on les archive
 *     - il faut par ailleurs des triggers on_create_message, on_update_message et on_delete_message pour mettre à jour les messages dans OpenAI depuis Osélia => typiquement supprimer de OpenAI les messages archivés dans Osélia
 *  - pour les run/steps :
 *     - on récupère le contenu de openai et on le met dans oselia. Si des contenus existent dans Osélia mais pas dans OpenAI, on les archive
 *     - il faut par ailleurs des triggers on_create_run, on_update_run et on_delete_run pour mettre à jour les runs dans OpenAI depuis Osélia => typiquement supprimer de OpenAI les runs archivés dans Osélia
 */
export default class GPTAssistantAPIServerSyncController {

    /**
     * On synchronise le run entre Osélia et OpenAI
     * D'abord on récupère les messages/fichiers/runs/steps/usages/assistants/... tout ce qui est lié au thread qui existent dans OpenAI et pas dans Osélia => on les crée dans Osélia
     * Ensuite on s'assure que la version dans OpenAI correspond exactement, ordre inclus, aux messages/contenus dans Osélia
     * Le plan, c'est qu'on doit pouvoir modifier n'importe quel message dans Osélia, et que ça se répercute dans OpenAI lors du prochain run
     *  ça ouvre la porte à faire appel à différents models, et fournir la réponse du model à Openai (dans ce cas, mais à n'importe quel autre modèle)
     *  par la suite comme si c'était lui qui avait répondu.
     * @param thread_vo
     * @param thread_gpt
     */
    private static async sync_thread(thread_vo: GPTAssistantAPIThreadVO, thread_gpt: Thread) {

        // On commence par charger les messages qui existent dans OpenAI et dans Osélia pour les comparer
        const thread_messages: Message[] = await this.get_all_messages(thread_gpt);
        const thread_messages_vos: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_id(thread_vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIThreadMessageVO>();

        await this.sync_thread_messages(thread_messages_vos, thread_messages, thread_vo, thread_gpt);
    }

    private static async sync_thread_messages(
        thread_messages_vos: GPTAssistantAPIThreadMessageVO[],
        thread_messages: Message[],
        thread_vo: GPTAssistantAPIThreadVO,
        thread_gpt: Thread) {

        // On commence par créer les messages qui existent dans OpenAI et pas dans Osélia
        for (const i in thread_messages) {
            const thread_message = thread_messages[i];
            let found_vo: GPTAssistantAPIThreadMessageVO = null;

            let found = false;
            for (const j in thread_messages_vos) {
                const thread_message_vo = thread_messages_vos[j];

                if (thread_message_vo.gpt_id == thread_message.id) {
                    found = true;
                    found_vo = thread_message_vo;
                    break;
                }
            }

            if (!found) {
                found_vo = new GPTAssistantAPIThreadMessageVO();
                found_vo.archived = false;

                if (thread_message.assistant_id) {

                }
            }
        }
    }

    private static async get_all_messages(thread_gpt: Thread): Promise<Message[]> {

        const res: Message[] = [];

        let messages_page: MessagesPage = await ModuleGPTServer.openai.beta.threads.messages.list(thread_gpt.id);

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
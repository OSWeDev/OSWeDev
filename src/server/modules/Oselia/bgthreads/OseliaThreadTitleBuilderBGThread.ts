import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../../GPT/GPTAssistantAPIServerController';
import GPTAssistantAPIServerSyncThreadMessagesController from '../../GPT/sync/GPTAssistantAPIServerSyncThreadMessagesController';

export default class OseliaThreadTitleBuilderBGThread implements IBGThread {

    private static instance: OseliaThreadTitleBuilderBGThread = null;

    public current_timeout: number = 1000;
    public MAX_timeout: number = 3000;
    public MIN_timeout: number = 1000;

    public semaphore: boolean = false;
    public run_asap: boolean = false;
    public last_run_unix: number = null;
    private constructor() {
    }

    get name(): string {
        return "OseliaThreadTitleBuilderBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!OseliaThreadTitleBuilderBGThread.instance) {
            OseliaThreadTitleBuilderBGThread.instance = new OseliaThreadTitleBuilderBGThread();
        }
        return OseliaThreadTitleBuilderBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('OseliaThreadTitleBuilderBGThread', 'work', 'IN');

            const thread_to_handle = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_is_true(field_names<GPTAssistantAPIThreadVO>().needs_thread_title_build)
                .filter_is_false(field_names<GPTAssistantAPIThreadVO>().thread_title_auto_build_locked)
                .filter_is_true(field_names<GPTAssistantAPIThreadVO>().has_content)
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadVO>();

            if ((!thread_to_handle) || (!thread_to_handle.length)) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            // On charge l'assistant pour avoir le titre
            const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, GPTAssistantAPIThreadVO.OSELIA_THREAD_TITLE_BUILDER_ASSISTANT_NAME)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            if ((!assistant) || (assistant.gpt_assistant_id == 'TODO')) {
                this.stats_out('failed', time_in);
                ConsoleHandler.error('OseliaThreadTitleBuilderBGThread - No assistant found');
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }


            /**
             * On ne génère que dans le cas où le dernier message date de plus de 30 secondes et est issu de l'assistant
             */
            const promise_pipeline = new PromisePipeline(10, 'OseliaThreadTitleBuilderBGThread');
            for (const i in thread_to_handle) {
                const thread = thread_to_handle[i];

                await promise_pipeline.push(async () => {
                    await this.build_thread_title(thread, assistant);
                });
            }
            await promise_pipeline.end();

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;

        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('OseliaThreadTitleBuilderBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('OseliaThreadTitleBuilderBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async build_thread_title(thread: GPTAssistantAPIThreadVO, build_title_assistant: GPTAssistantAPIAssistantVO) {
        const thread_messages: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_id(thread.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().created_at, false))
            .exec_as_server()
            .select_vos<GPTAssistantAPIThreadMessageVO>();

        // Si on a pas au moins 2 messages, on ne peut pas construire de titre
        if (thread_messages.length < 2) {
            return;
        }

        // Si le dernier message date de moins de 30 secondes, on ne fait rien
        const last_message = thread_messages[0];
        if ((Dates.now() - last_message.created_at) < 3) {
            return;
        }

        // Si le dernier message n'est pas de l'assistant, on ne fait rien
        if (last_message.role !== GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT) {
            return;
        }

        await this.build_thread_title_from_messages(thread, build_title_assistant, thread_messages);
    }

    private async build_thread_title_from_messages(
        thread: GPTAssistantAPIThreadVO,
        build_title_assistant: GPTAssistantAPIAssistantVO,
        thread_messages: GPTAssistantAPIThreadMessageVO[]) {

        // On évite de tourner en rond, si le thread en param est un thread de construction de titre, on ne le traite pas
        if (thread.current_default_assistant_id == build_title_assistant.id) {
            thread.needs_thread_title_build = false;
            thread.thread_title = 'Build Title: ' + Dates.format_segment(thread.oswedev_created_at, TimeSegment.TYPE_SECOND);
            thread.thread_title_auto_build_locked = true;
            return;
        }

        // Messages du thread -> Prendre message sans hidden

        const messages_contents: { [name: string]: string }[] = [];
        for (const message of thread_messages) {

            const message_content = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
                .filter_by_id(message.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_boolean_value('hidden', false)
                .using(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .set_sort(new SortByVO(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().id, true))
                .select_vo<GPTAssistantAPIThreadMessageContentVO>();
            if ((!message_content.content_type_text) || (!message_content.content_type_text.value)) {
                continue;
            }
            const new_content = {};
            switch (message.role) {
                case message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER:
                    const sender = await query(UserVO.API_TYPE_ID)
                        .filter_by_id(message.user_id)
                        .select_vo<UserVO>();
                    new_content[sender.name] = message_content.content_type_text.value;
                    break;
                case message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT:
                    new_content["IA"] = message_content.content_type_text.value;
                    break;
            }
            messages_contents.push(new_content);
        }

        const words = [];
        let nb_added_words = 0;
        for (const content of messages_contents) {
            const sender = Object.keys(content)[0];
            const content_words = Object.values(content)[0].trim().split(' ');
            let has_added_message_intro = false;
            for (const j in content_words) {
                const word = content_words[j].trim();

                if ((!word) || (!word.length)) {
                    continue;
                }

                if (word == '\\n') {
                    continue;
                }

                if (!has_added_message_intro) {
                    words.push('[' + sender + ']' + ':');
                    has_added_message_intro = true;
                }

                words.push(word.trim());
                nb_added_words++;

                if (nb_added_words >= 100) {
                    break;
                }
            }

            if (has_added_message_intro) {
                words.push('\n');
            }

            if (nb_added_words >= 100) {
                break;
            }
        }

        if (!nb_added_words) {
            return;
        }

        const words_100 = words.join(' ');

        const responses: GPTAssistantAPIThreadMessageVO[] = await GPTAssistantAPIServerController.ask_assistant(
            build_title_assistant.gpt_assistant_id,
            null,
            'Build Title: ' + Dates.format_segment(thread.oswedev_created_at, TimeSegment.TYPE_SECOND),
            words_100,
            null,
            null,
            // parseInt(uid_str),
        );

        if (!responses) {
            ConsoleHandler.warn('ModuleOseliaServer:build_thread_title:No response from assistant:' + build_title_assistant.gpt_assistant_id + ':words:' + words_100 + ':thread_id:' + thread.id);
            return;
        }

        const response = responses[0];

        if (!response) {
            ConsoleHandler.warn('ModuleOseliaServer:build_thread_title:No response from assistant:' + build_title_assistant.gpt_assistant_id + ':words:' + words_100 + ':thread_id:' + thread.id);
            return;
        }

        const response_contents = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
            .filter_by_id(response.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIThreadMessageContentVO>();

        for (const i in response_contents) {
            const response_content = response_contents[i];

            if (response_content.content_type_text) {
                thread.thread_title = response_content.content_type_text.value;
                thread.needs_thread_title_build = false;
                thread.thread_title_auto_build_locked = (words.length >= 100);
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread);
                return;
            }
        }

        if ((!thread.thread_title) || (thread.needs_thread_title_build) || (thread.thread_title_auto_build_locked)) {
            ConsoleHandler.warn('ModuleOseliaServer:build_thread_title:Might be stuck in a loop:' + build_title_assistant.gpt_assistant_id + ':words:' + words_100 + ':thread_id:' + thread.id + ':thread_title:' + thread.thread_title + ':content:' + JSON.stringify(response_contents));
        }
    }
}
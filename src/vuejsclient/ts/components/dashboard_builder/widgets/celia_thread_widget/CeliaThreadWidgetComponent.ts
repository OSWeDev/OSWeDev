import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ModuleGPT from '../../../../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../VueAppController';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import PushDataVueModule from '../../../../modules/PushData/PushDataVueModule';
import VOEventRegistrationKey from '../../../../modules/PushData/VOEventRegistrationKey';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import MailIDEventsComponent from '../../../mail_id_events/MailIDEventsComponent';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import CeliaThreadMessageComponent from './CeliaThreadMessage/CeliaThreadMessageComponent';
import CeliaThreadMessageActionURLComponent from './CeliaThreadMessageActionURL/CeliaThreadMessageActionURLComponent';
import './CeliaThreadWidgetComponent.scss';

@Component({
    template: require('./CeliaThreadWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Celiathreadmessageactionurlcomponent: CeliaThreadMessageActionURLComponent,
        Mailideventscomponent: MailIDEventsComponent,
        Celiathreadmessagecomponent: CeliaThreadMessageComponent
    }
})
export default class CeliaThreadWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    private too_many_threads: boolean = false;
    private has_access_to_thread: boolean = false;
    private is_loading_thread: boolean = true;

    private too_many_assistants: boolean = false;
    private is_loading_assistant: boolean = true;
    private can_run_assistant: boolean = false;
    private assistant_is_busy: boolean = false;

    private assistant: GPTAssistantAPIAssistantVO = null;
    private thread: GPTAssistantAPIThreadVO = null;
    private thread_messages: GPTAssistantAPIThreadMessageVO[] = [];

    private new_message_text: string = null;

    private vo_events_registration_keys: VOEventRegistrationKey[] = [];

    private throttle_load_thread = ThrottleHelper.declare_throttle_without_args(this.load_thread.bind(this), 10);

    @Watch('get_active_field_filters', { immediate: true, deep: true })
    @Watch('get_discarded_field_paths', { deep: true })
    @Watch('page_widget')
    private async on_change_filters_or_page_widget() {
        this.throttle_load_thread();
    }

    private async force_reload() {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([
            GPTAssistantAPIThreadVO.API_TYPE_ID,
            GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
            GPTAssistantAPIAssistantVO.API_TYPE_ID
        ]);

        this.throttle_load_thread();
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async unregister_all_vo_event_callbacks() {
        let promises = [];
        for (let i in this.vo_events_registration_keys) {
            let vo_event_registration_key = this.vo_events_registration_keys[i];

            promises.push(PushDataVueModule.unregister_vo_event_callback(vo_event_registration_key));
        }
        await all_promises(promises);
        this.vo_events_registration_keys = [];
    }

    private async load_thread() {

        this.is_loading_thread = true;
        this.too_many_threads = false;
        this.has_access_to_thread = false;

        this.is_loading_assistant = true;
        this.too_many_assistants = false;
        this.can_run_assistant = false;

        this.thread = null;
        this.thread_messages = [];
        this.assistant = null;
        await this.unregister_all_vo_event_callbacks();

        if (!this.page_widget) {

            this.is_loading_thread = false;
            this.is_loading_assistant = false;
            return;
        }

        await this.set_thread();

        // On check qu'on a un thread et un seul
        if (!this.thread) {

            this.is_loading_thread = false;
            this.is_loading_assistant = false;
            return;
        }

        await this.set_assistant();
        await this.register_thread_vo_updates();

        // On check qu'on a un assistant et un seul
        if (!!this.assistant) {
            this.can_run_assistant = true;
        }

        await this.register_thread_messages_vo_updates();
        // On récupère les messages du thread
        let thread_messages: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .filter_by_id(this.thread.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().id, true))
            .select_vos<GPTAssistantAPIThreadMessageVO>();
        for (let i in thread_messages) {
            let thread_message = thread_messages[i];
            if (this.thread_messages.findIndex((vo) => vo.id == thread_message.id) < 0) {
                this.thread_messages.push(thread_message);
            }
        }

        this.is_loading_thread = false;
        this.is_loading_assistant = false;
        this.has_access_to_thread = true;

        this.$nextTick(() => {
            this.scroll_to_bottom();
        });
    }

    private thread_message_updated() {
        //TODO fixme, on devrait redécaler en bas peut-etre que si on était déjà en bas.
        this.$nextTick(() => {
            this.scroll_to_bottom();
        });
    }

    private async set_thread() {

        // On check qu'on a un thread et un seul
        //  Si on a 1 thread, on peut avancer. Sinon on doit indiquer soit qu'il faut restreindre la query à un thread (>1), soit que le thread est introuvable (0)
        let context_query_select: ContextQueryVO = query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);
        context_query_select.query_distinct = true;

        let context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        let nb_threads = await context_query_count.select_count();

        if (!nb_threads) {
            this.is_loading_thread = false;
            return;
        }

        if (nb_threads > 1) {
            this.too_many_threads = true;
            this.is_loading_thread = false;
            return;
        }

        // On récupère le thread
        let thread: GPTAssistantAPIThreadVO = await context_query_select.select_vo<GPTAssistantAPIThreadVO>();

        if (!thread) {
            this.is_loading_thread = false;
            return;
        }

        this.thread = thread;
    }

    private async register_thread_vo_updates() {
        let room_vo = {
            [field_names<GPTAssistantAPIThreadVO>()._type]: GPTAssistantAPIThreadVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadVO>().id]: this.thread.id
        };
        let vo_event_registration_key = await PushDataVueModule.register_vo_delete_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (deleted_vo: GPTAssistantAPIThreadVO) => {
                this.force_reload();
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);

        room_vo = {
            [field_names<GPTAssistantAPIThreadVO>()._type]: GPTAssistantAPIThreadVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadVO>().id]: this.thread.id
        };
        vo_event_registration_key = await PushDataVueModule.register_vo_update_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (updated_vo: GPTAssistantAPIThreadVO) => {
                this.force_reload();
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);
    }

    private async register_thread_messages_vo_updates() {
        let room_vo = {
            [field_names<GPTAssistantAPIThreadMessageVO>()._type]: GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadMessageVO>().thread_id]: this.thread.id
        };
        let vo_event_registration_key = await PushDataVueModule.register_vo_create_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (created_vo: GPTAssistantAPIThreadMessageVO) => {
                let index = this.thread_messages.findIndex((vo) => vo.id == created_vo.id);
                if (index < 0) {
                    this.thread_messages.push(created_vo);
                }
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);

        room_vo = {
            [field_names<GPTAssistantAPIThreadMessageVO>()._type]: GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadMessageVO>().thread_id]: this.thread.id
        };
        vo_event_registration_key = await PushDataVueModule.register_vo_delete_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (deleted_vo: GPTAssistantAPIThreadMessageVO) => {
                let index = this.thread_messages.findIndex((vo) => vo.id == deleted_vo.id);
                if (index >= 0) {
                    this.thread_messages.splice(index, 1);
                }
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);

        room_vo = {
            [field_names<GPTAssistantAPIThreadMessageVO>()._type]: GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadMessageVO>().thread_id]: this.thread.id
        };
        vo_event_registration_key = await PushDataVueModule.register_vo_update_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (pre_update_vo: GPTAssistantAPIThreadMessageVO, post_update_vo: GPTAssistantAPIThreadMessageVO) => {
                let index = this.thread_messages.findIndex((vo) => vo.id == post_update_vo.id);
                if (index >= 0) {
                    this.thread_messages.splice(index, 1, post_update_vo);
                }
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);
    }

    private async set_assistant() {

        // On check qu'on a un assistant et un seul
        //  Si on a 1 assistant, on peut avancer. Sinon on doit indiquer soit qu'il faut restreindre la query à un assistant (>1), soit que le assistant est introuvable (0)
        //  Sauf si on a un current_default_assistant enregistré dans le thread, auquel cas on peut avancer
        let context_query_select: ContextQueryVO = query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);

        let context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        let nb_assistants = await context_query_count.select_count();

        if (((!nb_assistants) || (nb_assistants > 1)) && (!this.thread.current_default_assistant_id)) {
            let default_assistant: GPTAssistantAPIAssistantVO = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(this.thread.current_default_assistant_id)
                .select_vo<GPTAssistantAPIAssistantVO>();

            this.is_loading_assistant = false;

            if (!default_assistant) {
                return;
            }

            this.assistant = default_assistant;
            return;
        }


        if (!nb_assistants) {
            this.is_loading_assistant = false;
            return;
        }

        if (nb_assistants > 1) {
            this.too_many_assistants = true;
            this.is_loading_assistant = false;
            return;
        }

        // On récupère le assistant
        let assistant: GPTAssistantAPIAssistantVO = await context_query_select.select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            this.is_loading_assistant = false;
            return;
        }

        this.assistant = assistant;
    }

    private async scroll_to_bottom() {
        let thread_container_el = this.$refs.thread_container as HTMLElement;

        if (!thread_container_el) {
            return;
        }

        thread_container_el.scrollTop = thread_container_el.scrollHeight;
    }

    private async send_message() {

        if (!this.new_message_text) {
            return;
        }

        if (!this.thread) {
            return;
        }

        let self = this;
        this.assistant_is_busy = true;
        self.snotify.async(self.label('CeliaThreadWidgetComponent.send_message.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    let responses = await ModuleGPT.getInstance().ask_assistant(
                        self.assistant.gpt_assistant_id,
                        self.thread.gpt_thread_id,
                        self.new_message_text,
                        [],
                        VueAppController.getInstance().data_user.id
                    );
                    if (!responses || !responses.length) {
                        throw new Error('No response');
                    }

                    self.new_message_text = null;

                    // self.throttle_load_thread();

                    resolve({
                        body: self.label('CeliaThreadWidgetComponent.send_message.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('CeliaThreadWidgetComponent.send_message.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
                self.assistant_is_busy = false;
            }));
    }
}
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../../VueAppController';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import DatatableComponentField from '../../../../datatable/component/fields/DatatableComponentField';
import MailIDEventsComponent from '../../../../mail_id_events/MailIDEventsComponent';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import TablePaginationComponent from '../../table_widget/pagination/TablePaginationComponent';
import OseliaThreadMessageActionURLComponent from '../OseliaThreadMessageActionURL/OseliaThreadMessageActionURLComponent';
import './OseliaThreadMessageComponent.scss';

@Component({
    template: require('./OseliaThreadMessageComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Oseliathreadmessageactionurlcomponent: OseliaThreadMessageActionURLComponent,
        Mailideventscomponent: MailIDEventsComponent,
        Oseliathreadmessageemailcomponent: MailIDEventsComponent
    }
})
export default class OseliaThreadMessageComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private thread: GPTAssistantAPIThreadVO;

    @Prop({ default: null })
    private thread_message: GPTAssistantAPIThreadMessageVO;
    public thread_message_contents: GPTAssistantAPIThreadMessageContentVO[] = [];

    private is_loading_thread_message: boolean = true;

    private avatar_url: string = null;
    private user_name: string = null;

    private new_message_text: string = null;

    private throttle_load_thread_message = ThrottleHelper.declare_throttle_without_args(this.load_thread_message.bind(this), 10);

    get role_assistant() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
    }
    get role_assistant_avatar_url() {
        return '/vuejsclient/public/img/avatars/oselia.png';
    }

    get role_system() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_SYSTEM;
    }
    get role_system_avatar_url() {
        return '/vuejsclient/public/img/avatars/system.png';
    }

    get role_tool() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_TOOL;
    }
    get role_tool_avatar_url() {
        return '/vuejsclient/public/img/avatars/tool.png';
    }

    get role_function() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_FUNCTION;
    }
    get role_function_avatar_url() {
        return '/vuejsclient/public/img/avatars/function.png';
    }

    get role_user() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_USER;
    }

    get is_self_user() {

        if ((!this.thread_message) || (!this.thread_message.user_id)) {
            return false;
        }

        return this.thread_message.user_id == VueAppController.getInstance().data_user.id;
    }

    get message_content_type_text() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
    }

    get message_content_type_image() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
    }

    get message_content_type_action_url() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL;
    }

    get message_content_type_email() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_EMAIL;
    }

    @Watch('thread_message', { immediate: true })
    private async on_change_thread_message() {
        this.throttle_load_thread_message();
    }

    private async force_reload() {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([
            GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
        ]);

        this.throttle_load_thread_message();
    }

    /**
     * Obligatoire pour la synchro propre des données
     */
    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_thread_message() {

        this.is_loading_thread_message = true;
        this.thread_message_contents = [];
        await this.unregister_all_vo_event_callbacks();

        if (!this.thread_message) {

            this.is_loading_thread_message = false;
            return;
        }

        // On récupère les contenus du message
        await this.register_vo_updates_on_list(
            GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
            reflect<this>().thread_message_contents,
            [filter(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id).by_num_eq(this.thread_message.id)]
        );

        await this.load_avatar_url_and_user_name();

        this.is_loading_thread_message = false;

        this.$nextTick(() => {
            this.$emit('thread_message_updated');
        });
    }

    private async load_avatar_url_and_user_name() {
        const promises = [];
        promises.push((async () => {
            this.user_name = await ModuleAccessPolicy.getInstance().get_avatar_name(this.thread_message.user_id);
        })());
        promises.push((async () => {
            this.avatar_url = await ModuleAccessPolicy.getInstance().get_avatar_url(this.thread_message.user_id);
        })());
        await all_promises(promises);
    }
}
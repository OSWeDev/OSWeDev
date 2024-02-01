import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../../VueAppController';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';
import PushDataVueModule from '../../../../../modules/PushData/PushDataVueModule';
import VOEventRegistrationKey from '../../../../../modules/PushData/VOEventRegistrationKey';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import DatatableComponentField from '../../../../datatable/component/fields/DatatableComponentField';
import MailIDEventsComponent from '../../../../mail_id_events/MailIDEventsComponent';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import TablePaginationComponent from '../../table_widget/pagination/TablePaginationComponent';
import CeliaThreadMessageActionURLComponent from '../CeliaThreadMessageActionURL/CeliaThreadMessageActionURLComponent';
import './CeliaThreadMessageComponent.scss';

@Component({
    template: require('./CeliaThreadMessageComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Celiathreadmessageactionurlcomponent: CeliaThreadMessageActionURLComponent,
        Mailideventscomponent: MailIDEventsComponent,
        Celiathreadmessageemailcomponent: MailIDEventsComponent
    }
})
export default class CeliaThreadMessageComponent extends VueComponentBase {

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

    private is_loading_thread_message: boolean = true;
    private thread_message_contents: GPTAssistantAPIThreadMessageContentVO[] = [];

    private avatar_url: string = null;
    private user_name: string = null;

    private new_message_text: string = null;

    private vo_events_registration_keys: VOEventRegistrationKey[] = [];

    private throttle_load_thread_message = ThrottleHelper.declare_throttle_without_args(this.load_thread_message.bind(this), 10);

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

    private async load_thread_message() {

        this.is_loading_thread_message = true;
        this.thread_message_contents = [];
        await this.unregister_all_vo_event_callbacks();

        if (!this.thread_message) {

            this.is_loading_thread_message = false;
            return;
        }

        // On récupère les contenus du message
        await this.register_vo_updates();
        let thread_message_contents = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
            .filter_by_id(this.thread_message.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .set_sort(new SortByVO(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().id, true))
            .select_vos<GPTAssistantAPIThreadMessageContentVO>();
        for (let i in thread_message_contents) {
            let thread_message_content = thread_message_contents[i];
            if (this.thread_message_contents.findIndex((vo) => vo.id == thread_message_content.id) < 0) {
                this.thread_message_contents.push(thread_message_content);
            }
        }

        await this.load_avatar_url_and_user_name();


        this.is_loading_thread_message = false;

        this.$nextTick(() => {
            this.$emit('thread_message_updated');
        });
    }

    private async load_avatar_url_and_user_name() {
        let promises = [];
        promises.push((async () => {
            this.user_name = await ModuleAccessPolicy.getInstance().get_avatar_name(this.thread_message.user_id);
        })());
        promises.push((async () => {
            this.avatar_url = await ModuleAccessPolicy.getInstance().get_avatar_url(this.thread_message.user_id);
        })());
        await all_promises(promises);
    }

    private async register_vo_updates() {
        await this.register_thread_message_contents_vo_updates();
    }

    private async register_thread_message_contents_vo_updates() {
        let room_vo = {
            [field_names<GPTAssistantAPIThreadMessageContentVO>()._type]: GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id]: this.thread_message.id
        };
        let vo_event_registration_key = await PushDataVueModule.register_vo_create_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (created_vo: GPTAssistantAPIThreadMessageContentVO) => {
                let index = this.thread_message_contents.findIndex((vo) => vo.id == created_vo.id);
                if (index < 0) {
                    this.thread_message_contents.push(created_vo);
                    this.thread_message_contents.sort((a, b) => a.weight - b.weight);
                }
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);

        room_vo = {
            [field_names<GPTAssistantAPIThreadMessageContentVO>()._type]: GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id]: this.thread_message.id
        };
        vo_event_registration_key = await PushDataVueModule.register_vo_delete_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (deleted_vo: GPTAssistantAPIThreadMessageContentVO) => {
                let index = this.thread_message_contents.findIndex((vo) => vo.id == deleted_vo.id);
                if (index >= 0) {
                    this.thread_message_contents.splice(index, 1);
                }
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);

        room_vo = {
            [field_names<GPTAssistantAPIThreadMessageContentVO>()._type]: GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
            [field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id]: this.thread_message.id
        };
        vo_event_registration_key = await PushDataVueModule.register_vo_update_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (pre_update_vo: GPTAssistantAPIThreadMessageContentVO, post_update_vo: GPTAssistantAPIThreadMessageContentVO) => {
                let index = this.thread_message_contents.findIndex((vo) => vo.id == post_update_vo.id);
                if (index >= 0) {
                    this.thread_message_contents.splice(index, 1, post_update_vo);
                }
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);
    }

    get role_assistant() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TYPE_ASSISTANT;
    }
    get role_assistant_avatar_url() {
        return '/vuejsclient/public/img/avatars/celia.png';
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
}
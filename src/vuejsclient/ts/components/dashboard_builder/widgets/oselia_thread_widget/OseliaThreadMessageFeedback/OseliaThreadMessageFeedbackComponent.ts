import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import OseliaThreadMessageFeedbackVO from '../../../../../../../shared/modules/Oselia/vos/OseliaThreadMessageFeedbackVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../../VueAppController';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import OseliaFeedbackEditorComponent from '../OseliaFeedbackEditor/OseliaFeedbackEditorComponent';
import './OseliaThreadMessageFeedbackComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./OseliaThreadMessageFeedbackComponent.pug'),
    components: {
        Oseliafeedbackeditorcomponent: OseliaFeedbackEditorComponent
    }
})
export default class OseliaThreadMessageFeedbackComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;


    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private thread_message: GPTAssistantAPIThreadMessageVO;

    public current_user_feedbacks: OseliaThreadMessageFeedbackVO[] = null;

    private throttle_load_feedback = ThrottleHelper.declare_throttle_without_args(
        'OseliaThreadMessageFeedbackComponent.throttle_load_feedback',
        this.load_feedback, 10);

    get get_dashboard_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet(reflect<this>().get_dashboard_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }

    @Watch('thread', { immediate: true })
    private async onchange_action_url_id() {
        this.throttle_load_feedback();
    }


    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_feedback() {

        await this.unregister_all_vo_event_callbacks();

        if (!this.thread_message) {
            return;
        }

        await this.register_vo_updates_on_list(
            OseliaThreadMessageFeedbackVO.API_TYPE_ID,
            reflect<this>().current_user_feedbacks,
            [
                filter(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().assistant_thread_message_id).by_num_eq(this.thread_message.id),
                filter(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().user_id).by_num_eq(VueAppController.getInstance().data_user.id)
            ],
            [
                new SortByVO(OseliaThreadMessageFeedbackVO.API_TYPE_ID, field_names<OseliaThreadMessageFeedbackVO>().id, true)
            ]
        );
    }

    private async add_feedback(positive: boolean) {
        const feedback = new OseliaThreadMessageFeedbackVO();
        feedback.assistant_thread_message_id = this.thread_message.id;
        feedback.assistant_id = this.thread_message.assistant_id;
        feedback.prompt_id = this.thread_message.prompt_id;
        feedback.feedback = null;
        feedback.feedback_positive = positive;
        feedback.user_id = VueAppController.getInstance().data_user.id;
        await ModuleDAO.instance.insertOrUpdateVO(feedback);
    }
}
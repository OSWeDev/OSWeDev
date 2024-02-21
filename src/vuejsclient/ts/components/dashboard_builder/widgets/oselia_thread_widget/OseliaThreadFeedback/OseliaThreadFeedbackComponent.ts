import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaThreadFeedbackVO from '../../../../../../../shared/modules/Oselia/vos/OseliaThreadFeedbackVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../../VueAppController';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import OseliaFeedbackEditorComponent from '../OseliaFeedbackEditor/OseliaFeedbackEditorComponent';
import './OseliaThreadFeedbackComponent.scss';

@Component({
    template: require('./OseliaThreadFeedbackComponent.pug'),
    components: {
        Oseliafeedbackeditorcomponent: OseliaFeedbackEditorComponent
    }
})
export default class OseliaThreadFeedbackComponent extends VueComponentBase {

    public current_user_feedbacks: OseliaThreadFeedbackVO[] = null;

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

    private throttle_load_feedback = ThrottleHelper.declare_throttle_without_args(this.load_feedback, 10);

    @Watch('thread', { immediate: true })
    private async onchange_action_url_id() {
        this.throttle_load_feedback();
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_feedback() {

        await this.unregister_all_vo_event_callbacks();

        if (!this.thread) {
            return;
        }

        await this.register_vo_updates_on_list(
            OseliaThreadFeedbackVO.API_TYPE_ID,
            reflect<this>().current_user_feedbacks,
            [
                filter(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().assistant_thread_id).by_num_eq(this.thread.id),
                filter(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().user_id).by_num_eq(VueAppController.getInstance().data_user.id)
            ],
            [
                new SortByVO(OseliaThreadFeedbackVO.API_TYPE_ID, field_names<OseliaThreadFeedbackVO>().id, true)
            ]
        );
    }

    private async add_feedback(positive: boolean) {
        let feedback = new OseliaThreadFeedbackVO();
        feedback.assistant_thread_id = this.thread.id;
        feedback.feedback = null;
        feedback.feedback_positive = positive;
        feedback.user_id = VueAppController.getInstance().data_user.id;
        await ModuleDAO.getInstance().insertOrUpdateVO(feedback);
    }
}
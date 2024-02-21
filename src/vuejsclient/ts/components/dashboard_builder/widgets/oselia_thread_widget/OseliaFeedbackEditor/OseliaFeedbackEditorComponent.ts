import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import OseliaThreadFeedbackVO from '../../../../../../../shared/modules/Oselia/vos/OseliaThreadFeedbackVO';
import OseliaThreadMessageFeedbackVO from '../../../../../../../shared/modules/Oselia/vos/OseliaThreadMessageFeedbackVO';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './OseliaFeedbackEditorComponent.scss';

@Component({
    template: require('./OseliaFeedbackEditorComponent.pug'),
    components: {}
})
export default class OseliaFeedbackEditorComponent extends VueComponentBase {

    public current_user_feedback: OseliaThreadFeedbackVO | OseliaThreadMessageFeedbackVO = null;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private current_user_feedback_type: string;

    @Prop({ default: null })
    private current_user_feedback_id: number;

    private throttle_load_feedback = ThrottleHelper.declare_throttle_without_args(this.load_feedback, 10);
    private throttle_save_feedback = ThrottleHelper.declare_throttle_without_args(this.save_feedback, 10);

    private has_modified_feedback: boolean = false;

    @Watch('current_user_feedback_id', { immediate: true })
    @Watch('current_user_feedback_type')
    private async onchange_action_url_id() {
        this.throttle_load_feedback();
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_feedback() {

        await this.unregister_all_vo_event_callbacks();

        if ((!this.current_user_feedback_id) || (!this.current_user_feedback_type)) {
            return;
        }

        this.has_modified_feedback = false;

        await this.register_single_vo_updates(
            this.current_user_feedback_type,
            this.current_user_feedback_id,
            reflect<this>().current_user_feedback,
            false
        );
    }

    private async set_negative() {
        if (!this.current_user_feedback) {
            return;
        }

        this.current_user_feedback.feedback_positive = false;
        this.has_modified_feedback = true;
    }

    private async set_positive() {
        if (!this.current_user_feedback) {
            return;
        }

        this.current_user_feedback.feedback_positive = true;
        this.has_modified_feedback = true;
    }

    private async set_modified() {
        this.has_modified_feedback = true;
    }

    private async save_feedback() {
        if (!this.current_user_feedback) {
            return;
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.current_user_feedback);
    }

    private async delete_feedback() {
        if (!this.current_user_feedback) {
            return;
        }

        await ModuleDAO.getInstance().deleteVOs([this.current_user_feedback]);
    }
}
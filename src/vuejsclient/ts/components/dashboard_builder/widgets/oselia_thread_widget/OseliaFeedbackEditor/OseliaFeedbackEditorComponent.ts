import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import OseliaThreadFeedbackVO from '../../../../../../../shared/modules/Oselia/vos/OseliaThreadFeedbackVO';
import OseliaThreadMessageFeedbackVO from '../../../../../../../shared/modules/Oselia/vos/OseliaThreadMessageFeedbackVO';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaFeedbackEditorComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./OseliaFeedbackEditorComponent.pug'),
    components: {}
})
export default class OseliaFeedbackEditorComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private current_user_feedback_type: string;

    @Prop({ default: null })
    private current_user_feedback_id: number;

    public current_user_feedback: OseliaThreadFeedbackVO | OseliaThreadMessageFeedbackVO = null;
    private throttle_load_feedback = ThrottleHelper.declare_throttle_without_args(
        'OseliaFeedbackEditorComponent.throttle_load_feedback',
        this.load_feedback, 10);
    private throttle_save_feedback = ThrottleHelper.declare_throttle_without_args(
        'OseliaFeedbackEditorComponent.throttle_save_feedback',
        this.save_feedback, 10);

    private has_modified_feedback: boolean = false;


    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }

    get get_dashboard_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet(reflect<this>().get_dashboard_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }


    @Watch('current_user_feedback_id', { immediate: true })
    @Watch('current_user_feedback_type')
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

        await ModuleDAO.instance.insertOrUpdateVO(this.current_user_feedback);
    }

    private async delete_feedback() {
        if (!this.current_user_feedback) {
            return;
        }

        await ModuleDAO.instance.deleteVOs([this.current_user_feedback]);
    }
}
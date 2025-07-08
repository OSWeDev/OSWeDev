import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import BlocTextWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/BlocTextWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import './BlocTextWidgetOptionsComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./BlocTextWidgetOptionsComponent.pug')
})
export default class BlocTextWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private bloc_text: string = null;

    private next_update_options: BlocTextWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(
        'BlocTextWidgetOptionsComponent.throttled_update_options',
        this.update_options.bind(this), 50, false);

    get get_dashboard_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet(reflect<this>().get_dashboard_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }

    get get_active_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_active_api_type_ids);
    }

    get get_query_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_query_api_type_ids);
    }

    get widget_options(): BlocTextWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: BlocTextWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as BlocTextWidgetOptionsVO;
                options = options ? new BlocTextWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }


    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.bloc_text = null;

            return;
        }
        this.bloc_text = this.widget_options.bloc_text;
    }

    @Watch('bloc_text')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.bloc_text != this.bloc_text) {
            this.next_update_options = this.widget_options;
            this.next_update_options.bloc_text = this.bloc_text;

            await this.throttled_update_options();
        }
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

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }


        await this.throttled_update_options();
    }

    private get_default_options(): BlocTextWidgetOptionsVO {
        return BlocTextWidgetOptionsVO.createNew(
            "",
        );
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }
    }

}
import { isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import SupervisionTypeWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import SupervisionTypeWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/SupervisionTypeWidgetOptionsVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import './SupervisionTypeWidgetOptionsComponent.scss';

@Component({
    template: require('./SupervisionTypeWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class SupervisionTypeWidgetOptionsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private next_update_options: SupervisionTypeWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(
        'SupervisionTypeWidgetOptionsComponent.throttled_update_options',
        this.update_options.bind(this), 50, false);

    private supervision_api_type_ids: string[] = [];
    private supervision_select_options: string[] = [];

    private order_by_categories: boolean = true;
    private show_counter: boolean = true;
    private refresh_button: boolean = true;
    private auto_refresh: boolean = true;
    private auto_refresh_seconds: number = 30;

    get widget_options(): SupervisionTypeWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionTypeWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionTypeWidgetOptionsVO;
                options = options ? new SupervisionTypeWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get default_supervision_api_type_ids(): string[] {
        return this.widget_options?.supervision_api_type_ids ?? [];
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_dashboard_api_type_ids);
    }

    // get order_by_categories(): boolean {

    //     if (!this.widget_options) {
    //         return false;
    //     }

    //     return !!this.widget_options.order_by_categories;
    // }

    // get show_counter(): boolean {

    //     if (!this.widget_options) {
    //         return false;
    //     }

    //     return !!this.widget_options.show_counter;
    // }

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {

        this.supervision_select_options = SupervisionTypeWidgetManager.load_supervision_api_type_ids_by_dashboard(this.get_dashboard_api_type_ids);

        // if ((!this.page_widget) || (!this.widget_options)) {
        //     if (this.supervision_api_type_ids?.length > 0) {
        //         this.supervision_api_type_ids = [];
        //     }
        //     return;
        // }

        this.initialize();
    }

    @Watch('supervision_api_type_ids')
    private onchange_supervision_api_type_ids() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.supervision_api_type_ids != this.next_update_options.supervision_api_type_ids) {
            this.next_update_options.supervision_api_type_ids = this.supervision_api_type_ids;

            this.throttled_update_options();
        }
    }

    @Watch('auto_refresh_seconds')
    private async onchange_auto_refresh_seconds() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.auto_refresh_seconds != this.next_update_options.auto_refresh_seconds) {
            this.next_update_options.auto_refresh_seconds = this.auto_refresh_seconds;

            this.throttled_update_options();
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }


    private supervision_select_label(api_type_id: string): string {
        return this.label('supervision_widget_component.' + api_type_id);
    }

    private get_default_options(): SupervisionTypeWidgetOptionsVO {
        return new SupervisionTypeWidgetOptionsVO(this.default_supervision_api_type_ids, this.order_by_categories, this.show_counter, true, true, 30);
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        // const name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        const name = VOsTypesManager.vosArray_to_vosByIds(WidgetOptionsVOManager.getInstance().sorted_widgets_types)[this.page_widget.widget_id].name;
        // const get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        const get_selected_fields = WidgetOptionsVOManager.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    private async switch_order_by_categories() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.order_by_categories = !this.next_update_options.order_by_categories;

        await this.throttled_update_options();
    }

    private async switch_show_counter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_counter = !this.next_update_options.show_counter;

        if (!this.next_update_options.show_counter) {
            this.next_update_options.refresh_button = false;
            this.refresh_button = false;
            this.next_update_options.auto_refresh = false;
            this.auto_refresh = false;
        }

        await this.throttled_update_options();
    }

    private initialize() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!this.supervision_api_type_ids) {
                this.supervision_api_type_ids = [];
            }
            if (!this.order_by_categories) {
                this.order_by_categories = true;
            }
            if (!this.show_counter) {
                this.show_counter = true;
            }
            if (!this.refresh_button) {
                this.refresh_button = true;
            }
            if (!this.auto_refresh) {
                this.auto_refresh = true;
            }
            if (!this.auto_refresh_seconds) {
                this.auto_refresh_seconds = 30;
            }
            return;
        }

        if (!isEqual(this.supervision_api_type_ids, this.default_supervision_api_type_ids)) {
            this.supervision_api_type_ids = this.default_supervision_api_type_ids;
        }
        if (this.order_by_categories != this.widget_options.order_by_categories) {
            this.order_by_categories = this.widget_options.order_by_categories;
        }
        if (this.show_counter != this.widget_options.show_counter) {
            this.show_counter = this.widget_options.show_counter;
        }
        if (this.refresh_button != this.widget_options.refresh_button) {
            this.refresh_button = this.widget_options.refresh_button;
        }
        if (this.auto_refresh != this.widget_options.auto_refresh) {
            this.auto_refresh = this.widget_options.auto_refresh;
        }
        if (!!this.widget_options.auto_refresh_seconds && this.auto_refresh_seconds != this.widget_options.auto_refresh_seconds) {
            this.auto_refresh_seconds = this.widget_options.auto_refresh_seconds;
        }
    }

    private async switch_refresh_button() {
        this.refresh_button = !this.refresh_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refresh_button != this.refresh_button) {
            this.next_update_options.refresh_button = this.refresh_button;
            this.throttled_update_options();
        }
    }

    private async switch_auto_refresh() {
        this.auto_refresh = !this.auto_refresh;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.auto_refresh != this.auto_refresh) {
            this.next_update_options.auto_refresh = this.auto_refresh;
            this.throttled_update_options();
        }
    }
}
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import MonthFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import './MonthFilterWidgetOptionsComponent.scss';

@Component({
    template: require('./MonthFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent
    }
})
export default class MonthFilterWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    public set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    public is_vo_field_ref: boolean = true;
    public month_relative_mode: boolean = true;
    public auto_select_month: boolean = true;
    public auto_select_month_relative_mode: boolean = true;

    public custom_filter_name: string = null;

    public min_month: string = null;
    public max_month: string = null;
    public auto_select_month_min: string = null;
    public auto_select_month_max: string = null;

    public next_update_options: MonthFilterWidgetOptionsVO = null;

    public relative_to_other_filter_id: number = null;
    public is_relative_to_other_filter: boolean = false;
    public hide_filter: boolean = false;

    public can_ytd: boolean = false;
    public ytd_option_m_minus_x: string = "1";

    // Current filter may show select_all of selectable months
    public can_select_all: boolean = false;
    // Current filter may cumulate months
    public is_month_cumulated_selected: boolean = false;

    public widget_options: MonthFilterWidgetOptionsVO = null;

    get get_custom_filters(): string[] {
        return this.vuexGet(reflect<this>().get_custom_filters);
    }

    get get_page_widgets(): DashboardPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_page_widgets);
    }


    get default_placeholder_translation(): string {
        return this.label('DOWFilterWidget.filter_placeholder');
    }


    get vo_field_ref(): VOFieldRefVO {
        const options: MonthFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get get_all_widgets(): DashboardWidgetVO[] {
        return this.vuexGet(reflect<this>().get_all_widgets);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }


    get other_filters_by_name(): { [filter_name: string]: DashboardPageWidgetVO } {
        if (!this.get_page_widgets) {
            return null;
        }

        const res: { [filter_name: string]: DashboardPageWidgetVO } = {};

        for (const i in this.get_page_widgets) {
            const get_page_widget = this.get_page_widgets[i];

            if (get_page_widget.id == this.page_widget.id) {
                continue;
            }

            if (get_page_widget.widget_id !== this.page_widget.widget_id) {
                continue;
            }

            if (!get_page_widget.json_options) {
                continue;
            }

            const other_filter_options = JSON.parse(get_page_widget.json_options) as MonthFilterWidgetOptionsVO;
            if (!other_filter_options) {
                continue;
            }

            if (other_filter_options.is_vo_field_ref) {
                if ((!other_filter_options.vo_field_ref) || (!other_filter_options.vo_field_ref.api_type_id) || (!other_filter_options.vo_field_ref.field_id)) {
                    continue;
                }

                const name = 'Widget ID:' + get_page_widget.id + ' : ' + other_filter_options.vo_field_ref.api_type_id + '.' + other_filter_options.vo_field_ref.field_id;
                if (res[name]) {
                    continue;
                }
                res[name] = get_page_widget;
            } else {
                if (!other_filter_options.custom_filter_name) {
                    continue;
                }

                const name = 'Widget ID:' + get_page_widget.id + ' : ' + other_filter_options.custom_filter_name;
                if (res[name]) {
                    continue;
                }
                res[name] = get_page_widget;
            }
        }

        return res;
    }

    get has_existing_other_custom_filters(): boolean {
        if (!this.other_custom_filters) {
            return false;
        }

        return this.other_custom_filters.length > 0;
    }

    get other_custom_filters(): string[] {
        if (!this.get_custom_filters) {
            return null;
        }

        const res: string[] = [];

        for (const i in this.get_custom_filters) {
            const get_custom_filter = this.get_custom_filters[i];

            if (get_custom_filter == this.custom_filter_name) {
                continue;
            }

            res.push(get_custom_filter);
        }

        return this.get_custom_filters;
    }

    /**
     * onchange_page_widget
     *  - Called when page_widget is changed
     *
     * @returns {void}
     */
    @Watch(reflect<MonthFilterWidgetOptionsComponent>().page_widget, { immediate: true, deep: true })
    public onchange_page_widget(): void {
        if (!this.page_widget) {
            return;
        }

        this.widget_options = this.get_widget_options();
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().relative_to_other_filter_id)
    public async onchange_relative_to_other_filter_id() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.relative_to_other_filter_id != this.relative_to_other_filter_id) {
            this.next_update_options = this.widget_options;
            this.next_update_options.relative_to_other_filter_id = this.relative_to_other_filter_id;

            this.update_options();
        }
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().min_month)
    public async onchange_min_month() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.min_month == null) ? null : parseInt(this.min_month);
        if (this.widget_options.min_month != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.min_month = month;

            this.update_options();
        }
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 50,
        leading: false,
    })
    public async update_options() {

        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        const name = this.get_widgets_by_id[this.page_widget.widget_id].name;
        const get_selected_fields = WidgetOptionsVOManager.widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().auto_select_month_min)
    public async onchange_auto_select_month_min() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.auto_select_month_min == null) ? null : parseInt(this.auto_select_month_min);
        if (this.widget_options.auto_select_month_min != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_month_min = month;

            this.update_options();
        }
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().auto_select_month_max)
    public async onchange_auto_select_month_max() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.auto_select_month_max == null) ? null : parseInt(this.auto_select_month_max);
        if (this.widget_options.auto_select_month_max != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_month_max = month;

            this.update_options();
        }
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().ytd_option_m_minus_x)
    public async onchange_ytd_option_m_minus_x() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.ytd_option_m_minus_x == null) ? 1 : parseInt(this.ytd_option_m_minus_x);
        if (this.widget_options.ytd_option_m_minus_x != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.ytd_option_m_minus_x = month;

            this.update_options();
        }
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().max_month)
    public async onchange_max_month() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.max_month == null) ? null : parseInt(this.max_month);
        if (this.widget_options.max_month != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_month = month;

            this.update_options();
        }
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().custom_filter_name)
    public async onchange_custom_filter_name() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.custom_filter_name != this.custom_filter_name) {
            this.next_update_options = this.widget_options;
            this.next_update_options.custom_filter_name = this.custom_filter_name;

            this.update_options();
        }
    }

    @Watch(reflect<MonthFilterWidgetOptionsComponent>().widget_options, { immediate: true })
    public onchange_widget_options() {
        if (!this.widget_options) {
            this.is_vo_field_ref = true;
            this.month_relative_mode = true;
            this.auto_select_month = true;
            this.auto_select_month_relative_mode = true;
            this.custom_filter_name = null;
            this.min_month = null;
            this.max_month = null;
            this.auto_select_month_min = null;
            this.auto_select_month_max = null;
            this.relative_to_other_filter_id = null;
            this.is_relative_to_other_filter = false;
            this.hide_filter = false;
            this.can_select_all = false;
            this.is_month_cumulated_selected = false;
            this.can_ytd = false;
            this.ytd_option_m_minus_x = "1";
            return;
        }

        this.is_vo_field_ref = this.widget_options.is_vo_field_ref;
        this.month_relative_mode = this.widget_options.month_relative_mode;
        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        this.custom_filter_name = this.widget_options.custom_filter_name;
        this.min_month = (this.widget_options.min_month == null) ? null : this.widget_options.min_month.toString();
        this.max_month = (this.widget_options.max_month == null) ? null : this.widget_options.max_month.toString();
        this.auto_select_month_min = (this.widget_options.auto_select_month_min == null) ? null : this.widget_options.auto_select_month_min.toString();
        this.auto_select_month_max = (this.widget_options.auto_select_month_max == null) ? null : this.widget_options.auto_select_month_max.toString();
        this.can_ytd = this.widget_options.can_ytd;
        this.ytd_option_m_minus_x = (this.widget_options.ytd_option_m_minus_x == null) ? "1" : this.widget_options.ytd_option_m_minus_x.toString();
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.hide_filter = this.widget_options.hide_filter;
        this.can_select_all = this.widget_options.can_select_all;
        this.is_month_cumulated_selected = this.widget_options.is_month_cumulated_selected;
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

    public set_custom_filters(custom_filters: string[]) {
        return this.vuexAct(reflect<this>().set_custom_filters, custom_filters);
    }


    public change_custom_filter(custom_filter: string) {
        this.custom_filter_name = custom_filter;
        if (this.get_custom_filters && (this.get_custom_filters.indexOf(custom_filter) < 0)) {
            const custom_filters = Array.from(this.get_custom_filters);
            custom_filters.push(custom_filter);
            this.set_custom_filters(custom_filters);
        }
    }

    public async switch_hide_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { hide_filter: this.hide_filter }
            );
        }

        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;

        this.update_options();
    }

    public async switch_is_relative_to_other_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { is_relative_to_other_filter: this.is_relative_to_other_filter }
            );
        }

        this.next_update_options.is_relative_to_other_filter = !this.next_update_options.is_relative_to_other_filter;

        this.update_options();
    }

    public async switch_month_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { month_relative_mode: this.month_relative_mode }
            );
        }

        this.next_update_options.month_relative_mode = !this.next_update_options.month_relative_mode;

        this.update_options();
    }

    public async switch_auto_select_month() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { auto_select_month: this.auto_select_month }
            );
        }

        this.next_update_options.auto_select_month = !this.next_update_options.auto_select_month;

        this.update_options();
    }

    public async switch_auto_select_month_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { auto_select_month_relative_mode: this.auto_select_month_relative_mode }
            );
        }

        this.next_update_options.auto_select_month_relative_mode = !this.next_update_options.auto_select_month_relative_mode;

        this.update_options();
    }

    /**
     * Toggle Can Select All
     *  - Allow to the user to show select_all of the active filter (months) options
     */
    public async toggle_can_select_all() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from({
                can_select_all: this.can_select_all
            });
        }

        this.next_update_options.can_select_all = !this.next_update_options.can_select_all;

        this.update_options();
    }

    public toggle_can_ytd() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from({
                can_ytd: this.can_ytd
            });
        }

        this.next_update_options.can_ytd = !this.next_update_options.can_ytd;

        this.update_options();
    }


    /**
     * toggle_is_month_cumulated
     * - Allow to the user to cumulate the months
     */
    public async toggle_is_month_cumulated() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { is_month_cumulated_selected: this.is_month_cumulated_selected }
            );
        }

        this.next_update_options.is_month_cumulated_selected = !this.next_update_options.is_month_cumulated_selected;

        this.update_options();
    }

    public async switch_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { is_vo_field_ref: this.is_vo_field_ref }
            );
        }

        this.next_update_options.is_vo_field_ref = !this.next_update_options.is_vo_field_ref;

        this.update_options();
    }

    public async remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        this.update_options();
    }

    /**
     * get_widget_options
     *
     * @returns MonthFilterWidgetOptionsVO
     */
    public get_widget_options(): MonthFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: MonthFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as MonthFilterWidgetOptionsVO;
                options = options ? new MonthFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    public async add_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options(
                { is_vo_field_ref: this.is_vo_field_ref }
            );
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        this.update_options();
    }

    /**
     * create_widget_options
     * - Return default widget options
     * @returns {MonthFilterWidgetOptionsVO}
     */
    public create_widget_options(
        props?: Partial<MonthFilterWidgetOptionsVO>
    ): MonthFilterWidgetOptionsVO {

        return new MonthFilterWidgetOptionsVO(
            true,
            null,
            null,
            true,
            null,
            null,
            true,
            true,
            null,
            null,
            false,
            null,
            false
        ).from(props);
    }
}
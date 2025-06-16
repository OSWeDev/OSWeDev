import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import MonthFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/MonthFilterWidgetManager';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import MonthFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import MonthFilterInputComponent from '../../../../month_filter_input/MonthFilterInputComponent';
import './MonthFilterWidgetOptionsButtonSetterComponent.scss';

@Component({
    template: require('./MonthFilterWidgetOptionsButtonSetterComponent.pug'),
    components: {
        Monthfilterinputcomponent: MonthFilterInputComponent,
    }
})
export default class MonthFilterWidgetOptionsButtonSetterComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO; // TODO: find the page_widget_id and then configure the widget_options

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    private next_update_options: MonthFilterWidgetOptionsVO = null;

    private throttled_update_page_widget = ThrottleHelper.declare_throttle_without_args(
        'MonthFilterWidgetOptionsButtonSetterComponent.throttled_update_page_widget',
        this.update_page_widget.bind(this),
        50,
        false
    );

    private hide_filter: boolean = false;

    private month_relative_mode: boolean = true;

    private selected_months: { [month: number]: boolean } = {};

    // Is All Months Selected Toggle Button
    // - Shall be highlight or true when selected_months empty
    // - Shall be false when selected_months has at least one selected
    private is_all_months_selected: boolean = false;
    private force_selected_months_reset: boolean = false;

    private auto_select_month: boolean = null;
    private auto_select_month_relative_mode: boolean = null;

    private min_month: number = null;
    private max_month: number = null;

    private auto_select_month_min: number = null;
    private auto_select_month_max: number = null;

    private old_widget_options: MonthFilterWidgetOptionsVO = null;
    private is_relative_to_other_filter: boolean = false;
    private relative_to_other_filter_id: number = null;

    // Relative page widget (if relative_to_other_filter_id is set)
    private all_months_page_widgets: DashboardPageWidgetVO[] = null;

    // Relative page widget (if relative_to_other_filter_id is set)
    private relative_page_widget: DashboardPageWidgetVO = null;

    // Current filter may cumulate months
    private is_month_cumulated_selected: boolean = false;

    private can_configure_auto_select_month_relative_mode: boolean = true;

    private widget_options: MonthFilterWidgetOptionsVO = null;

    private throttled_load_all_months_page_widgets = ThrottleHelper.declare_throttle_without_args(
        'MonthFilterWidgetOptionsButtonSetterComponent.throttled_load_all_months_page_widgets',
        this.load_all_months_page_widgets.bind(this),
        50,
        false
    );

    get get_page_widgets_components_by_pwid(): { [pwid: number]: VueComponentBase } {
        return this.vuexGet<{ [pwid: number]: VueComponentBase }>(reflect<this>().get_page_widgets_components_by_pwid);
    }


    get vo_field_ref(): VOFieldRefVO {
        const options: MonthFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }
    get is_vo_field_ref(): boolean {
        if (!this.widget_options) {
            return true;
        }

        return this.widget_options.is_vo_field_ref;
    }

    get custom_filter_name(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.custom_filter_name;
    }

    get months(): string[] {
        return MonthFilterWidgetManager.get_available_months_from_widget_options(
            this.widget_options
        );
    }

    /**
     * Can Select All
     *  - Can select all clickable button
     */
    get can_select_all(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_all;
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    /**
     * onchange_page_widget
     *  - Called when page_widget is changed
     *
     * @returns {void}
     */
    @Watch('page_widget', { immediate: true, deep: true })
    private onchange_page_widget(): void {
        if (!this.page_widget) {
            return;
        }

        this.widget_options = this.get_widget_options();
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private onchange_widget_options() {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        if (!this.widget_options) {
            // this.is_vo_field_ref = true;
            this.month_relative_mode = true;
            this.auto_select_month = true;
            this.auto_select_month_relative_mode = true;
            // this.custom_filter_name = null;
            this.min_month = null;
            this.max_month = null;
            this.auto_select_month_min = null;
            this.auto_select_month_max = null;
            this.relative_to_other_filter_id = null;
            this.is_relative_to_other_filter = false;
            this.hide_filter = false;
            // this.can_select_all = false;
            this.is_month_cumulated_selected = false;
            this.is_all_months_selected = false;
            return;
        }

        // this.is_vo_field_ref = this.widget_options.is_vo_field_ref;
        this.month_relative_mode = this.widget_options.month_relative_mode;
        this.auto_select_month = this.widget_options.auto_select_month;
        this.auto_select_month_relative_mode = this.widget_options.auto_select_month_relative_mode;
        // this.custom_filter_name = this.widget_options.custom_filter_name;
        this.min_month = (this.widget_options.min_month == null) ? null : this.widget_options.min_month;
        this.max_month = (this.widget_options.max_month == null) ? null : this.widget_options.max_month;
        this.auto_select_month_min = (this.widget_options.auto_select_month_min == null) ? null : this.widget_options.auto_select_month_min;
        this.auto_select_month_max = (this.widget_options.auto_select_month_max == null) ? null : this.widget_options.auto_select_month_max;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.hide_filter = this.widget_options.hide_filter;
        // this.can_select_all = this.widget_options.can_select_all;
        this.is_month_cumulated_selected = this.widget_options.is_month_cumulated_selected ?? false;
        this.is_all_months_selected = this.widget_options.is_all_months_selected ?? false;

        this.selected_months = MonthFilterWidgetManager.get_selected_months_from_widget_options(
            this.widget_options
        );
    }

    @Watch('relative_to_other_filter_id')
    private onchange_relative_to_other_filter_id() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.relative_to_other_filter_id != this.relative_to_other_filter_id) {
            this.next_update_options = this.widget_options;
            this.next_update_options.relative_to_other_filter_id = this.relative_to_other_filter_id;

            this.throttled_update_page_widget();
        }
    }

    @Watch('min_month')
    private onchange_min_month() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.min_month == null) ? null : parseInt(this.min_month.toString());
        if (this.widget_options.min_month != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.min_month = month;

            this.throttled_update_page_widget();
        }
    }

    @Watch('auto_select_month_min')
    private onchange_auto_select_month_min() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.auto_select_month_min == null) ? null : parseInt(this.auto_select_month_min.toString());
        if (this.widget_options.auto_select_month_min != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_month_min = month;

            this.throttled_update_page_widget();
        }
    }

    @Watch('auto_select_month_max')
    private onchange_auto_select_month_max() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.auto_select_month_max == null) ? null : parseInt(this.auto_select_month_max.toString());
        if (this.widget_options.auto_select_month_max != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_month_max = month;

            this.throttled_update_page_widget();
        }
    }

    @Watch('max_month')
    private onchange_max_month() {
        if (!this.widget_options) {
            return;
        }

        const month = (this.max_month == null) ? null : parseInt(this.max_month.toString());
        if (this.widget_options.max_month != month) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_month = month;

            this.throttled_update_page_widget();
        }
    }

    @Watch('custom_filter_name')
    private onchange_custom_filter_name() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.custom_filter_name != this.custom_filter_name) {
            this.next_update_options = this.widget_options;
            this.next_update_options.custom_filter_name = this.custom_filter_name;

            this.throttled_update_page_widget();
        }
    }

    @Watch('is_month_cumulated_selected')
    private onchange_is_month_cumulated_selected() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.is_month_cumulated_selected != this.is_month_cumulated_selected) {
            this.next_update_options = this.widget_options;
            this.next_update_options.is_month_cumulated_selected = this.is_month_cumulated_selected;

            this.throttled_update_page_widget();
        }
    }

    @Watch('is_all_months_selected')
    private onchange_is_all_months_selected() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.is_all_months_selected != this.is_all_months_selected) {
            this.next_update_options = this.widget_options;
            this.next_update_options.is_all_months_selected = this.is_all_months_selected;

            this.throttled_update_page_widget();
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    private update_page_widget() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.$emit('onchange_page_widget', this.page_widget);
    }

    /**
     * load_all_months_page_widgets
     *  - Load all months page widgets (to be used in relative_to_other_filter_id)
     */
    private async load_all_months_page_widgets() {
        this.all_months_page_widgets = await DashboardPageWidgetVOManager.find_page_widgets_by_widget_name(
            this.page_widget.id,
            DashboardWidgetVO.WIDGET_NAME_monthfilter
        );
    }

    // /**
    //  * toggle_can_configure_auto_select_month_relative_mode
    //  */
    // private toggle_can_configure_auto_select_month_relative_mode(): void {
    //     this.can_configure_auto_select_month_relative_mode = !this.can_configure_auto_select_month_relative_mode;
    //     if (!this.can_configure_auto_select_month_relative_mode) {
    //         this.auto_select_month_min = 0;
    //         this.auto_select_month_max = 0;
    //     }
    // }

    /**
     * Handle Select All Change
     */
    private handle_all_months_selected_change(is_all_months_selected: boolean): void {
        this.is_all_months_selected = is_all_months_selected;
    }

    private mounted() {
        this.throttled_load_all_months_page_widgets();
    }


    /**
     * Handle Selected Month Change
     */
    private handle_selected_month_change(selected_months: { [month: number]: boolean }): void {
        this.selected_months = selected_months;
    }

    /**
     * Handle Cumulative Months Change
     */
    private handle_month_cumulated_change(is_month_cumulated_selected: boolean): void {
        // this.selected_months = selected_months;
        this.is_month_cumulated_selected = is_month_cumulated_selected;
    }

    private switch_hide_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { hide_filter: this.hide_filter }
            );
        }

        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;

        this.throttled_update_page_widget();
    }

    private switch_is_relative_to_other_filter() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { is_relative_to_other_filter: this.is_relative_to_other_filter }
            );
        }

        this.next_update_options.is_relative_to_other_filter = !this.next_update_options.is_relative_to_other_filter;

        this.throttled_update_page_widget();
    }

    private switch_month_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { month_relative_mode: this.month_relative_mode }
            );
        }

        this.next_update_options.month_relative_mode = !this.next_update_options.month_relative_mode;

        this.throttled_update_page_widget();
    }

    private switch_auto_select_month() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { auto_select_month: this.auto_select_month }
            );
        }

        this.next_update_options.auto_select_month = !this.next_update_options.auto_select_month;

        this.throttled_update_page_widget();
    }

    private switch_auto_select_month_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { auto_select_month_relative_mode: this.auto_select_month_relative_mode }
            );
        }

        this.next_update_options.auto_select_month_relative_mode = !this.next_update_options.auto_select_month_relative_mode;

        this.throttled_update_page_widget();
    }

    /**
     * toggle_is_month_cumulated
     * - Allow to the user to cumulate the months
     */
    private toggle_is_month_cumulated() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { is_month_cumulated_selected: this.is_month_cumulated_selected }
            );
        }

        this.next_update_options.is_month_cumulated_selected = !this.next_update_options.is_month_cumulated_selected;

        this.throttled_update_page_widget();
    }

    private switch_is_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { is_vo_field_ref: this.is_vo_field_ref }
            );
        }

        this.next_update_options.is_vo_field_ref = !this.next_update_options.is_vo_field_ref;

        this.throttled_update_page_widget();
    }

    private remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        this.throttled_update_page_widget();
    }

    /**
     * get_widget_options
     *
     * @returns MonthFilterWidgetOptionsVO
     */
    private get_widget_options(): MonthFilterWidgetOptionsVO {
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

    private add_field_ref(api_type_id: string, field_id: string) {
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

        this.throttled_update_page_widget();
    }

    /**
     * create_widget_options
     * - Return default widget options
     * @returns {MonthFilterWidgetOptionsVO}
     */
    private create_widget_options(
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

    // get other_filter_selected_months(): { [year: string]: boolean } {
    //     if (!this.relative_to_this_filter) {
    //         return null;
    //     }

    //     const other_filter_selected_months = this.relative_to_this_filter.selected_months;
    //     if (!other_filter_selected_months) {
    //         return null;
    //     }

    //     return other_filter_selected_months;
    // }

    // get other_filters_by_name(): { [filter_name: string]: DashboardPageWidgetVO } {
    //     if (!this.all_months_page_widgets) {
    //         return null;
    //     }

    //     const res: { [filter_name: string]: DashboardPageWidgetVO } = {};

    //     for (const i in this.all_months_page_widgets) {
    //         const month_page_widget = this.all_months_page_widgets[i];

    //         if (month_page_widget.id == this.page_widget.id) {
    //             continue;
    //         }

    //         // Only MonthFilterWidget (of the same type)
    //         if (month_page_widget.widget_id !== this.page_widget.widget_id) {
    //             continue;
    //         }

    //         if (!month_page_widget.json_options) {
    //             continue;
    //         }

    //         const other_filter_options = JSON.parse(month_page_widget.json_options) as MonthFilterWidgetOptionsVO;
    //         if (!other_filter_options) {
    //             continue;
    //         }

    //         if (other_filter_options.is_vo_field_ref) {
    //             if ((!other_filter_options.vo_field_ref) || (!other_filter_options.vo_field_ref.api_type_id) || (!other_filter_options.vo_field_ref.field_id)) {
    //                 continue;
    //             }

    //             const name = 'Widget ID:' + month_page_widget.id + ' : ' + other_filter_options.vo_field_ref.api_type_id + '.' + other_filter_options.vo_field_ref.field_id;
    //             if (res[name]) {
    //                 continue;
    //             }
    //             res[name] = month_page_widget;
    //         } else {
    //             if (!other_filter_options.custom_filter_name) {
    //                 continue;
    //             }

    //             const name = 'Widget ID:' + month_page_widget.id + ' : ' + other_filter_options.custom_filter_name;
    //             if (res[name]) {
    //                 continue;
    //             }
    //             res[name] = month_page_widget;
    //         }
    //     }

    //     return res;
    // }

    // get default_placeholder_translation(): string {
    //     return this.label('DOWFilterWidget.filter_placeholder');
    // }

    // get relative_to_this_filter(): MonthFilterWidgetComponent {
    //     if (!this.widget_options.auto_select_month_relative_mode) {
    //         return null;
    //     }

    //     if (!this.widget_options.is_relative_to_other_filter) {
    //         return null;
    //     }

    //     if (!this.widget_options.relative_to_other_filter_id) {
    //         return null;
    //     }

    //     return this.get_page_widgets_components_by_pwid[this.widget_options.relative_to_other_filter_id] as MonthFilterWidgetComponent;
    // }
}
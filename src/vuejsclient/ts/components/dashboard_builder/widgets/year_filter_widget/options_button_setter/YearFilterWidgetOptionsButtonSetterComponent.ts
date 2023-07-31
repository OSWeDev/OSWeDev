import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import YearFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/YearFilterWidgetManager';
import YearFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import YearFilterInputComponent from '../../../../year_filter_input/YearFilterInputComponent';
import YearFilterWidgetComponent from '../YearFilterWidgetComponent';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './YearFilterWidgetOptionsButtonSetterComponent.scss';

@Component({
    template: require('./YearFilterWidgetOptionsButtonSetterComponent.pug'),
    components: {
        Yearfilterinputcomponent: YearFilterInputComponent,
    }
})
export default class YearFilterWidgetOptionsButtonSetterComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO; // TODO: find the page_widget_id and then configure the widget_options

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    private next_update_options: YearFilterWidgetOptionsVO = null;

    private throttled_update_page_widget = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.update_page_widget.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private hide_filter: boolean = false;

    private year_relative_mode: boolean = true;

    private selected_years: { [year: number]: boolean } = {};

    // Is All Years Selected Toggle Button
    // - Shall be highlight or true when selected_years empty
    // - Shall be false when selected_years has at least one selected
    private is_all_years_selected: boolean = false;
    private force_selected_years_reset: boolean = false;

    private auto_select_year: boolean = null;
    private auto_select_year_relative_mode: boolean = null;

    private min_year: number = null;
    private max_year: number = null;

    private auto_select_year_min: number = null;
    private auto_select_year_max: number = null;

    private old_widget_options: YearFilterWidgetOptionsVO = null;
    private is_relative_to_other_filter: boolean = false;
    private relative_to_other_filter_id: number = null;

    private other_filter_selected_years: { [year: string]: boolean } = null;

    // Relative page widget (if relative_to_other_filter_id is set)
    private all_years_page_widgets: DashboardPageWidgetVO[] = null;

    // Relative page widget (if relative_to_other_filter_id is set)
    private relative_page_widget: DashboardPageWidgetVO = null;

    // Current filter may cumulate years
    private is_year_cumulated_selected: boolean = false;

    private can_configure_auto_select_year_relative_mode: boolean = false;

    private widget_options: YearFilterWidgetOptionsVO = null;

    private throttled_load_all_years_page_widgets = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_all_years_page_widgets.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private mounted() {
        this.throttled_load_all_years_page_widgets();
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

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        if (!this.widget_options) {
            // this.is_vo_field_ref = true;
            this.year_relative_mode = true;
            this.auto_select_year = true;
            this.auto_select_year_relative_mode = true;
            // this.custom_filter_name = null;
            this.min_year = null;
            this.max_year = null;
            this.auto_select_year_min = null;
            this.auto_select_year_max = null;
            this.relative_to_other_filter_id = null;
            this.is_relative_to_other_filter = false;
            this.hide_filter = false;
            // this.can_select_all = false;
            this.is_year_cumulated_selected = false;
            this.is_all_years_selected = false;
            return;
        }

        // this.is_vo_field_ref = this.widget_options.is_vo_field_ref;
        this.year_relative_mode = this.widget_options.year_relative_mode;
        this.auto_select_year = this.widget_options.auto_select_year;
        this.auto_select_year_relative_mode = this.widget_options.auto_select_year_relative_mode;
        // this.custom_filter_name = this.widget_options.custom_filter_name;
        this.min_year = (this.widget_options.min_year == null) ? null : this.widget_options.min_year;
        this.max_year = (this.widget_options.max_year == null) ? null : this.widget_options.max_year;
        this.auto_select_year_min = (this.widget_options.auto_select_year_min == null) ? null : this.widget_options.auto_select_year_min;
        this.auto_select_year_max = (this.widget_options.auto_select_year_max == null) ? null : this.widget_options.auto_select_year_max;
        this.relative_to_other_filter_id = this.widget_options.relative_to_other_filter_id;
        this.is_relative_to_other_filter = this.widget_options.is_relative_to_other_filter;
        this.hide_filter = this.widget_options.hide_filter;
        // this.can_select_all = this.widget_options.can_select_all;
        // this.is_year_cumulated_selected = this.widget_options.is_year_cumulated_selected;
        this.is_all_years_selected = this.widget_options.is_all_years_selected;

        this.selected_years = YearFilterWidgetManager.get_selected_years_from_widget_options(
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

    @Watch('min_year')
    private onchange_min_year() {
        if (!this.widget_options) {
            return;
        }

        let year = (this.min_year == null) ? null : parseInt(this.min_year.toString());
        if (this.widget_options.min_year != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.min_year = year;

            this.throttled_update_page_widget();
        }
    }

    @Watch('auto_select_year_min')
    private onchange_auto_select_year_min() {
        if (!this.widget_options) {
            return;
        }

        let year = (this.auto_select_year_min == null) ? null : parseInt(this.auto_select_year_min.toString());
        if (this.widget_options.auto_select_year_min != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_year_min = year;

            this.throttled_update_page_widget();
        }
    }

    @Watch('auto_select_year_max')
    private onchange_auto_select_year_max() {
        if (!this.widget_options) {
            return;
        }

        let year = (this.auto_select_year_max == null) ? null : parseInt(this.auto_select_year_max.toString());
        if (this.widget_options.auto_select_year_max != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.auto_select_year_max = year;

            this.throttled_update_page_widget();
        }
    }

    @Watch('max_year')
    private onchange_max_year() {
        if (!this.widget_options) {
            return;
        }

        let year = (this.max_year == null) ? null : parseInt(this.max_year.toString());
        if (this.widget_options.max_year != year) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_year = year;

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

    @Watch('is_all_years_selected')
    private onchange_is_all_years_selected() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.is_all_years_selected != this.is_all_years_selected) {
            this.next_update_options = this.widget_options;
            this.next_update_options.is_all_years_selected = this.is_all_years_selected;

            this.throttled_update_page_widget();
        }
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
     * load_all_years_page_widgets
     *  - Load all years page widgets (to be used in relative_to_other_filter_id)
     */
    private async load_all_years_page_widgets() {
        this.all_years_page_widgets = await DashboardPageWidgetVOManager.find_page_widgets_by_widget_name(
            this.page_widget.id,
            'yearfilter'
        );
    }

    /**
     * toggle_can_configure_auto_select_year_relative_mode
     */
    private toggle_can_configure_auto_select_year_relative_mode(): void {
        this.can_configure_auto_select_year_relative_mode = !this.can_configure_auto_select_year_relative_mode;
        if (!this.can_configure_auto_select_year_relative_mode) {
            this.auto_select_year_min = 0;
            this.auto_select_year_max = 0;
        }
    }

    /**
     * Handle Select All Change
     */
    private handle_all_years_selected_change(is_all_years_selected: boolean): void {
        this.is_all_years_selected = is_all_years_selected;
    }

    /**
     * Handle Selected Year Change
     */
    private handle_selected_year_change(selected_years: { [year: number]: boolean }): void {
        this.selected_years = selected_years;
    }

    /**
     * Handle Cumulative Years Change
     */
    private handle_year_cumulated_change(is_year_cumulated_selected: boolean): void {
        // this.selected_years = selected_years;
        this.is_year_cumulated_selected = is_year_cumulated_selected;
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

    private switch_year_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { year_relative_mode: this.year_relative_mode }
            );
        }

        this.next_update_options.year_relative_mode = !this.next_update_options.year_relative_mode;

        this.throttled_update_page_widget();
    }

    private switch_auto_select_year() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { auto_select_year: this.auto_select_year }
            );
        }

        this.next_update_options.auto_select_year = !this.next_update_options.auto_select_year;

        this.throttled_update_page_widget();
    }

    private switch_auto_select_year_relative_mode() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { auto_select_year_relative_mode: this.auto_select_year_relative_mode }
            );
        }

        this.next_update_options.auto_select_year_relative_mode = !this.next_update_options.auto_select_year_relative_mode;

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
     * @returns YearFilterWidgetOptionsVO
     */
    private get_widget_options(): YearFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: YearFilterWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as YearFilterWidgetOptionsVO;
                options = options ? new YearFilterWidgetOptionsVO().from(options) : null;
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

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        this.throttled_update_page_widget();
    }

    /**
     * create_widget_options
     * - Return default widget options
     * @returns {YearFilterWidgetOptionsVO}
     */
    private create_widget_options(
        props?: Partial<YearFilterWidgetOptionsVO>
    ): YearFilterWidgetOptionsVO {

        return new YearFilterWidgetOptionsVO(
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

    get other_filters_by_name(): { [filter_name: string]: DashboardPageWidgetVO } {
        if (!this.all_years_page_widgets) {
            return null;
        }

        let res: { [filter_name: string]: DashboardPageWidgetVO } = {};

        for (let i in this.all_years_page_widgets) {
            let year_page_widget = this.all_years_page_widgets[i];

            if (year_page_widget.id == this.page_widget.id) {
                continue;
            }

            // Only YearFilterWidget (of the same type)
            if (year_page_widget.widget_id !== this.page_widget.widget_id) {
                continue;
            }

            if (!year_page_widget.json_options) {
                continue;
            }

            const other_filter_options = JSON.parse(year_page_widget.json_options) as YearFilterWidgetOptionsVO;
            if (!other_filter_options) {
                continue;
            }

            if (!!other_filter_options.is_vo_field_ref) {
                if ((!other_filter_options.vo_field_ref) || (!other_filter_options.vo_field_ref.api_type_id) || (!other_filter_options.vo_field_ref.field_id)) {
                    continue;
                }

                const name = 'Widget ID:' + year_page_widget.id + ' : ' + other_filter_options.vo_field_ref.api_type_id + '.' + other_filter_options.vo_field_ref.field_id;
                if (!!res[name]) {
                    continue;
                }
                res[name] = year_page_widget;
            } else {
                if (!other_filter_options.custom_filter_name) {
                    continue;
                }

                const name = 'Widget ID:' + year_page_widget.id + ' : ' + other_filter_options.custom_filter_name;
                if (!!res[name]) {
                    continue;
                }
                res[name] = year_page_widget;
            }
        }

        return res;
    }

    get default_placeholder_translation(): string {
        return this.label('DOWFilterWidget.filter_placeholder');
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: YearFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get relative_to_this_filter(): YearFilterWidgetComponent {
        if (!this.widget_options.auto_select_year_relative_mode) {
            return null;
        }

        if (!this.widget_options.is_relative_to_other_filter) {
            return null;
        }

        if (!this.widget_options.relative_to_other_filter_id) {
            return null;
        }

        return this.get_page_widgets_components_by_pwid[this.widget_options.relative_to_other_filter_id] as YearFilterWidgetComponent;
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

    get years(): string[] {
        return YearFilterWidgetManager.get_available_years_from_widget_options(
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

}
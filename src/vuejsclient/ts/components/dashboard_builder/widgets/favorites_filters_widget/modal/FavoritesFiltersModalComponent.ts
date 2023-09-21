import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import MonthFilterWidgetOptionsButtonSetterComponent from '../../month_filter_widget/options_button_setter/MonthFilterWidgetOptionsButtonSetterComponent';
import YearFilterWidgetOptionsButtonSetterComponent from '../../year_filter_widget/options_button_setter/YearFilterWidgetOptionsButtonSetterComponent';
import IReadableFieldFilters from '../../../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters';
import IFavoritesFiltersOptions from '../../../../../../../shared/modules/DashboardBuilder/interfaces/IFavoritesFiltersOptions';
import FieldFiltersVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/FieldFiltersVOHandler';
import DashboardPageWidgetVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import VOFieldRefVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import IExportFrequency from '../../../../../../../shared/modules/DashboardBuilder/interfaces/IExportFrequency';
import FavoritesFiltersWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import ExportContextQueryToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import MonthFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import YearFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueAppController from '../../../../../../VueAppController';
import VueComponentBase from '../../../../VueComponentBase';
import './FavoritesFiltersModalComponent.scss';

export enum ExportFrequencyGranularity {
    DAY = "day",
    MONTH = "month",
    YEAR = "year",
}

export const ExportFrequencyGranularityLabel: { [granularity in ExportFrequencyGranularity]: string } = {
    [ExportFrequencyGranularity.DAY]: 'label.day',
    [ExportFrequencyGranularity.MONTH]: 'label.month',
    [ExportFrequencyGranularity.YEAR]: 'label.year',
};

// TODO: load all configurable dates page_widgets of the page
// TODO: the FavoritesFiltersWidgetOptionsVO should have a property to know if we should refer to its dates configuration or not (while exporting)
// TODO: If can_configure_date_filters is true, we should load the dates configuration of the page_widget and disable the field_filters of those dates page_widgets
// TODO: Find a way to deduct the dates custom configs while click on MonthFilterInputComponent or YearFilterInputComponent

@Component({
    template: require('./FavoritesFiltersModalComponent.pug'),
    components: {
        Monthfilterwidgetoptionsbuttonsettercomponent: MonthFilterWidgetOptionsButtonSetterComponent,
        Yearfilterwidgetoptionsbuttonsettercomponent: YearFilterWidgetOptionsButtonSetterComponent,
    }
})
export default class FavoritesFiltersModalComponent extends VueComponentBase {

    private modal_initialized: boolean = false;

    private dashboard_page: DashboardPageVO = null;
    private page_widget: DashboardPageWidgetVO = null;

    private is_modal_open: boolean = false;
    private active_tab_view: string = 'selection_tab';
    private exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = null;

    private form_errors: string[] = [];

    private favorites_filters: FavoritesFiltersVO = null;

    // Favorites filters name
    private favorites_filters_name: string = null;

    // Favorites filters behaviors options
    private overwrite_active_field_filters: boolean = true;

    private is_export_planned: boolean = false;

    // Depend on if the the user can modify dates filters parameters|configuration for the export
    private is_field_filters_fixed_dates: boolean = true;

    private export_frequency: IExportFrequency = { every: null, granularity: null, day_in_month: null };

    private selected_export_frequency_granularity: {
        label?: string, value: 'day' | 'month' | 'year'
    } = { label: null, value: null }; // e.g. day, month, year

    private selected_favorite_field_filters: FieldFiltersVO = null;
    private selected_exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = null;

    private selectionnable_active_field_filters: FieldFiltersVO = {};
    private readable_field_filters: { [label: string]: IReadableFieldFilters } = {};

    // all page_widgets of type dates (month, year, etc.) that are on the current dashboard page
    private dates_page_widgets_by_field_id: { [field_id: string]: { yearfilter?: DashboardPageWidgetVO, monthfilter?: DashboardPageWidgetVO } } = {};

    // dates page_widgets (month, year, etc.) where we can update the custom configs
    private dates_page_widgets_custom_options_by_field_id: { [field_id: string]: { yearfilter: DashboardPageWidgetVO, monthfilter: DashboardPageWidgetVO } } = {};

    private widget_options: FavoritesFiltersWidgetOptionsVO = null;

    private on_validation_callback: (props: Partial<FavoritesFiltersVO>) => Promise<void> = null;
    private on_close_callback: (props?: Partial<FavoritesFiltersVO>) => Promise<void> = null;
    private on_delete_callback: (props?: Partial<FavoritesFiltersVO>) => Promise<void> = null;

    private throttled_load_readable_field_filters = ThrottleHelper.declare_throttle_without_args(
        this.load_readable_field_filters.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_all_dates_page_widgets = ThrottleHelper.declare_throttle_without_args(
        this.load_all_dates_page_widgets.bind(this),
        50,
        { leading: false, trailing: true }
    );

    /**
     * Open Modal For Creation
     *  - Open modal to create a new favorites_filters
     *
     * @param props
     * @param validation_callback
     * @return {void}
     */
    public open_modal_for_creation(
        props: {
            dashboard_page: DashboardPageVO,
            page_widget: DashboardPageWidgetVO,
            selectionnable_active_field_filters: FieldFiltersVO,
            exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO },
        } = null,
        validation_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
        close_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>
    ): void {
        this.is_modal_open = true;

        this.dashboard_page = props.dashboard_page;
        this.page_widget = props.page_widget;

        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_active_field_filters = props?.selectionnable_active_field_filters ?? null;
        // We must set all selected by default
        this.selected_favorite_field_filters = props?.selectionnable_active_field_filters ?? null;

        // Exportable data settings
        this.selected_exportable_data = props?.exportable_data ?? null;
        this.exportable_data = props?.exportable_data ?? null;

        if (typeof validation_callback == 'function') {
            this.on_validation_callback = validation_callback;
        }

        if (typeof close_callback == 'function') {
            this.on_close_callback = close_callback;
        }
    }

    /**
     * Open Modal For Update
     *  - Open modal to update a favorites_filters
     *
     * @param {FavoritesFiltersVO} favorites_filters
     * @param {(props?: Partial<FavoritesFiltersVO>) => Promise<void>} validation_callback
     */
    public open_modal_for_update(
        props: {
            dashboard_page: DashboardPageVO,
            page_widget: DashboardPageWidgetVO,
            selectionnable_active_field_filters: FieldFiltersVO,
            exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO },
            favorites_filters: FavoritesFiltersVO,
        } = null,
        validation_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
        close_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
        delete_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
    ): void {

        this.dashboard_page = props.dashboard_page;
        this.page_widget = props.page_widget;

        this.favorites_filters = props?.favorites_filters ?? null;

        this.is_modal_open = true;

        // Load the modal data from the favorites_filters
        this.load_modal_data_from_favorite_filters();

        // Selectionnable fields filters from the page_widget
        this.selectionnable_active_field_filters = props.selectionnable_active_field_filters ? cloneDeep(props.selectionnable_active_field_filters) : null;
        // TODO: find the actual exportable data of the current dashboard page
        this.exportable_data = props?.exportable_data ?? null;

        if (typeof validation_callback == 'function') {
            this.on_validation_callback = validation_callback;
        }

        if (typeof close_callback == 'function') {
            this.on_close_callback = close_callback;
        }

        if (typeof delete_callback == 'function') {
            this.on_delete_callback = delete_callback;
        }
    }

    /**
     * On mounted
     *  - Happen on component mount
     *
     * @return {void}
     */
    private mounted(): void {
        this.$nextTick(async () => {
            if (!this.modal_initialized) {
                this.modal_initialized = true;
                $("#favorites_filters_modal_component").on("hidden.bs.modal", () => {
                    this.is_modal_open = false;
                });
            }
        });
    }

    /**
     * Watch on page_widget
     */
    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget() {
        if (!this.page_widget) {
            return;
        }

        this.widget_options = this.get_widget_options();

        // Throttle load_all_dates_page_widgets
        this.throttled_load_all_dates_page_widgets();
    }

    /**
     * Watch on selectionnable_active_field_filters
     *  - Happen on component each time selectionnable_active_field_filters changes
     *  - Load readable_field_filters
     */
    @Watch('selectionnable_active_field_filters', { immediate: true })
    private async onchange_selectionnable_active_field_filters() {
        // Throttle load_readable_field_filters
        this.throttled_load_readable_field_filters();
    }

    /**
     * Watch on is_field_filters_fixed_dates
     *  - Happen on component each time is_field_filters_fixed_dates changes
     *  - Load readable_field_filters
     */
    @Watch('is_field_filters_fixed_dates', { immediate: true })
    private async onchange_is_field_filters_fixed_dates() {
        // Throttle load_readable_field_filters
        this.throttled_load_readable_field_filters();

        this.init_dates_page_widgets_custom_options_by_field_id();
    }

    /**
     * Watch on is_modal_open
     *  - Happen on component each time is_modal_open changes
     *
     * @returns {void}
     */
    @Watch('is_modal_open', { immediate: true })
    private is_modal_open_watcher(): void {
        this.handle_modal_state();
    }

    /**
     * Watch on selected_export_frequency_granularity
     *  - Happen on component each time selected_export_frequency_granularity changes
     *
     * @returns {void}
     */
    @Watch('selected_export_frequency_granularity', { immediate: true })
    private onchange_selected_export_frequency_granularity_watcher(): void {
        this.export_frequency.granularity = this.selected_export_frequency_granularity?.value ?? null;

        if (this.selected_export_frequency_granularity?.value != 'month') {
            this.export_frequency.day_in_month = null;
        }
    }

    /**
     * Watch on can_configure_date_filters
     *
     * @returns {void}
     */
    @Watch('can_configure_date_filters', { immediate: true })
    private onchange_can_configure_date_filters(): void {
        if (this.can_configure_date_filters) {
            // TODO: load the dates configuration of the page_widget
            // TODO: Display to the user the date widgets for clickables configuration
            // TODO: remove date context_filters from the readable_field_filters
        } else {
            // TODO: keep the date context_filters of the entered field_filters
        }
    }

    /**
     * load_modal_data_from_favorite_filters
     *
     * @returns {void}
     */
    private load_modal_data_from_favorite_filters(): void {
        const favorites_filters: FavoritesFiltersVO = this.favorites_filters ?? null;

        // Favorites filters name
        this.favorites_filters_name = favorites_filters.name;

        // Favorites filters behaviors options
        this.overwrite_active_field_filters = favorites_filters.options?.overwrite_active_field_filters ?? true;
        this.is_field_filters_fixed_dates = favorites_filters.options?.is_field_filters_fixed_dates ?? true;

        // Dates page_widgets (month, year, etc.) where we can update the custom configs
        for (const field_id in favorites_filters.options?.custom_dates_widgets_options_by_field_id) {
            const yearfilter = favorites_filters.options?.custom_dates_widgets_options_by_field_id[field_id]?.yearfilter;
            const monthfilter = favorites_filters.options?.custom_dates_widgets_options_by_field_id[field_id]?.monthfilter;

            if (!yearfilter || !monthfilter) {
                continue;
            }

            this.dates_page_widgets_custom_options_by_field_id[field_id] = {
                monthfilter: new DashboardPageWidgetVO().from_widget_options(monthfilter),
                yearfilter: new DashboardPageWidgetVO().from_widget_options(yearfilter),
            };
        }

        // Fields filters settings
        // Modal selectionnable filters
        this.selected_favorite_field_filters = favorites_filters.field_filters;

        // Export settings
        this.is_export_planned = favorites_filters.export_params?.is_export_planned ?? false;
        this.export_frequency = favorites_filters.export_params?.export_frequency ?? {
            every: null, granularity: null, day_in_month: null
        };

        const export_frequency_granularity = this.export_frequency.granularity ?? null;
        if (export_frequency_granularity) {
            this.selected_export_frequency_granularity = {
                label: ExportFrequencyGranularityLabel[export_frequency_granularity],
                value: export_frequency_granularity
            };
        }

        // Exportable data settings
        this.selected_exportable_data = favorites_filters.export_params?.exportable_data ?? null;
    }

    /**
     * handle_change_monthfilter_page_widget
     *  - Happen on component each time a monthfilter page_widget changes
     *
     * @param {string} field_id
     * @param {DashboardPageWidgetVO} page_widget
     */
    private handle_change_monthfilter_page_widget(field_id: string, page_widget: DashboardPageWidgetVO): void {
        this.dates_page_widgets_by_field_id[field_id].monthfilter = page_widget;
    }

    /**
     * handle_change_yearfilter_page_widget
     *  - Happen on component each time a yearfilter page_widget changes
     *
     * @param {string} field_id
     * @param {DashboardPageWidgetVO} page_widget
     */
    private handle_change_yearfilter_page_widget(field_id: string, page_widget: DashboardPageWidgetVO): void {
        this.dates_page_widgets_by_field_id[field_id].yearfilter = page_widget;
    }

    /**
     * init_dates_page_widgets_custom_options_by_field_id
     *  - Init the dates_page_widgets_custom_options_by_field_id depending on the is_field_filters_fixed_dates
     */
    private init_dates_page_widgets_custom_options_by_field_id(): void {
        if (this.is_field_filters_fixed_dates) {
            this.dates_page_widgets_custom_options_by_field_id = {};
        } else {

            // Load the dates default configs of the page_widget
            for (const field in this.dates_page_widgets_by_field_id) {

                // Find the yearfilter page_widget of the field
                const yearfilter = this.dates_page_widgets_by_field_id[field].yearfilter;

                // Find the monthfilter page_widget of the field
                const monthfilter = this.dates_page_widgets_by_field_id[field].monthfilter;

                if (
                    !yearfilter ||
                    !monthfilter
                ) {
                    continue;
                }

                const monthfilter_options = JSON.parse(monthfilter.json_options) as MonthFilterWidgetOptionsVO;
                const yearfilter_options = JSON.parse(yearfilter.json_options) as YearFilterWidgetOptionsVO;

                if (
                    monthfilter_options?.hide_filter ||
                    yearfilter_options?.hide_filter
                ) {
                    continue;
                }

                // Set the dates default config to custumize
                this.dates_page_widgets_custom_options_by_field_id[field] = {
                    monthfilter,
                    yearfilter,
                };
            }
        }
    }

    /**
     * Handle Close Modal
     *
     * @return {Promise<void>}
     */
    private async handle_close_modal(): Promise<void> {
        this.is_modal_open = false;
    }

    /**
     * Handle Save
     *  - Save active dashboard filters for the current user
     *
     * @return {Promise<void>}
     */
    private async handle_save(): Promise<void> {
        if (!this.is_form_valid()) {
            return;
        }

        if (!(typeof this.on_validation_callback === 'function')) {
            return;
        }

        const is_export_planned = this.is_export_planned;

        let custom_dates_widgets_options_by_field_id = null;

        if (!this.is_field_filters_fixed_dates) {
            custom_dates_widgets_options_by_field_id = {};

            for (const field_id in this.dates_page_widgets_custom_options_by_field_id) {
                const yearfilter = this.dates_page_widgets_custom_options_by_field_id[field_id]?.yearfilter;
                const monthfilter = this.dates_page_widgets_custom_options_by_field_id[field_id]?.monthfilter;

                if (
                    !yearfilter ||
                    !monthfilter
                ) {
                    continue;
                }

                const monthfilter_options = JSON.parse(monthfilter.json_options) as MonthFilterWidgetOptionsVO;
                const yearfilter_options = JSON.parse(yearfilter.json_options) as YearFilterWidgetOptionsVO;

                custom_dates_widgets_options_by_field_id[field_id] = {
                    monthfilter: monthfilter_options,
                    yearfilter: yearfilter_options,
                };
            }
        }

        const options: IFavoritesFiltersOptions = {
            overwrite_active_field_filters: this.overwrite_active_field_filters,
            is_field_filters_fixed_dates: this.is_field_filters_fixed_dates,
            custom_dates_widgets_options_by_field_id,
        };

        const export_frequency: IExportFrequency = is_export_planned ? this.export_frequency : null;

        const exportable_data: {
            [title_name_code: string]: ExportContextQueryToXLSXParamVO
        } = is_export_planned ? this.selected_exportable_data : null;

        for (const title_name_code in exportable_data) {
            const exportable = exportable_data[title_name_code];

            if (!exportable) {
                continue;
            }

            exportable.target_user_id = VueAppController.getInstance().data_user.id; // TODO: find another way to get the target_user_id
            exportable.export_options = {
                ...exportable.export_options,
                send_email_with_export_notification: this.send_email_with_export_notification,
            };
        }

        const favorites_filters: FavoritesFiltersVO = new FavoritesFiltersVO().from({
            ...this.favorites_filters,
            field_filters: this.selected_favorite_field_filters,
            name: this.favorites_filters_name,
            export_params: {
                ...this.favorites_filters?.export_params,
                is_export_planned,
                export_frequency,
                exportable_data,
            },
            options,
        });

        await this.on_validation_callback(favorites_filters);

        this.is_modal_open = false;
    }

    /**
     * Handle Delete
     * - Delete the current favorites_filters
     *
     * @return {Promise<void>}
     */
    private handle_delete(): Promise<void> {
        if (!(typeof this.on_delete_callback === 'function')) {
            return;
        }

        this.on_delete_callback(this.favorites_filters);

        this.is_modal_open = false;
    }

    /**
     * Check Form Valid
     *
     * @returns boolean
     */
    private is_form_valid(): boolean {
        this.form_errors = [];

        if (!(this.favorites_filters_name?.length > 0)) {
            this.form_errors.push(this.label('dashboard_viewer.favorites_filters.name_required'));
        }

        if (this.is_export_planned) {
            if (!(this.export_frequency.every != null)) {
                this.form_errors.push(this.label('dashboard_viewer.favorites_filters.export_frequency_every_required'));
            }

            if (!(this.export_frequency.granularity?.length > 0)) {
                this.form_errors.push(this.label('dashboard_viewer.favorites_filters.export_frequency_granularity_required'));
            }

            if (this.export_frequency.granularity === 'month' && !(this.export_frequency.day_in_month > 0)) {
                this.form_errors.push(this.label('dashboard_viewer.favorites_filters.export_frequency_day_in_month_required'));
            }

            if (!(Object.keys(this.selected_exportable_data).length > 0)) {
                this.form_errors.push(this.label('dashboard_viewer.favorites_filters.selected_exportable_data_required'));
            }
        }

        return !(this.form_errors?.length > 0);
    }

    /**
     * Toggle Modal Open
     *  - Swich modal from show to hide (vice versa)
     *
     * @return {void}
     */
    private toggle_modal_open(): void {
        this.is_modal_open = !this.is_modal_open;
    }

    /**
     * Handle Modal State
     *  - Manage modal depending on its state
     *
     * @return {<void>}
     */
    private handle_modal_state(): void {
        if (this.is_modal_open) {
            $('#favorites_filters_modal_component').modal('show');
        } else {
            $('#favorites_filters_modal_component').modal('hide');

            if (typeof this.on_close_callback === 'function') {
                this.on_close_callback();
            }

            this.reset_modal();
        }
    }

    /**
     * Reset Modal
     *
     * @return {void}
     */
    private reset_modal(): void {
        this.form_errors = [];
        this.active_tab_view = 'selection_tab';
        this.export_frequency = { every: null, granularity: null, day_in_month: null };
        this.selected_export_frequency_granularity = { label: null, value: null };
        this.dates_page_widgets_custom_options_by_field_id = {};
        this.dates_page_widgets_by_field_id = {};
        this.selected_favorite_field_filters = null;
        this.is_field_filters_fixed_dates = true;
        this.selected_exportable_data = null;
        this.favorites_filters_name = null;
        this.favorites_filters = null;
        this.dashboard_page = null;
        this.page_widget = null;
        this.reset_export_plan();
    }

    /**
     * Reset Export Plan
     *
     * @return {void}
     */
    private reset_export_plan(): void {
        this.is_export_planned = false;
        this.selected_export_frequency_granularity = null;

        this.export_frequency.day_in_month = null;
        this.export_frequency.granularity = null;
        this.export_frequency.every = null;
    }

    /**
     * Is Active Field Filter Selected
     *
     * @param {IReadableFieldFilters} [props]
     * @returns {boolean}
     */
    private is_field_filter_selected(props: IReadableFieldFilters): boolean {
        if (!props?.vo_field_ref) {
            return false;
        }

        const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
            { vo_field_ref: props.vo_field_ref }
        );

        if (!this.selected_favorite_field_filters) {
            return false;
        }

        return !FieldFiltersVOHandler.is_field_filters_empty(
            vo_field_ref,
            this.selected_favorite_field_filters
        );
    }

    /**
     * Handle Toggle Select Favorite Filter
     *  - Select or unselect from favorites the given active filter props
     *
     * @param {IReadableFieldFilters} [props]
     * @returns {void}
     */
    private toggle_select_favorite_filter(props: IReadableFieldFilters): void {
        const vo_field_ref = props.vo_field_ref;

        let tmp_selected_field_filters = cloneDeep(this.selected_favorite_field_filters);
        const active_field_filters = cloneDeep(this.selectionnable_active_field_filters);

        if (!tmp_selected_field_filters) {
            tmp_selected_field_filters = {};
        }

        if (this.is_field_filter_selected(props)) {
            delete tmp_selected_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id];

        } else {
            if (!FieldFiltersVOManager.is_field_filters_empty(props, active_field_filters)) {
                const context_filter = active_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id];

                tmp_selected_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    tmp_selected_field_filters,
                    vo_field_ref,
                    context_filter
                );
            }
        }

        this.selected_favorite_field_filters = tmp_selected_field_filters;
    }

    /**
     * Is Exportable Data Selected
     *
     * @param {string} [title_name_code]
     * @returns {boolean}
     */
    private is_exportable_data_selected(title_name_code: string): boolean {

        if (!this.selected_exportable_data) {
            return false;
        }

        return this.selected_exportable_data[title_name_code] != null;
    }

    /**
     * Can Add Export Frequency Day In Month
     *
     * @return {boolean}
     */
    private can_add_export_frequency_day_in_month(): boolean {
        return this.selected_export_frequency_granularity?.value == 'month';
    }

    /**
     * Handle Toggle Select Exportable Data
     *  - Select or unselect from Exportable Data the given props
     *
     * @param {string} [title_name_code]
     * @returns {void}
     */
    private toggle_select_exportable_data(title_name_code: string): void {
        let tmp_selected_exportable_data = cloneDeep(this.selected_exportable_data);

        const exportable_data = this.exportable_data;

        if (!tmp_selected_exportable_data) {
            tmp_selected_exportable_data = {};
        }

        if (this.is_exportable_data_selected(title_name_code)) {
            delete tmp_selected_exportable_data[title_name_code];
        } else {
            tmp_selected_exportable_data[title_name_code] = exportable_data[title_name_code];
        }

        this.selected_exportable_data = tmp_selected_exportable_data;
    }

    /**
     * Handle Toggle Is Export Planned
     *
     * @returns {void}
     */
    private toggle_is_export_planned(): void {
        this.is_export_planned = !this.is_export_planned;

        if (!this.is_export_planned) {
            this.reset_export_plan();
        }
    }

    /**
     * Handle Toggle Is Export Planned
     *
     * @returns {void}
     */
    private toggle_overwrite_active_field_filters(): void {
        this.overwrite_active_field_filters = !this.overwrite_active_field_filters;
    }

    /**
     * toggle_is_field_filters_fixed_dates
     *
     * @returns {void}
     */
    private toggle_is_field_filters_fixed_dates(): void {
        this.is_field_filters_fixed_dates = !this.is_field_filters_fixed_dates;
    }

    /**
     * Set Active Tab View
     *
     * @param {string} [tab_view]
     */
    private set_active_tab_view(tab_view: string): void {
        this.active_tab_view = tab_view;
    }

    /**
     * Get Translation By VO Field Ref Name Code Text
     *
     * @param {string} name_code_text
     * @returns {string}
     */
    private get_translation_by_vo_field_ref_name_code_text(name_code_text: string): string {
        let translation: string = VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS[name_code_text];

        if (!translation) {
            translation = name_code_text;
        }

        return translation;
    }

    /**
     * Get Readable Active Field Filters HMI
     *  - For each selected active field filters get as Human readable filters
     *
     * @return {Promise<{ [translatable_field_filters_code: string]: IReadableFieldFilters }>}
     */
    private async load_readable_field_filters(): Promise<{ [label: string]: IReadableFieldFilters }> {
        const active_field_filters = cloneDeep(this.selectionnable_active_field_filters);

        const readable_field_filters: { [label: string]: IReadableFieldFilters } = {};

        // Get the available readable field filters from the active field filters
        const available_readable_field_filters = await FieldFiltersVOManager.create_readable_filters_text_from_field_filters(
            active_field_filters,
            this.dashboard_page?.id,
        );

        // If is_field_filters_fixed_dates is false,
        // we should not keep them in the readable_field_filters
        for (const label in available_readable_field_filters) {
            const readable_field_filter = available_readable_field_filters[label];

            const vo_field_ref = readable_field_filter.vo_field_ref;

            if (!this.is_field_filters_fixed_dates) {
                // Find Date Widget by vo_field_ref

                const dates_page_widgets = this.dates_page_widgets_by_field_id[vo_field_ref.field_id];

                if (
                    dates_page_widgets?.monthfilter ||
                    dates_page_widgets?.yearfilter
                ) {
                    continue;
                }
            }

            readable_field_filters[label] = readable_field_filter;
        }

        this.readable_field_filters = readable_field_filters;

        return readable_field_filters;
    }

    /**
     * load_all_dates_page_widgets
     * - Load all page_widgets of type dates
     *
     * @returns {Promise<void>}
     */
    private async load_all_dates_page_widgets(): Promise<void> {
        if (!this.dashboard_page) {
            return;
        }

        // Year filters page_widgets
        const page_widgets_yearfilter = await DashboardPageWidgetVOManager.find_page_widgets_by_widget_name(
            this.dashboard_page.id,
            DashboardWidgetVO.WIDGET_NAME_yearfilter
        );

        // Month filters page_widgets
        const page_widgets_monthfilter = await DashboardPageWidgetVOManager.find_page_widgets_by_widget_name(
            this.dashboard_page.id,
            DashboardWidgetVO.WIDGET_NAME_monthfilter
        );

        // Merge the page_widgets_yearfilter and page_widgets_monthfilter
        const page_widgets_dates = [
            ...page_widgets_monthfilter,
            ...page_widgets_yearfilter,
        ];

        // Get widget_types for yearfilter and monthfilter
        const widgets_types = await WidgetOptionsVOManager.find_all_sorted_widgets_types();

        // Classify the page_widgets by vo_field_ref.field_id
        for (const key in page_widgets_dates) {
            const page_widgets_date = page_widgets_dates[key];

            const widget_type = widgets_types.find((wt) => wt.id == page_widgets_date.widget_id);

            const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                JSON.parse(page_widgets_date.json_options)
            );

            // Classify the page_widgets by vo_field_ref.field_id e.g. Dates
            const field_id = vo_field_ref.field_id;

            // Init dates_page_widgets_by_field_id
            if (!this.dates_page_widgets_by_field_id[field_id]) {
                this.dates_page_widgets_by_field_id[field_id] = {};
            }

            if (widget_type.name == DashboardWidgetVO.WIDGET_NAME_yearfilter) {
                this.dates_page_widgets_by_field_id[field_id].yearfilter = page_widgets_date;
            }

            if (widget_type.name == DashboardWidgetVO.WIDGET_NAME_monthfilter) {
                this.dates_page_widgets_by_field_id[field_id].monthfilter = page_widgets_date;
            }
        }
    }

    /**
     * Get widget_options
     *
     * @return {FavoritesFiltersWidgetOptionsVO}
     */
    private get_widget_options(): FavoritesFiltersWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: FavoritesFiltersWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FavoritesFiltersWidgetOptionsVO;
                options = options ? new FavoritesFiltersWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Get Frequency Granularity Options
     *
     * @return {Array<{ label: string, value: string }>}
     */
    get export_frequency_granularity_options(): Array<{ label: string, value: string }> {
        const options: Array<{ label: string, value: string }> = [];

        for (const key in ExportFrequencyGranularityLabel) {
            options.push({ label: ExportFrequencyGranularityLabel[key], value: key });
        }

        return options;
    }

    get can_configure_export(): boolean {
        if (!this.widget_options) {
            return false;
        }

        return this.widget_options?.can_configure_export ?? false;
    }

    get can_configure_date_filters(): boolean {
        if (!this.widget_options) {
            return false;
        }

        return this.widget_options?.can_configure_date_filters ?? false;
    }

    get send_email_with_export_notification(): boolean {
        if (!this.widget_options) {
            return false;
        }

        return this.widget_options?.send_email_with_export_notification ?? false;
    }

    /**
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }
}
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import VueComponentBase from '../../../../VueComponentBase';
import ExportContextQueryToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import DashboardFavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardFavoritesFiltersVO';
import { ContextFilterVOHandler } from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import './SaveFavoritesFiltersModalComponent.scss';
import { cloneDeep } from 'lodash';

export interface IReadableActiveFieldFilters {
    readable_active_field_filters: string;
    filter: ContextFilterVO;
    path: { api_type_id: string, field_id: string };
}

@Component({
    template: require('./SaveFavoritesFiltersModalComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersModalComponent extends VueComponentBase {

    private modal_initialized: boolean = false;

    private is_modal_open: boolean = false;
    private active_tab_view: string = 'selection_tab';
    private exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = null;

    private form_errors: string[] = [];

    private favorites_filters_name: string = null;
    private is_export_planned: boolean = false;

    private export_frequency_every: string = null;       // 1, 3, e.g. 1 day, 3 months
    private export_frequency_day_in_month: string | null = null;  // day in the month e.g. every 3 months at day 15

    private tmp_export_frequency_granularity: { label: string, value: 'day' | 'month' | 'year' } = null; // e.g. day, month, year
    private export_frequency_granularity_options: Array<{ label: string, value: string }> = [
        { label: 'label.day', value: 'day' },
        { label: 'label.month', value: 'month' },
        { label: 'label.year', value: 'year' }
    ];

    private selected_favorite_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;
    private selected_exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = null;

    private selectionnable_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

    private on_validation_callback: (props: Partial<DashboardFavoritesFiltersVO>) => Promise<void> = null;

    /**
     * Handle Open Modal
     *
     * @param props
     * @param validation_callback
     * @return {void}
     */
    public open_modal(
        props: {
            selectionnable_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
            exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO },
        } = null,
        validation_callback?: (props?: Partial<DashboardFavoritesFiltersVO>) => Promise<void>
    ): void {
        this.is_modal_open = true;

        // Modal selectionnable filters
        this.selectionnable_active_field_filters = props?.selectionnable_active_field_filters ?? null;
        // We must set all selected by default
        this.selected_favorite_field_filters = props?.selectionnable_active_field_filters ?? null;
        this.selected_exportable_data = props?.exportable_data ?? null;
        this.exportable_data = props?.exportable_data ?? null;

        if (typeof validation_callback == 'function') {
            this.on_validation_callback = validation_callback;
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
                $("#save_favorites_filters_modal_component").on("hidden.bs.modal", () => {
                    this.is_modal_open = false;
                });
            }
        });
    }

    /**
     * Watch on is_modal_open
     *  - Happen on component each time is_modal_open changes
     *
     * @returns {void}
     */
    @Watch('is_modal_open')
    private is_modal_open_watcher(): void {
        this.handle_modal_state();
    }

    /**
     * Watch on tmp_export_frequency_granularity
     *  - Happen on component each time tmp_export_frequency_granularity changes
     *
     * @returns {void}
     */
    @Watch('tmp_export_frequency_granularity')
    private tmp_export_frequency_granularity_watcher(): void {
        if (this.tmp_export_frequency_granularity?.value != 'month') {
            this.export_frequency_day_in_month = null;
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
        if (!this.check_form_valid()) {
            return;
        }

        if (typeof this.on_validation_callback === 'function') {

            const is_export_planned = this.is_export_planned;

            const export_frequency = is_export_planned ? {
                day_in_month: (this.export_frequency_day_in_month?.length > 0) ? parseInt(this.export_frequency_day_in_month) : null,
                every: (this.export_frequency_every?.length > 0) ? parseInt(this.export_frequency_every) : null,
                granularity: this.tmp_export_frequency_granularity?.value,
            } : null;

            const exportable_data = is_export_planned ? this.selected_exportable_data : null;

            await this.on_validation_callback({
                export_params: {
                    is_export_planned,
                    export_frequency,
                    exportable_data,
                },
                field_filters: this.selected_favorite_field_filters,
                name: this.favorites_filters_name,
            });
        }

        this.is_modal_open = false;
    }

    /**
     * Check Form Valid
     *
     * @returns boolean
     */
    private check_form_valid(): boolean {
        this.form_errors = [];

        if (!(this.favorites_filters_name?.length > 0)) {
            this.form_errors.push(this.label('dashboard_viewer.favorites_filters.name_required'));
        }

        if (this.is_export_planned) {
            if (!(this.export_frequency_every?.length > 0)) {
                this.form_errors.push(this.label('dashboard_viewer.favorites_filters.export_frequency_every_required'));
            }

            if (!(this.tmp_export_frequency_granularity?.value.length > 0)) {
                this.form_errors.push(this.label('dashboard_viewer.favorites_filters.export_frequency_granularity_required'));
            }

            if (this.tmp_export_frequency_granularity?.value === 'month' && !(this.export_frequency_day_in_month?.length > 0)) {
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
     * @return {Promise<void>}
     */
    private async handle_modal_state(): Promise<void> {
        if (this.is_modal_open) {
            $('#save_favorites_filters_modal_component').modal('show');
        } else {
            this.reset_modal();
            $('#save_favorites_filters_modal_component').modal('hide');
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
        this.favorites_filters_name = null;
        this.selected_favorite_field_filters = null;
        this.reset_export_plan();
    }

    /**
     * Reset Export Plan
     *
     * @return {void}
     */
    private reset_export_plan(): void {
        this.is_export_planned = false;
        this.export_frequency_day_in_month = null;
        this.tmp_export_frequency_granularity = null;
        this.export_frequency_every = null;
    }

    /**
     * Is Active Field Filter Selected
     *
     * @param {IReadableActiveFieldFilters} [props]
     * @returns {boolean}
     */
    private is_active_field_filter_selected(props: IReadableActiveFieldFilters): boolean {
        const path = props.path;

        if (!this.selected_favorite_field_filters) {
            return false;
        }

        return this.selected_favorite_field_filters[path.api_type_id] ?
            this.selected_favorite_field_filters[path.api_type_id][path.field_id] != undefined :
            false;
    }

    /**
     * Handle Toggle Select Favorite Filter
     *  - Select or unselect from favorites the given active filter props
     *
     * @param {IReadableActiveFieldFilters} [props]
     * @returns {void}
     */
    private handle_toggle_select_favorite_filter(props: IReadableActiveFieldFilters): void {
        const path = props.path;

        let tmp_selected_field_filters = cloneDeep(this.selected_favorite_field_filters);
        const active_field_filters = this.selectionnable_active_field_filters;

        if (!tmp_selected_field_filters) {
            tmp_selected_field_filters = {};
        }

        if (this.is_active_field_filter_selected(props)) {
            delete tmp_selected_field_filters[path.api_type_id][path.field_id];
        } else {
            tmp_selected_field_filters[path.api_type_id][path.field_id] = active_field_filters[path.api_type_id][path.field_id];
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
        return this.tmp_export_frequency_granularity?.value == 'month';
    }

    /**
     * Handle Toggle Select Exportable Data
     *  - Select or unselect from Exportable Data the given props
     *
     * @param {string} [title_name_code]
     * @returns {void}
     */
    private handle_toggle_select_exportable_data(title_name_code: string): void {
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
    private handle_toggle_is_export_planned(): void {
        this.is_export_planned = !this.is_export_planned;

        if (!this.is_export_planned) {
            this.reset_export_plan();
        }
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
     * Get Readable Active Field Filters HMI
     *  - For each selected active field filters get as Human readable filters
     *
     * @return {{ [translatable_field_filters_code: string]: IReadableActiveFieldFilters }}
     */
    get readable_active_field_filters(): { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } {
        let res: { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } = {};

        const active_field_filters = this.selectionnable_active_field_filters;

        for (const api_type_id in active_field_filters) {
            const filters = active_field_filters[api_type_id];

            for (const field_id in filters) {
                // Label of filter to be displayed
                const label = `${api_type_id}.${field_id}`;

                // the actual filter
                const filter = filters[field_id];

                // Path to find the actual filter
                const path: { api_type_id: string, field_id: string, } = {
                    api_type_id,
                    field_id
                };

                // Get HMI readable active field filters
                const readable_active_field_filters = ContextFilterVOHandler.context_filter_to_readable_ihm(filter);

                res[label] = {
                    readable_active_field_filters,
                    filter,
                    path,
                };

            }
        }

        return res;
    }

    /**
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }
}
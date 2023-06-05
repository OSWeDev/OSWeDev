import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import IReadableActiveFieldFilters from '../../../../../../../shared/modules/DashboardBuilder/interfaces/IReadableActiveFieldFilters';
import ExportContextQueryToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import IFavoritesFiltersOptions from '../../../../../../../shared/modules/DashboardBuilder/interfaces/IFavoritesFiltersOptions';
import FieldFiltersVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/FieldFiltersVOHandler';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import VOFieldRefVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import IExportFrequency from '../../../../../../../shared/modules/DashboardBuilder/interfaces/IExportFrequency';
import FavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import FieldFiltersVO from '../../../../../../../shared/modules/ContextFilter/vos/FieldFiltersVO';
import VueAppController from '../../../../../../VueAppController';
import VueComponentBase from '../../../../VueComponentBase';
import './SaveFavoritesFiltersModalComponent.scss';

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

    private favorites_filters: FavoritesFiltersVO = null;

    // Favorites filters name
    private favorites_filters_name: string = null;

    // Favorites filters behaviors options
    private overwrite_active_field_filters: boolean = true;

    private is_export_planned: boolean = false;

    private export_frequency: IExportFrequency = { every: null, granularity: null, day_in_month: null };

    private selected_export_frequency_granularity: {
        label?: string, value: 'day' | 'month' | 'year'
    } = { label: null, value: null }; // e.g. day, month, year

    private selected_favorite_field_filters: FieldFiltersVO = null;
    private selected_exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = null;

    private selectionnable_active_field_filters: FieldFiltersVO = null;

    private on_validation_callback: (props: Partial<FavoritesFiltersVO>) => Promise<void> = null;
    private on_close_callback: (props?: Partial<FavoritesFiltersVO>) => Promise<void> = null;
    private on_delete_callback: (props?: Partial<FavoritesFiltersVO>) => Promise<void> = null;

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
            selectionnable_active_field_filters: FieldFiltersVO,
            exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO },
        } = null,
        validation_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
        close_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>
    ): void {
        this.is_modal_open = true;

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
            selectionnable_active_field_filters: FieldFiltersVO,
            exportable_data: { [title_name_code: string]: ExportContextQueryToXLSXParamVO },
            favorites_filters: FavoritesFiltersVO,
        } = null,
        validation_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
        close_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
        delete_callback?: (props?: Partial<FavoritesFiltersVO>) => Promise<void>,
    ): void {

        this.favorites_filters = props?.favorites_filters ?? null;

        const favorites_filters: FavoritesFiltersVO = props?.favorites_filters ?? null;

        this.is_modal_open = true;

        // Favorites filters name
        this.favorites_filters_name = favorites_filters.name;

        // Favorites filters behaviors options
        this.overwrite_active_field_filters = favorites_filters.options?.overwrite_active_field_filters ?? true;

        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_active_field_filters = props.selectionnable_active_field_filters ? cloneDeep(props.selectionnable_active_field_filters) : null;
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
     * Watch on selected_export_frequency_granularity
     *  - Happen on component each time selected_export_frequency_granularity changes
     *
     * @returns {void}
     */
    @Watch('selected_export_frequency_granularity')
    private selected_export_frequency_granularity_watcher(): void {
        this.export_frequency.granularity = this.selected_export_frequency_granularity?.value ?? null;

        if (this.selected_export_frequency_granularity?.value != 'month') {
            this.export_frequency.day_in_month = null;
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

        const options: IFavoritesFiltersOptions = {
            overwrite_active_field_filters: this.overwrite_active_field_filters,
        };

        const export_frequency: IExportFrequency = is_export_planned ? this.export_frequency : null;

        const exportable_data: {
            [title_name_code: string]: ExportContextQueryToXLSXParamVO
        } = is_export_planned ? this.selected_exportable_data : null;

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
            $('#save_favorites_filters_modal_component').modal('show');
        } else {
            $('#save_favorites_filters_modal_component').modal('hide');

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
        this.selected_favorite_field_filters = null;
        this.selected_exportable_data = null;
        this.favorites_filters_name = null;
        this.favorites_filters = null;
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
     * @param {IReadableActiveFieldFilters} [props]
     * @returns {boolean}
     */
    private is_field_filter_selected(props: IReadableActiveFieldFilters): boolean {
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
     * @param {IReadableActiveFieldFilters} [props]
     * @returns {void}
     */
    private handle_toggle_select_favorite_filter(props: IReadableActiveFieldFilters): void {
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
     * Handle Toggle Is Export Planned
     *
     * @returns {void}
     */
    private handle_toggle_overwrite_active_field_filters(): void {
        this.overwrite_active_field_filters = !this.overwrite_active_field_filters;
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
     * @return {{ [translatable_field_filters_code: string]: IReadableActiveFieldFilters }}
     */
    get readable_active_field_filters(): { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } {
        const active_field_filters = cloneDeep(this.selectionnable_active_field_filters);

        const readable_field_filters = FieldFiltersVOManager.create_readable_filters_text_from_field_filters(active_field_filters);

        return readable_field_filters;
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

    /**
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }
}
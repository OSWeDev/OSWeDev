import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import IReadableFieldFilters from '../../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters';
import FieldFiltersVOHandler from '../../../../../../shared/modules/DashboardBuilder/handlers/FieldFiltersVOHandler';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import VOFieldRefVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import SharedFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import './SharedFiltersModalComponent.scss';

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
    template: require('./SharedFiltersModalComponent.pug'),
    components: {}
})
export default class SharedFiltersModalComponent extends VueComponentBase {

    private modal_initialized: boolean = false;

    private is_modal_open: boolean = false;
    private active_tab_view: string = 'selection_tab';

    private form_errors: string[] = [];

    private shared_filters: SharedFiltersVO = null;

    // Shared filters name
    private shared_filters_name: string = null;

    // Shared filters behaviors options
    private overwrite_sharable_field_filters: boolean = true;

    private readable_field_filters: { [label: string]: IReadableFieldFilters } = null;
    private selectionnable_field_filters: FieldFiltersVO = null;

    private selected_field_filters: FieldFiltersVO = null;

    private on_validation_callback: (props: Partial<SharedFiltersVO>) => Promise<void> = null;
    private on_close_callback: (props?: Partial<SharedFiltersVO>) => Promise<void> = null;
    private on_delete_callback: (props?: Partial<SharedFiltersVO>) => Promise<void> = null;

    private throttled_load_readable_field_filters = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_readable_field_filters.bind(this),
        50,
        { leading: false, trailing: true }
    );

    /**
     * Open Modal For Creation
     *  - Open modal to create a new shared_filters
     *
     * @param props
     * @param validation_callback
     * @return {void}
     */
    public open_modal_for_creation(
        props: {
            selectionnable_field_filters: FieldFiltersVO,
            readable_field_filters: { [label: string]: IReadableFieldFilters },
        } = null,
        validation_callback?: (props?: Partial<SharedFiltersVO>) => Promise<void>,
        close_callback?: (props?: Partial<SharedFiltersVO>) => Promise<void>
    ): void {
        this.is_modal_open = true;

        this.readable_field_filters = props?.readable_field_filters ?? null;

        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_field_filters = props?.selectionnable_field_filters ?? null;
        // We must set all selected by default
        this.selected_field_filters = props?.selectionnable_field_filters ?? null;

        if (typeof validation_callback == 'function') {
            this.on_validation_callback = validation_callback;
        }

        if (typeof close_callback == 'function') {
            this.on_close_callback = close_callback;
        }
    }

    /**
     * Open Modal For Update
     *  - Open modal to update a shared_filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @param {(props?: Partial<SharedFiltersVO>) => Promise<void>} validation_callback
     */
    public open_modal_for_update(
        props: {
            selectionnable_field_filters: FieldFiltersVO,
            readable_field_filters: { [label: string]: IReadableFieldFilters },
            shared_filters: SharedFiltersVO,
        } = null,
        validation_callback?: (props?: Partial<SharedFiltersVO>) => Promise<void>,
        close_callback?: (props?: Partial<SharedFiltersVO>) => Promise<void>,
        delete_callback?: (props?: Partial<SharedFiltersVO>) => Promise<void>,
    ): void {

        this.shared_filters = props?.shared_filters ?? null;

        const shared_filters: SharedFiltersVO = props?.shared_filters ?? null;

        this.is_modal_open = true;

        // Shared filters name
        this.shared_filters_name = shared_filters.name;

        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_field_filters = props.selectionnable_field_filters ? cloneDeep(props.selectionnable_field_filters) : null;
        this.selected_field_filters = shared_filters.field_filters;

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
                $("#shared_filters_modal_component").on("hidden.bs.modal", () => {
                    this.is_modal_open = false;
                });
            }
        });
    }

    /**
     * Watch on selectionnable_field_filters
     *  - Happen on component each time selectionnable_field_filters changes
     *  - Load readable_field_filters
     */
    @Watch('selectionnable_field_filters', { immediate: true })
    private async onchange_selectionnable_field_filters() {
        // Throttle load_readable_field_filters
        this.throttled_load_readable_field_filters();
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

        const shared_filters: SharedFiltersVO = new SharedFiltersVO().from({
            ...this.shared_filters,
            field_filters: this.selected_field_filters,
            name: this.shared_filters_name,
            // export_params: {
            //     ...this.shared_filters?.export_params,
            //     is_export_planned,
            //     export_frequency,
            //     exportable_data,
            // },
            // options,
        });

        await this.on_validation_callback(shared_filters);

        this.is_modal_open = false;
    }

    /**
     * Handle Delete
     * - Delete the current shared_filters
     *
     * @return {Promise<void>}
     */
    private handle_delete(): Promise<void> {
        if (!(typeof this.on_delete_callback === 'function')) {
            return;
        }

        this.on_delete_callback(this.shared_filters);

        this.is_modal_open = false;
    }

    /**
     * Check Form Valid
     *
     * @returns boolean
     */
    private is_form_valid(): boolean {
        this.form_errors = [];

        if (!(this.shared_filters_name?.length > 0)) {
            this.form_errors.push(this.label('dashboard_builder.shared_filters.name_required'));
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
            $('#shared_filters_modal_component').modal('show');
        } else {
            $('#shared_filters_modal_component').modal('hide');

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

        this.selected_field_filters = null;
        this.shared_filters_name = null;
        this.shared_filters = null;
    }

    /**
     * is_field_filter_selected
     * - Check if active field filter selected
     *
     * @param {VOFieldRefVO} [vo_field_ref]
     * @returns {boolean}
     */
    private is_field_filter_selected(vo_field_ref: VOFieldRefVO): boolean {
        vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
            { vo_field_ref }
        );

        if (!this.selected_field_filters) {
            return false;
        }

        return !FieldFiltersVOHandler.is_field_filters_empty(
            vo_field_ref,
            this.selected_field_filters
        );
    }

    /**
     * Handle Toggle Select Sharable Filter
     *  - Select or unselect from Shared the given active filter props
     *
     * @param {IReadableFieldFilters} [props]
     * @returns {void}
     */
    private handle_toggle_select_sharable_field_filters(props: IReadableFieldFilters): void {
        const vo_field_ref = props.vo_field_ref;

        let tmp_selected_field_filters = cloneDeep(this.selected_field_filters);
        const sharable_field_filters = cloneDeep(this.selectionnable_field_filters);

        if (!tmp_selected_field_filters) {
            tmp_selected_field_filters = {};
        }

        if (this.is_field_filter_selected(props.vo_field_ref)) {
            delete tmp_selected_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id];

        } else {
            if (!FieldFiltersVOHandler.is_field_filters_empty(props.vo_field_ref, sharable_field_filters)) {
                const context_filter = sharable_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id];

                tmp_selected_field_filters = FieldFiltersVOManager.overwrite_field_filters_with_context_filter(
                    tmp_selected_field_filters,
                    vo_field_ref,
                    context_filter
                );
            }
        }

        this.selected_field_filters = tmp_selected_field_filters;
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
     * Get Readable Field Filters HMI
     *  - For each selected field filters get as Human readable filters
     *
     * @return {Promise<{ [translatable_field_filters_code: string]: IReadableFieldFilters }>}
     */
    private async load_readable_field_filters(): Promise<{ [translatable_field_filters_code: string]: IReadableFieldFilters }> {
        const field_filters = cloneDeep(this.selectionnable_field_filters);

        const readable_field_filters = await FieldFiltersVOManager.create_readable_filters_text_from_field_filters(
            field_filters
        );

        this.readable_field_filters = readable_field_filters;

        return readable_field_filters;
    }

    /**
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }
}
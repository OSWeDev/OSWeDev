import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import IReadableFieldFilters from '../../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters';
import DashboardPageVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import VOFieldRefVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import DashboardVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import SharedFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import './SharedFiltersModalComponent.scss';

@Component({
    template: require('./SharedFiltersModalComponent.pug'),
    components: {}
})
export default class SharedFiltersModalComponent extends VueComponentBase {

    private modal_initialized: boolean = false;

    private is_modal_open: boolean = false;
    private active_tab_view: string = 'field_filters_selection_tab';

    private form_errors: string[] = [];

    private shared_filters: SharedFiltersVO = null;

    // Shared filters name
    private shared_filters_name: string = null;

    // Shared filters behaviors options
    private overwrite_sharable_field_filters: boolean = true;

    private readable_field_filters: { [label: string]: IReadableFieldFilters } = null;
    private selectionnable_field_filters: FieldFiltersVO = null;

    private selectionnable_dashboards: DashboardVO[] = [];
    private selected_dashboards: DashboardVO[] = [];

    private selectionnable_pages: { [dashboard_id: number]: DashboardPageVO[] } = {};
    private selected_pages: { [dashboard_id: number]: DashboardPageVO[] } = {};

    private dashboard_query_string: string = null;
    private page_query_string: string = null;

    private selected_field_filters: { [api_type_id: string]: { [field_id: string]: boolean } } = null;
    private selected_shared_with_dashboard_ids: number[] = [];
    private selected_shared_with_page_ids: number[] = [];

    private on_validation_callback: (props: Partial<SharedFiltersVO>) => Promise<void> = null;
    private on_close_callback: (props?: Partial<SharedFiltersVO>) => Promise<void> = null;
    private on_delete_callback: (props?: Partial<SharedFiltersVO>) => Promise<void> = null;

    private throttled_load_selectionnable_dashboards_options = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_selectionnable_dashboards_options.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_selectionnable_pages_options = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_selectionnable_pages_options.bind(this),
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
        this.set_selected_field_filters(props?.selectionnable_field_filters, true);

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

        this.is_modal_open = true;

        const shared_filters: SharedFiltersVO = props?.shared_filters ?? null;

        this.shared_filters = shared_filters;

        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_field_filters = props.selectionnable_field_filters ? cloneDeep(props.selectionnable_field_filters) : null;

        // We must set all selected with the shared_filters properties
        this.selected_shared_with_page_ids = shared_filters?.shared_with_page_ids ?? [];
        this.selected_field_filters = shared_filters?.field_filters_to_share;
        this.shared_filters_name = shared_filters?.name;

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
    private onchange_selectionnable_field_filters(): void {
    }

    /**
     * Watch on selected_dashboards changes
     *  - Happen on component each time selected_dashboards changes
     *  - Load dashboard_pages
     */
    @Watch('selected_dashboards', { immediate: true })
    private onchange_selected_dashboards(): void {
        this.throttled_load_selectionnable_pages_options();
    }

    /**
     * Watch on is_modal_open
     *  - Happen on component each time is_modal_open changes
     *
     * @returns {void}
     */
    @Watch('is_modal_open', { immediate: true, deep: true })
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
     *  - Save the current shared_filters
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
            field_filters_to_share: this.selected_field_filters,
            name: this.shared_filters_name,
        });

        await this.on_validation_callback(shared_filters);

        this.is_modal_open = false;
    }

    private handle_load_selectionnable_dashboards_options(query_string: string) {
        this.dashboard_query_string = query_string;
        this.throttled_load_selectionnable_dashboards_options();
    }

    private handle_load_selectionnable_pages_options(query_string: string) {
        this.page_query_string = query_string;
        this.throttled_load_selectionnable_pages_options();
    }

    /**
     * TODO: we must find dashboard and after dashboard_pages
     *
     *
     * @returns
     */
    private async load_selectionnable_dashboards_options() {
        const context_query = query(DashboardPageVO.API_TYPE_ID);

        if ((this.dashboard_query_string?.length > 0)) {
            // context_query.field('name', this.dashboard_query_string, 'ILIKE');
        }

        const dashboards = await DashboardVOManager.find_all_dashboards(
            context_query
        );

        for (let i in dashboards) {
            const dashboard = dashboards[i];

            this.selectionnable_pages[dashboard.id] = [];
            this.selected_pages[dashboard.id] = [];
        }

        this.selectionnable_dashboards = dashboards;
    }

    /**
     * TODO: we must find dashboard and after dashboard_pages
     *
     *
     * @returns
     */
    private async load_selectionnable_pages_options() {
        const context_query = query(DashboardPageVO.API_TYPE_ID);

        if ((this.page_query_string?.length > 0)) {
            // context_query.field('name', this.page_query_string, 'ILIKE');
        }

        const dashboard_ids = this.selected_dashboards.map((dashboard) => dashboard.id);

        const selectionnable_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_ids(
            dashboard_ids,
        );

        const selectionnable_pages_by_dashboard_id: { [dashboard_id: number]: DashboardPageVO[] } = {};

        for (let i in dashboard_ids) {
            const dashboard_id = dashboard_ids[i];

            selectionnable_pages_by_dashboard_id[dashboard_id] = selectionnable_pages.filter((page) =>
                page.dashboard_id == dashboard_id
            );
        }

        this.selectionnable_pages = selectionnable_pages_by_dashboard_id;
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

        if (!(this.selected_shared_with_page_ids?.length > 0)) {
            this.form_errors.push(this.label('dashboard_builder.shared_filters.shared_with_page_ids_required'));
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

            this.init_modal();
        } else {
            $('#shared_filters_modal_component').modal('hide');

            if (typeof this.on_close_callback === 'function') {
                this.on_close_callback();
            }

            this.reset_modal();
        }
    }

    /**
     * Init Modal
     * - Load selectionnable dashboards options
     */
    private init_modal(): void {
        this.throttled_load_selectionnable_dashboards_options();
    }

    /**
     * Reset Modal
     *
     * @return {void}
     */
    private reset_modal(): void {
        this.form_errors = [];
        this.active_tab_view = 'field_filters_selection_tab';

        this.selected_field_filters = null;
        this.shared_filters_name = null;
        this.shared_filters = null;
    }

    /**
     * is_field_filter_selected
     * - Check if active field filter selected
     *
     * @param {IReadableFieldFilters} [readable_field_filters
     * @returns {boolean}
     */
    private is_field_filter_selected(readable_field_filters: IReadableFieldFilters): boolean {
        if (!readable_field_filters) {
            return false;
        }

        const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
            { vo_field_ref: readable_field_filters.vo_field_ref }
        );

        if (!this.selected_field_filters) {
            return false;
        }

        const api_type_id_filters = this.selected_field_filters[vo_field_ref.api_type_id];

        if (!api_type_id_filters) {
            return true;
        }

        return !!(api_type_id_filters[vo_field_ref.field_id]);
    }

    /**
     * Handle Toggle Select Sharable Filter
     *  - Select or unselect from Shared the given active filter readable_field_filters
     *
     * @param {IReadableFieldFilters} [readable_field_filters]
     * @returns {void}
     */
    private handle_toggle_select_field_filters(readable_field_filters: IReadableFieldFilters): void {
        const vo_field_ref = readable_field_filters.vo_field_ref;

        const selectionnable_field_filters = cloneDeep(this.selectionnable_field_filters);
        let tmp_selected_field_filters = cloneDeep(this.selected_field_filters);

        if (!tmp_selected_field_filters) {
            tmp_selected_field_filters = {};
        }

        if (this.is_field_filter_selected(readable_field_filters)) {
            delete tmp_selected_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id];

        } else {
            tmp_selected_field_filters[vo_field_ref.api_type_id][vo_field_ref.field_id] = true;
        }

        this.selected_field_filters = tmp_selected_field_filters;
    }

    /**
     * select_field_filters
     *  - Select field filters set all given field_filters to true
     *
     * @param {FieldFiltersVO} field_filters
     */
    private select_field_filters(field_filters: FieldFiltersVO) {
        this.set_selected_field_filters(field_filters, true);
    }

    /**
     * deselect_field_filters
     *  - Select field filters set all given field_filters to false
     *
     * @param {FieldFiltersVO} field_filters
     */
    private deselect_field_filters(field_filters: FieldFiltersVO) {
        this.set_selected_field_filters(field_filters, false);
    }

    /**
     * set_selected_field_filters
     *  - Set selected field filters to given value
     *
     * @param {FieldFiltersVO} field_filters
     * @param {boolean} value
     */
    private set_selected_field_filters(field_filters: FieldFiltersVO, value: boolean) {
        const selected_field_filters: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        for (let api_type_id in field_filters.field_filters) {
            const filter = field_filters[api_type_id];

            for (let field_id in filter) {
                selected_field_filters[api_type_id] = selected_field_filters[api_type_id] ?? {};
                selected_field_filters[api_type_id][field_id] = false;
            }
        }

        this.selected_field_filters = selected_field_filters;
    }

    /**
     * dashboard_label
     *
     * @param {DashboardVO} dashboard
     * @returns {string}
     */
    private dashboard_label(dashboard: DashboardVO): string {
        if (!dashboard) {
            return '';
        }

        return dashboard.id + ' | ' + this.t(dashboard.translatable_name_code_text);
    }

    /**
     * page_label
     *
     * @param {DashboardPageVO} page
     * @returns {string}
     */
    private page_label(page: DashboardPageVO): string {
        if (!page) {
            return '';
        }

        return page.id + ' | ' + this.t(page.translatable_name_code_text);
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
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }
}
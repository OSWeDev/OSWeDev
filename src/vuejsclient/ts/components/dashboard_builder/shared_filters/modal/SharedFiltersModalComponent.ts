import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import IReadableFieldFilters from '../../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters';
import DashboardPageFieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/DashboardPageFieldFiltersVOManager';
import DashboardPageVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import VOFieldRefVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SharedFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import ObjectHandler, { reflect } from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import ISelectionnableFieldFilters from '../interface/ISelectionnableFieldFilters';
import './SharedFiltersModalComponent.scss';
@Component({
    template: require('./SharedFiltersModalComponent.pug'),
    components: {}
})
export default class SharedFiltersModalComponent extends VueComponentBase {

    public modal_initialized: boolean = false;

    public is_modal_open: boolean = false;
    public active_tab_view: string = 'share_with_dashboard_tab';

    public form_errors: string[] = [];

    public dashboard_id: number = null;
    public shared_filters: SharedFiltersVO = null;

    // Shared filters name
    public shared_filters_name: string = null;

    // Shared filters behaviors options
    public overwrite_sharable_field_filters: boolean = true;

    public readable_field_filters: { [label: string]: IReadableFieldFilters } = null;
    public selectionnable_field_filters: FieldFiltersVO = null;

    public selectionnable_dashboards: DashboardVO[] = [];
    public selected_dashboards_shared_with: DashboardVO[] = [];
    public selected_dashboards_shared_from: DashboardVO[] = [];

    public dashboard_query_string: string = null;

    public selected_field_filters: { [api_type_id: string]: { [field_id: string]: boolean } } = null;
    public selected_shared_with_dashboard_ids_numranges: NumRange[] = [];
    public selected_shared_from_dashboard_ids_numranges: NumRange[] = [];

    public default_field_filters_by_dashboard_id: { [dashboard_id: number]: FieldFiltersVO } = {};

    public on_validation_callback: (props: Partial<SharedFiltersVO>) => Promise<void> = null;
    public on_close_callback: (props?: Partial<SharedFiltersVO>) => Promise<void> = null;
    public on_delete_callback: (props?: Partial<SharedFiltersVO>) => Promise<void> = null;

    public throttled_load_selectionnable_dashboards_options = ThrottleHelper.declare_throttle_without_args(
        'SharedFiltersModalComponent.throttled_load_selectionnable_dashboards_options',
        this.load_selectionnable_dashboards_options.bind(this),
        50,
        false
    );

    /**
     * Get Selectionnable Readable Field Filters
     * - Get readable field filters that are selectionnable
     */
    get selectionnable_readable_field_filters(): { [label: string]: IReadableFieldFilters } {
        const selectionnable_field_filters = cloneDeep(this.selectionnable_field_filters);
        const readable_field_filters: { [label: string]: IReadableFieldFilters } = {};

        if (!this.selectionnable_field_filters) {
            return readable_field_filters;
        }

        for (const api_type_id in selectionnable_field_filters) {
            const field_filters = selectionnable_field_filters[api_type_id];

            for (const field_id in field_filters) {
                const readable_field_filter = Object.values(this.readable_field_filters).find((_readable_field_filter) => {
                    const vo_field_ref = _readable_field_filter.vo_field_ref;

                    const has_api_type_id = (vo_field_ref.api_type_id == api_type_id);
                    const has_field_id = (vo_field_ref.field_id == field_id);

                    return has_api_type_id && has_field_id;
                });

                if (!readable_field_filter) {
                    continue;
                }

                readable_field_filters[readable_field_filter.label] = readable_field_filter;
            }
        }

        return ObjectHandler.sort_by_key(readable_field_filters);
    }

    /**
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }

    /**
     * Watch on selectionnable_field_filters
     *  - Happen on component each time selectionnable_field_filters changes
     *  - Load readable_field_filters
     */
    @Watch(reflect<SharedFiltersModalComponent>().selectionnable_field_filters, { immediate: true })
    public onchange_selectionnable_field_filters(): void {
        this.init_selectionnable_field_filters();
    }

    /**
     * Watch on selectionnable_dashboards changes
     *  - Happen on component each time selectionnable_dashboards changes
     *  - Set selected_dashboards_shared_with if selected_shared_with_dashboard_ids_numranges is not empty
     */
    @Watch(reflect<SharedFiltersModalComponent>().selectionnable_dashboards, { immediate: true })
    public onchange_selectionnable_dashboards(): void {

        if (this.selected_shared_with_dashboard_ids_numranges?.length > 0) {
            this.selected_dashboards_shared_with = this.selectionnable_dashboards.filter((dashboard) => {
                let has_dashboard_id = false;

                RangeHandler.foreach_ranges_sync(this.selected_shared_with_dashboard_ids_numranges, (dashboard_id: number) => {
                    if (dashboard_id == dashboard.id) {
                        has_dashboard_id = true;
                    }
                });

                return has_dashboard_id;
            });
        }

        if (this.selected_shared_from_dashboard_ids_numranges?.length > 0) {
            this.selected_dashboards_shared_from = this.selectionnable_dashboards.filter((dashboard) => {
                let has_dashboard_id = false;

                RangeHandler.foreach_ranges_sync(this.selected_shared_from_dashboard_ids_numranges, (dashboard_id: number) => {
                    if (dashboard_id == dashboard.id) {
                        has_dashboard_id = true;
                    }
                });

                return has_dashboard_id;
            });
        }
    }

    /**
     * Watch on selected_dashboards_shared_with changes
     *  - Happen on component each time selected_dashboards_shared_with changes
     *  - Load dashboard_pages
     */
    @Watch(reflect<SharedFiltersModalComponent>().selected_dashboards_shared_with, { immediate: true })
    public async onchange_selected_dashboards_shared_with(): Promise<void> {
        const selected_dashboards_shared_with_ids = this.selected_dashboards_shared_with.map(
            (dashboard) => dashboard.id
        );

        this.selected_shared_with_dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            [...selected_dashboards_shared_with_ids, this.dashboard_id]
        );

        if (this.shared_filters?.id) {
            this.selected_field_filters = this.shared_filters?.field_filters_to_share;
        }

        await this.load_all_selected_dashboards_default_field_filters('shared_with');

        this.init_selectionnable_field_filters();
    }

    /**
     * Watch on selected_dashboards_shared_from changes
     *  - Happen on component each time selected_dashboards_shared_from changes
     *  - Load dashboard_pages
     */
    @Watch(reflect<SharedFiltersModalComponent>().selected_dashboards_shared_from, { immediate: true })
    public async onchange_selected_dashboards_shared_from(): Promise<void> {
        const selected_dashboards_shared_from_ids = this.selected_dashboards_shared_from.map(
            (dashboard) => dashboard.id
        );

        this.selected_shared_from_dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            [...selected_dashboards_shared_from_ids, this.dashboard_id]
        );

        if (this.shared_filters?.id) {
            this.selected_field_filters = this.shared_filters?.field_filters_to_share;
        }

        await this.load_all_selected_dashboards_default_field_filters('shared_from');

        this.init_selectionnable_field_filters();
    }

    /**
     * Watch on is_modal_open
     *  - Happen on component each time is_modal_open changes
     *field_filtersfield_filters
     * @returns {void}
     */
    @Watch(reflect<SharedFiltersModalComponent>().is_modal_open, { immediate: true, deep: true })
    public is_modal_open_watcher(): void {
        this.handle_modal_state();
    }

    @Watch(reflect<SharedFiltersModalComponent>().active_tab_view, { immediate: true })
    public async update_selectable_filters() {
        // c'est quand on arrive sur l'onglet 'field_filters_selection_tab' qu'on doit mettre à jour les filtres selectionnables
        //  en fonction des DBs sélectionnés dans l'onglet 1
        //  et si on a une incohérence avec la conf actuelle (un filtre selectionné qui n'est pas selectionnable dans toutes les DBs)
        //  on doit le déselectionner ou le supprimer de la liste des filtres selectionnables
        if (this.active_tab_view != 'field_filters_selection_tab') {
            return;
        }

        await this.update_selectionnable_field_filters();
    }

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
            selectionnable_field_filters: ISelectionnableFieldFilters,
            dashboard_id: number,
        } = null,
        validation_callback?: (prop?: Partial<SharedFiltersVO>) => Promise<void>,
        close_callback?: (prop?: Partial<SharedFiltersVO>) => Promise<void>
    ): void {
        this.is_modal_open = true;

        this.dashboard_id = props?.dashboard_id ?? null;

        const selectionnable_field_filters: ISelectionnableFieldFilters = props?.selectionnable_field_filters ?? null;

        // Readable field filters
        this.readable_field_filters = selectionnable_field_filters.readable_field_filters ?? null;
        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_field_filters = selectionnable_field_filters.field_filters ?? null;

        // We must set current dashboard selected by default
        this.selected_shared_from_dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            [this.dashboard_id]
        );
        this.selected_shared_with_dashboard_ids_numranges = RangeHandler.get_ids_ranges_from_list(
            [this.dashboard_id]
        );

        // We must set all selected by default
        this.set_selected_field_filters(selectionnable_field_filters.field_filters, true);

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
            selectionnable_field_filters: ISelectionnableFieldFilters,
            shared_filters: SharedFiltersVO,
            dashboard_id: number,
        } = null,
        validation_callback?: (prop?: Partial<SharedFiltersVO>) => Promise<void>,
        close_callback?: (prop?: Partial<SharedFiltersVO>) => Promise<void>,
        delete_callback?: (prop?: Partial<SharedFiltersVO>) => Promise<void>,
    ): void {

        this.is_modal_open = true;

        const shared_filters: SharedFiltersVO = props?.shared_filters ?? null;

        if (!shared_filters) {
            throw new Error('SharedFiltersModalComponent: shared_filters should be defined');
        }

        this.shared_filters = shared_filters;
        this.dashboard_id = props?.dashboard_id ?? null;

        const selectionnable_field_filters: ISelectionnableFieldFilters = props?.selectionnable_field_filters ?? null;

        // Readable field filters
        this.readable_field_filters = selectionnable_field_filters.readable_field_filters ?? null;
        // Fields filters settings
        // Modal selectionnable filters
        this.selectionnable_field_filters = selectionnable_field_filters.field_filters ?? null;

        // We must set all selected with the shared_filters properties
        this.selected_shared_with_dashboard_ids_numranges = shared_filters?.shared_with_dashboard_ids ?? [];
        this.selected_shared_from_dashboard_ids_numranges = shared_filters?.shared_from_dashboard_ids ?? [];
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
    public mounted(): void {
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
     * Handle Close Modal
     *
     * @return {Promise<void>}
     */
    public async handle_close_modal(): Promise<void> {
        this.is_modal_open = false;
    }

    /**
     * init_selectionnable_field_filters
     *  - Init selectionnable field filters
     * @returns {void}
     */
    public init_selectionnable_field_filters(): void {
        const field_filters = this.selectionnable_field_filters;

        if (!field_filters) {
            return;
        }

        let is_selected_dashboard_default_field_filters_empty = true;

        if (this.selected_dashboards_shared_with?.length > 0) {
            is_selected_dashboard_default_field_filters_empty = this.selected_dashboards_shared_with?.some((dashboard) => {
                const dashboard_field_filters = this.default_field_filters_by_dashboard_id[dashboard.id];
                return !dashboard_field_filters || (Object.keys(dashboard_field_filters).length == 0);
            });
        }

        for (const api_type_id in field_filters) {
            const filter = field_filters[api_type_id];

            for (const field_id in filter) {
                const readable_field_filters = Object.values(this.readable_field_filters).find((_readable_field_filters) => {
                    const vo_field_ref = _readable_field_filters.vo_field_ref;

                    const has_api_type_id = (vo_field_ref.api_type_id == api_type_id);
                    const has_field_id = (vo_field_ref.field_id == field_id);

                    return has_api_type_id && has_field_id;
                });

                const is_sharable = this.is_sharable_field_filter(
                    readable_field_filters.vo_field_ref
                );

                // If field filter is not sharable
                // we must unselect it
                if (!is_selected_dashboard_default_field_filters_empty && !is_sharable) {
                    const field_filters_selection = {};

                    field_filters_selection[api_type_id] = {};
                    field_filters_selection[api_type_id][field_id] = null;

                    this.set_selected_field_filters(field_filters_selection, false);
                }
            }
        }
    }

    /**
     * Handle Save
     *  - Save the current shared_filters
     *
     * @return {Promise<void>}
     */
    public async handle_save(): Promise<void> {
        if (!this.is_form_valid()) {
            return;
        }

        if (!(typeof this.on_validation_callback === 'function')) {
            return;
        }

        const shared_filters: SharedFiltersVO = new SharedFiltersVO().from({
            ...this.shared_filters,
            shared_with_dashboard_ids: this.selected_shared_with_dashboard_ids_numranges,
            shared_from_dashboard_ids: this.selected_shared_from_dashboard_ids_numranges,
            field_filters_to_share: this.selected_field_filters,
            name: this.shared_filters_name,
        });

        await this.on_validation_callback(shared_filters);

        this.is_modal_open = false;
    }

    /**
     * handle_load_selectionnable_dashboards_options
     *  - Handle load selectionnable dashboards options by query_string
     *
     * @param query_string
     */
    public handle_load_selectionnable_dashboards_options(query_string: string) {
        this.dashboard_query_string = query_string;
        this.throttled_load_selectionnable_dashboards_options();
    }

    /**
     * load_selectionnable_dashboards_options
     *
     * @returns
     */
    public async load_selectionnable_dashboards_options() {
        const context_query = query(DashboardVO.API_TYPE_ID);

        // We may want to filter dashboards by name
        if ((this.dashboard_query_string?.length > 0)) {
            // context_query.filter_by_text_including(field_names < DashboardVO>().title , this.dashboard_query_string);// Needs to test the translation, not the code. we probably need to change the filter function for translatable_strings
        }

        // Find all dashboards
        // Remove current dashboard from selectionnable dashboards
        this.selectionnable_dashboards = await context_query.select_vos<DashboardVO>();
    }

    /**
     * load_all_selected_dashboards_default_field_filters
     * - Load all selected dashboards default field filters
     */
    public async load_all_selected_dashboards_default_field_filters(
        dashboard_type: 'shared_with' | 'shared_from'
    ) {
        let selected_dashboards_shared_with_ids = null;

        if (dashboard_type == 'shared_with') {
            selected_dashboards_shared_with_ids = this.selected_dashboards_shared_with.map((dashboard) => dashboard.id);
        } else if (dashboard_type == 'shared_from') {
            selected_dashboards_shared_with_ids = this.selected_dashboards_shared_from.map((dashboard) => dashboard.id);
        }

        const dashboard_pages_by_dashboard_id: { [dashboard_id: number]: DashboardPageVO[] } = {};

        const dashboard_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_ids(
            selected_dashboards_shared_with_ids,
        );

        const default_field_filters_by_dashboard_id: { [dashboard_id: number]: FieldFiltersVO } = {};

        for (const i in selected_dashboards_shared_with_ids) {
            const dashboard_id = selected_dashboards_shared_with_ids[i];

            dashboard_pages_by_dashboard_id[dashboard_id] = dashboard_pages?.filter(
                (dashboard_page) => dashboard_page.dashboard_id == dashboard_id
            );

            default_field_filters_by_dashboard_id[dashboard_id] = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_id(
                dashboard_id,
                { keep_empty_context_filter: true }
            );

        }

        this.default_field_filters_by_dashboard_id = default_field_filters_by_dashboard_id;

        // We should update selectionnable_field_filters
        if (dashboard_type == 'shared_from') {
            await this.update_selectionnable_field_filters();
        }
    }

    /**
     * load_all_selectionnable_field_filters
     * - We should be able to select field filters from all selected dashboards
     * - The displayed selectionnable field_filters should be the intersection of all selected_dashboards_shared_from default field filters
     */
    public async update_selectionnable_field_filters(): Promise<void> {

        const dashboard_pages_field_filters_map = await DashboardPageFieldFiltersVOManager.find_dashboard_pages_field_filters_by_dashboard_ids(
            this.selected_dashboards_shared_from.map((dashboard) => dashboard.id),
            VueAppController.getInstance().data_user_lang.code_lang,
        );

        const dashboard_pages_field_filters = DashboardPageFieldFiltersVOManager.get_INTERSECTION_all_dashboard_pages_field_filters(//merge_all_dashboard_pages_field_filters(
            dashboard_pages_field_filters_map
        );

        if (!dashboard_pages_field_filters) {
            this.selectionnable_field_filters = {};
            return;
        }

        const selectionnable_field_filters: FieldFiltersVO = cloneDeep(
            dashboard_pages_field_filters.field_filters
        );

        const field_filters_to_keep: FieldFiltersVO = {};

        for (const api_type_id in selectionnable_field_filters) {
            const field_filters = selectionnable_field_filters[api_type_id];

            for (const field_id in field_filters) {
                const context_filter = field_filters[field_id];

                // Selectionnable field_filters should be present in all selected_dashboards_shared_from
                if (!this.is_selectionnable_field_filter({ api_type_id, field_id })) {
                    continue;
                }

                if (!field_filters_to_keep[api_type_id]) {
                    field_filters_to_keep[api_type_id] = {};
                }

                if (!field_filters_to_keep[api_type_id][field_id]) {
                    field_filters_to_keep[api_type_id][field_id] = context_filter;
                }
            }
        }

        this.selectionnable_field_filters = field_filters_to_keep;
    }

    /**
     * on_select_selectionnable_dashboard
     * - Add the given dashboard to selected_dashboards_shared_with
     *
     * @param {DashboardVO} [dashboard]
     */
    public on_select_selectionnable_dashboard(
        type: 'shared_with' | 'shared_from',
        dashboard: DashboardVO
    ): void {

        if (type == 'shared_with') {
            const has_dashboard = this.selected_dashboards_shared_with.find((selected_dashboard) =>
                selected_dashboard.id == dashboard.id
            );

            if (!has_dashboard) {
                this.selected_dashboards_shared_with.push(dashboard);
            }
        }

        if (type == 'shared_from') {
            const has_dashboard = this.selected_dashboards_shared_from.find((selected_dashboard) =>
                selected_dashboard.id == dashboard.id
            );

            if (!has_dashboard) {
                this.selected_dashboards_shared_from.push(dashboard);
            }
        }
    }

    /**
     * on_remove_selected_dashboard
     * - Remove the given dashboard from selected_dashboards_shared_with
     *
     * @param {DashboardVO} [dashboard]
     */
    public on_remove_selected_dashboard(
        type: 'shared_with' | 'shared_from',
        dashboard: DashboardVO
    ): void {

        if (dashboard.id == this.dashboard_id) {
            // We can't remove the current dashboard
            return;
        }

        if (type == 'shared_with') {
            this.selected_dashboards_shared_with = this.selected_dashboards_shared_with.filter((selected_dashboard) =>
                selected_dashboard.id != dashboard.id
            );
        }

        if (type == 'shared_from') {
            this.selected_dashboards_shared_from = this.selected_dashboards_shared_from.filter((selected_dashboard) =>
                selected_dashboard.id != dashboard.id
            );
        }
    }

    /**
     * Handle Delete
     * - Delete the current shared_filters
     *
     * @return {Promise<void>}
     */
    public handle_delete(): Promise<void> {
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
    public is_form_valid(): boolean {
        this.form_errors = [];

        if (!(this.shared_filters_name?.length > 0)) {
            this.form_errors.push(this.label('dashboard_builder.shared_filters.name_required'));
        }

        if (!(this.selected_shared_with_dashboard_ids_numranges?.length > 0)) {
            this.form_errors.push(this.label('dashboard_builder.shared_filters.shared_with_dashboard_ids_required'));
        }

        return !(this.form_errors?.length > 0);
    }

    /**
     * Toggle Modal Open
     *  - Swich modal from show to hide (vice versa)
     *
     * @return {void}
     */
    public toggle_modal_open(): void {
        this.is_modal_open = !this.is_modal_open;
    }

    /**
     * Handle Modal State
     *  - Manage modal depending on its state
     *
     * @return {<void>}
     */
    public handle_modal_state(): void {
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
    public init_modal(): void {
        this.throttled_load_selectionnable_dashboards_options();
    }

    /**
     * Reset Modal
     *  - Reset modal to its initial state
     *
     * @return {void}
     */
    public reset_modal(): void {
        this.form_errors = [];
        this.active_tab_view = 'share_with_dashboard_tab';

        this.form_errors = [];

        this.shared_filters = null;

        // Shared filters name
        this.shared_filters_name = null;

        // Shared filters behaviors options
        this.overwrite_sharable_field_filters = true;

        this.readable_field_filters = null;
        this.selectionnable_field_filters = null;

        this.selectionnable_dashboards = [];
        this.selected_dashboards_shared_with = [];

        this.dashboard_query_string = null;

        this.selected_field_filters = null;
        this.selected_shared_with_dashboard_ids_numranges = [];

        this.on_validation_callback = null;
        this.on_close_callback = null;
        this.on_delete_callback = null;
    }

    /**
     * is_readable_field_filter_selected
     * - Check if active field filter selected
     *
     * @param {IReadableFieldFilters} [readable_field_filters]
     * @returns {boolean}
     */
    public is_readable_field_filter_selected(readable_field_filters: IReadableFieldFilters): boolean {
        if (!readable_field_filters || !this.selected_field_filters) {
            return false;
        }

        const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
            { vo_field_ref: readable_field_filters.vo_field_ref }
        );

        const api_type_id_filters = this.selected_field_filters[vo_field_ref.api_type_id];

        if (api_type_id_filters == null) {
            return false;
        }

        return api_type_id_filters[vo_field_ref.field_id];
    }

    /**
     * field_filters_exist_in_dasboard
     * - Check if field filters exist in selected dashboard
     */
    public field_filters_exist_in_dasboard(
        vo_field_ref: Partial<VOFieldRefVO>,
        dashboard: DashboardVO
    ): boolean {
        const dashboard_field_filters = this.default_field_filters_by_dashboard_id[dashboard.id];

        let has_field_filter = false;

        for (const api_type_id in dashboard_field_filters) {
            const field_filter = dashboard_field_filters[api_type_id];

            for (const field_id in field_filter) {
                const has_api_type_id = (vo_field_ref.api_type_id == api_type_id);
                const has_field_id = (vo_field_ref.field_id == field_id);

                if (has_api_type_id && has_field_id) {
                    has_field_filter = true;
                    break;
                }
            }

            if (has_field_filter) {
                break;
            }
        }

        return has_field_filter;
    }

    /**
     * is_sharable_field_filter
     * - Check if field filter is sharable
     *
     * @param {Partial<VOFieldRefVO>} vo_field_ref
     * @returns {boolean}
     */
    public is_sharable_field_filter(vo_field_ref: Partial<VOFieldRefVO>): boolean {
        let is_sharable = false;

        // If field filter exist in every selected dashboard
        // we can share it
        is_sharable = this.selected_dashboards_shared_with.every((dashboard) => {
            return this.field_filters_exist_in_dasboard(vo_field_ref, dashboard);
        });

        return is_sharable;
    }

    /**
     * is_selectionnable_field_filter
     * - Check if field filter is selectionnable
     *
     * @param {Partial<VOFieldRefVO>} vo_field_ref
     * @returns {boolean}
     */
    public is_selectionnable_field_filter(vo_field_ref: Partial<VOFieldRefVO>): boolean {
        let is_selectionnable = false;

        // If field filter exist in every selected dashboard
        // we can share it
        is_selectionnable = this.selected_dashboards_shared_from.every((dashboard) => {
            return this.field_filters_exist_in_dasboard(vo_field_ref, dashboard);
        });

        return is_selectionnable;
    }

    /**
     * Handle Toggle Select Sharable Filter
     *  - Select or unselect the given readable_field_filters
     *
     * @param {IReadableFieldFilters} [readable_field_filters]
     * @returns {void}
     */
    public toggle_select_field_filters(readable_field_filters: IReadableFieldFilters): void {
        const vo_field_ref = readable_field_filters.vo_field_ref;

        const field_filters_selection: { [api_type_id: string]: { [field_id: string]: any } } = {};

        field_filters_selection[vo_field_ref.api_type_id] = {};
        field_filters_selection[vo_field_ref.api_type_id][vo_field_ref.field_id] = null;

        if (this.is_readable_field_filter_selected(readable_field_filters)) {
            this.set_selected_field_filters(field_filters_selection, false);

        } else {
            this.set_selected_field_filters(field_filters_selection, true);
        }
    }

    /**
     * set_selected_field_filters
     *  - Set selected field filters to given value
     *
     * @param {FieldFiltersVO} field_filters
     * @param {boolean} value
     */
    public set_selected_field_filters(field_filters: FieldFiltersVO, value: boolean) {
        const selected_field_filters: {
            [api_type_id: string]: { [field_id: string]: boolean }
        } = cloneDeep(this.selected_field_filters) ?? {};

        for (const api_type_id in field_filters) {
            const filter = field_filters[api_type_id];

            for (const field_id in filter) {
                selected_field_filters[api_type_id] = selected_field_filters[api_type_id] ?? {};
                selected_field_filters[api_type_id][field_id] = value;
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
    public dashboard_label(dashboard: DashboardVO): string {
        if (!dashboard) {
            return '';
        }

        return dashboard.id + ' | ' + this.t(dashboard.title);
    }

    /**
     * page_label
     *
     * @param {DashboardPageVO} page
     * @returns {string}
     */
    public page_label(page: DashboardPageVO): string {
        if (!page) {
            return '';
        }

        return page.id + ' | ' + this.t(page.titre_page);
    }

    /**
     * Set Active Tab View
     *
     * @param {string} [tab_view]
     */
    public set_active_tab_view(tab_view: string): void {
        this.active_tab_view = tab_view;
    }
}
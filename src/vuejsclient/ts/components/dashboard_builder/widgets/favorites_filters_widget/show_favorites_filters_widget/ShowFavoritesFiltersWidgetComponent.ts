import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../../../../VueComponentBase';
import './ShowFavoritesFiltersWidgetComponent.scss';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import FavoritesFiltersWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import ExportContextQueryToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/ModuleTableFieldVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { cloneDeep, isEmpty, isEqual } from 'lodash';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import ReloadFiltersWidgetController from '../../reload_filters_widget/RealoadFiltersWidgetController';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import FavoritesFiltersModalComponent from '../modal/FavoritesFiltersModalComponent';
import FieldValueFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import MonthFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/MonthFilterWidgetManager';
import YearFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/YearFilterWidgetManager';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import TableWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import FavoritesFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FavoritesFiltersVOManager';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';

@Component({
    template: require('./ShowFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class ShowFavoritesFiltersWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private set_active_field_filters: (active_field_filters: FieldFiltersVO) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    private tmp_active_favorites_filters_option: FavoritesFiltersVO = null;
    private old_tmp_active_favorites_filters_option: FavoritesFiltersVO = null;

    private old_active_field_filters: FieldFiltersVO = null;

    private favorites_filters_visible_options: FavoritesFiltersVO[] = [];

    private warn_existing_external_filters: boolean = false;

    private force_filter_change: boolean = false;

    private actual_query: string = null;

    private is_initialized: boolean = false;
    private is_updating = false;

    private old_widget_options: FavoritesFiltersWidgetOptionsVO = null;

    private last_calculation_cpt: number = 0;

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(
        this.update_visible_options.bind(this),
        50,
        { leading: false, trailing: true }
    );
    private throttled_update_active_field_filters = ThrottleHelper.declare_throttle_without_args(
        this.update_active_field_filters.bind(this),
        50,
        { leading: false, trailing: true }
    );
    private throttled_open_favorites_filters_modal = ThrottleHelper.declare_throttle_with_stackable_args(
        this.open_favorites_filters_modal.bind(this),
        1000,
        { leading: false, trailing: true }
    );

    /**
     * On mounted
     *  - Happen on component mount
     *
     * @returns {void}
     */
    private mounted(): void {
        ReloadFiltersWidgetController.getInstance().register_reloader(
            this.dashboard_page,
            this.page_widget,
            this.reload_visible_options.bind(this),
        );
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the tmp_active_favorites_filters_option with default widget options
     *
     * @returns {void}
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.throttled_update_visible_options();
    }

    /**
     * Watch on get_active_field_filters
     *  - Shall happen first on component init or each time get_active_field_filters changes
     *  - Initialize the tmp_active_favorites_filters_option with active filter options
     *
     * @returns {void}
     */
    @Watch('get_active_field_filters', { deep: true })
    private onchange_active_field_filters(): void {
        this.throttled_update_visible_options();
    }

    // /**
    //  * onchange_tmp_active_filter_options
    //  * tmp_active_favorites_filters_option is the visible active filters of the widget
    //  *  - Handle change on tmp filter active options
    //  *  - Happen each time tmp_active_favorites_filters_option changes
    //  *
    //  * @returns {void}
    //  */
    // @Watch('tmp_active_favorites_filters_option')
    private async validate_favorites_filters_selection(): Promise<void> {

        if (!this.tmp_active_favorites_filters_option) {
            if (this.is_updating) {
                this.tmp_active_favorites_filters_option = this.old_tmp_active_favorites_filters_option;
            }

            return;
        }

        const field_filters = this.tmp_active_favorites_filters_option?.field_filters;

        if (
            isEmpty(field_filters) ||
            !isEqual(this.tmp_active_favorites_filters_option, this.old_tmp_active_favorites_filters_option)
        ) {
            this.old_active_field_filters = cloneDeep(this.get_active_field_filters);
            await this.reset_all_visible_active_field_filters();
        }

        this.throttled_update_active_field_filters();

        this.old_tmp_active_favorites_filters_option = cloneDeep(this.tmp_active_favorites_filters_option);
    }

    /**
     * Update visible option
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     *
     * @returns {Promise<void>}
     */
    private async update_visible_options(): Promise<void> {

        this.tmp_active_favorites_filters_option = null;

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.vo_field_ref)) {
            this.favorites_filters_visible_options = [];
            return;
        }

        // Init context filter of the current filter
        let whole_active_field_filters: FieldFiltersVO = null;

        // Get whole active field filters from context
        whole_active_field_filters = this.get_active_field_filters ?? null;

        // Say if has active field filter
        let has_active_field_filter: boolean = !!(whole_active_field_filters);

        // case when has active context filter but active visible filter empty
        // - try to apply context filter or display active favorites filter application fail alert
        if (has_active_field_filter &&
            (!this.tmp_active_favorites_filters_option)) {

            this.warn_existing_external_filters = !this.try_apply_actual_active_favorites_filters(whole_active_field_filters);
        }

        let field_sort: VOFieldRefVO = this.vo_field_ref;

        let tmp: FavoritesFiltersVO[] = [];

        let query_api_type_id: string = this.vo_field_ref.api_type_id;

        tmp = await query(query_api_type_id)
            .filter_by_text_eq('page_id', this.dashboard_page.id.toString())
            .filter_by_text_eq('owner_id', this.data_user.id.toString())
            .set_limit(this.widget_options?.max_visible_options)
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .select_vos<FavoritesFiltersVO>();

        // We must keep and apply the last request response
        // - This widget may already have perform a request
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        // Delete overflow options
        if (tmp && (tmp.length > this.widget_options?.max_visible_options)) {
            tmp.splice(
                (this.widget_options?.max_visible_options - 1),
                (tmp.length - this.widget_options?.max_visible_options)
            );
        }

        if (!(tmp?.length > 0)) {
            tmp = [];
        }

        this.favorites_filters_visible_options = tmp;
    }

    /**
     * Try Apply Actual Active Favorites Filters
     *  - Make the showable favorite active filter options by the given filter
     *
     * @param { FieldFiltersVO} [favorites_filters]
     * @returns {boolean}
     */
    private try_apply_actual_active_favorites_filters(
        favorites_filters: FieldFiltersVO
    ): boolean {

        const favorites_filters_option = this.favorites_filters_visible_options.find(
            (f) => isEqual(f?.field_filters, favorites_filters)
        );

        if (favorites_filters_option) {
            this.tmp_active_favorites_filters_option = favorites_filters_option;
        }

        return true;
    }

    /**
     * query_update_visible_options
     *
     * @param query_ {string}
     * @return {Promise<void>}
     */
    private async query_update_visible_options(query_: string): Promise<void> {
        this.actual_query = query_;
        await this.throttled_update_visible_options();
    }

    /**
     * Reload Visible Options
     *
     * @returns {void}
     */
    private reload_visible_options(): void {
        // Reset favorite selected option
        this.throttled_update_visible_options();
    }

    /**
     * Update Active Field Filters
     *  - Update page filters, we must have a delay
     *  - Must have to be a combination between current active_field_filters and favorites_field_filters
     *  - Overwrite active_field_filters with the favorites one
     *  - We should keep the hidden page field filters
     *
     * @returns {void}
     */
    private async update_active_field_filters(): Promise<void> {
        const favorites_filters: FavoritesFiltersVO = this.tmp_active_favorites_filters_option;
        const old_active_field_filters = this.old_active_field_filters;

        // get default hidden field_filters of the dashboard_page
        let field_filters: FieldFiltersVO = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_page_id(
            this.dashboard_page.id
        );

        if (!favorites_filters?.options?.overwrite_active_field_filters) {
            field_filters = FieldFiltersVOManager.merge_field_filters(field_filters, old_active_field_filters);
        }

        if (favorites_filters?.field_filters) {
            field_filters = FieldFiltersVOManager.merge_field_filters(field_filters, favorites_filters?.field_filters);
        }

        // Case when is_updating is true,
        // We may want to overwrite favorites_filters with selected one
        // We must do it to have the possible non-selected options in the modal
        if (this.is_updating) {
            field_filters = FieldFiltersVOManager.merge_field_filters(field_filters, this.get_active_field_filters);
        }

        this.set_active_field_filters(field_filters);
    }

    /**
     * Reset All Visible Active Filters
     *
     * @returns {void}
     */
    private async reset_all_visible_active_field_filters() {

        let promises = [];
        for (const db_id in ResetFiltersWidgetController.getInstance().reseters) {
            const db_reseters = ResetFiltersWidgetController.getInstance().reseters[db_id];

            for (const p_id in db_reseters) {
                const p_reseters = db_reseters[p_id];

                for (const w_id in p_reseters) {
                    const reset = p_reseters[w_id];

                    promises.push(reset());
                }
            }
        }

        await all_promises(promises);
    }

    /**
     * Reload All Visible Active Filters
     *  - Reload all active filters for all visible widgets
     *  - Once the favorites_filters have been saved for the current user,
     *    we need to load it from the DB (to be displayed in the list of favorites_filters)
     *
     * @return {void}
     */
    private reload_all_visible_active_filters(): void {
        for (const db_id in ReloadFiltersWidgetController.getInstance().reloaders) {
            const db_reloaders = ReloadFiltersWidgetController.getInstance().reloaders[db_id];

            for (const p_id in db_reloaders) {
                const p_reloaders = db_reloaders[p_id];

                for (const w_id in p_reloaders) {
                    const reload = p_reloaders[w_id];

                    reload();
                }
            }
        }
    }

    /**
     * handle_edit_favorites_filters
     *  - Open the modal to edit the favorites_filters
     *  - We must have a delay before open the modal (to load the active_field_filters)
     *  - Scenario: In case of a user select a favorites_filters it may take some time for the active_field_filters to be updated
     *
     * @param {FavoritesFiltersVO} favorites_filters
     */
    private async handle_edit_favorites_filters(favorites_filters: FavoritesFiltersVO): Promise<void> {
        // We must set is_updating to true in order to keep the favorites_filters
        this.is_updating = true;

        // TODO: if favorites_filters is active, keep it active if not set to active
        this.tmp_active_favorites_filters_option = favorites_filters;

        // We must have a delay before open the modal
        // which is the time to update the active_field_filters
        this.throttled_open_favorites_filters_modal(favorites_filters);
    }

    /**
     * Open Favorites Filters Modal
     * - Open the modal to edit the favorites_filters
     * - We must have a delay before open the modal
     *
     * @param {FavoritesFiltersVO[]} props
     * @returns {Promise<void>}
     */
    private async open_favorites_filters_modal(props: FavoritesFiltersVO[]): Promise<void> {
        const favorites_filters = props.shift();

        const selectionnable_active_field_filters = await this.get_selectionnable_active_field_filters();
        const exportable_data = await this.get_exportable_xlsx_params();

        this.get_Favoritesfiltersmodalcomponent.open_modal_for_update(
            {
                dashboard_page: this.dashboard_page,
                page_widget: this.page_widget,
                selectionnable_active_field_filters,
                exportable_data,
                favorites_filters
            },
            this.handle_update_favorites_filters.bind(this),
            this.handle_update_favorites_filters_close.bind(this),
            this.handle_delete_favorites_filters.bind(this),
        );
    }

    /**
     * Get Selectionnable Active Field Filters
     *
     * @return {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO }}
     */
    private async get_selectionnable_active_field_filters(): Promise<FieldFiltersVO> {
        const dashboard_page_id = this.dashboard_page.id;

        const field_value_filters_widgets_options = await FieldValueFilterWidgetManager.get_field_value_filters_widgets_options_metadata(dashboard_page_id);
        const month_filters_widgets_options = await MonthFilterWidgetManager.get_month_filters_widgets_options_metadata(dashboard_page_id);
        const year_filters_widgets_options = await YearFilterWidgetManager.get_year_filters_widgets_options_metadata(dashboard_page_id);

        const widgets_options: any[] = [];

        for (const name in field_value_filters_widgets_options) {
            const widget_options = field_value_filters_widgets_options[name].widget_options;
            widgets_options.push(widget_options);
        }

        for (const name in month_filters_widgets_options) {
            const widget_options = month_filters_widgets_options[name].widget_options;
            widgets_options.push(widget_options);
        }

        for (const name in year_filters_widgets_options) {
            const widget_options = year_filters_widgets_options[name].widget_options;
            widgets_options.push(widget_options);
        }

        const field_filters = FieldFiltersVOManager.filter_visible_field_filters(
            widgets_options,
            this.get_active_field_filters,
        );

        return field_filters;
    }

    /**
     * Get Exportable XLSX Params
     *
     * @param {boolean} [limit_to_page]
     */
    private async get_exportable_xlsx_params(limit_to_page: boolean = true): Promise<{ [title_name_code: string]: ExportContextQueryToXLSXParamVO }> {

        const exportable_xlsx_params = await TableWidgetManager.create_exportable_valuetables_xlsx_params(
            this.dashboard,
            this.dashboard_page,
            this.get_active_field_filters,
            this.all_page_widgets_by_id
        );

        return exportable_xlsx_params;
    }

    private handle_update_favorites_filters_close(): void {
        this.is_updating = false;
    }

    /**
     * Handle Delete Favorites Filters
     * - Delete the favorites_filters for the current user
     *
     * @returns {Promise<void>}
     */
    private async handle_delete_favorites_filters(favorites_filters: FavoritesFiltersVO): Promise<void> {

        if (!favorites_filters) {
            return;
        }

        let self = this;

        self.snotify.async(self.label('dashboard_viewer.delete_favorites_filters.start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await FavoritesFiltersVOManager.delete_favorites_filters(
                    favorites_filters
                );

                if (success) {
                    self.reload_all_visible_active_filters();
                    resolve({
                        body: self.label('dashboard_viewer.delete_favorites_filters.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_viewer.delete_favorites_filters.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    /**
     * Handle Update Favorites Filters
     *  - Save active dashboard filters for the current user
     *
     * @param {FavoritesFiltersVO} [favorites_filters]
     * @returns {Promise<void>}
     */
    private async handle_update_favorites_filters(favorites_filters: FavoritesFiltersVO): Promise<void> {
        // We can set the is_updating to false
        // As the modal is closed (we are in the callback of the modal)
        this.is_updating = false;

        if (!favorites_filters) {
            return;
        }

        let self = this;

        self.snotify.async(self.label('dashboard_viewer.save_favorites_filters.start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await FavoritesFiltersVOManager.save_favorites_filters(
                    favorites_filters
                );

                if (success) {
                    self.reload_all_visible_active_filters();
                    resolve({
                        body: self.label('dashboard_viewer.save_favorites_filters.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_viewer.save_favorites_filters.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    /**
     * Get widget_options
     *
     * @return {FavoritesFiltersWidgetOptionsVO}
     */
    get widget_options(): FavoritesFiltersWidgetOptionsVO {
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
     * Get can_select_multiple
     *
     * @return {boolean}
     */
    get can_select_multiple(): boolean {

        if (!this.widget_options) {
            return false;
        }

        // return !!this.widget_options.can_select_multiple;
        return false;
    }

    /**
     * Get is_translatable_type
     *
     * @return {boolean}
     */
    get is_translatable_type(): boolean {

        if (!this.vo_field_ref) {
            return false;
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        if (!moduletable) {
            return false;
        }

        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        if (!field) {
            return false;
        }

        return field.field_type == ModuleTableFieldVO.FIELD_TYPE_translatable_text;
    }

    /**
     * Get vo_field_ref
     *
     * @return {VOFieldRefVO}
     */
    get vo_field_ref(): VOFieldRefVO {
        const vo = new FavoritesFiltersVO();

        return new VOFieldRefVO().from({
            api_type_id: vo._type,
            field_id: "name",
            _type: VOFieldRefVO.API_TYPE_ID
        });
    }

    /**
     * Get vo_field_ref_label
     *
     * @return {string}
     */
    get vo_field_ref_label(): string {

        if ((!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    /**
     * Get All Page Widget By Id
     * @return {{ [id: number]: DashboardPageWidgetVO }}
     */
    get all_page_widgets_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);
    }
}
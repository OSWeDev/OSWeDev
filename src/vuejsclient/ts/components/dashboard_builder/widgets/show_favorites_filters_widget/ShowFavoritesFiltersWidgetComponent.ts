import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import ShowFavoritesFiltersWidgetOptions from './options/ShowFavoritesFiltersWidgetOptions';
import './ShowFavoritesFiltersWidgetComponent.scss';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardFavoritesFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardFavoritesFiltersVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { cloneDeep, isEmpty, isEqual } from 'lodash';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import ReloadFiltersWidgetController from '../reload_filters_widget/RealoadFiltersWidgetController';
import ResetFiltersWidgetController from '../reset_filters_widget/ResetFiltersWidgetController';

@Component({
    template: require('./ShowFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class ShowFavoritesFiltersWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
    @ModuleDashboardPageAction
    private set_active_field_filters: (active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }) => void;
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

    private tmp_active_favorites_filters_option: DashboardFavoritesFiltersVO = null;
    private old_tmp_active_favorites_filters_option: DashboardFavoritesFiltersVO = null;

    private old_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

    private favorites_filters_visible_options: DashboardFavoritesFiltersVO[] = [];

    private warn_existing_external_filters: boolean = false;

    private force_filter_change: boolean = false;

    private actual_query: string = null;

    private is_initialized: boolean = false;
    private old_widget_options: ShowFavoritesFiltersWidgetOptions = null;

    private last_calculation_cpt: number = 0;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });
    private throttled_update_active_field_filters = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_active_field_filters.bind(this), 300, { leading: false, trailing: true });

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

    /**
     * On Change Tmp Filter Active Options
     * tmp_active_favorites_filters_option is the visible active filters of the widget
     *  - Handle change on tmp filter active options
     *  - Happen each time tmp_active_favorites_filters_option changes
     *
     * @returns {void}
     */
    @Watch('tmp_active_favorites_filters_option')
    private onchange_tmp_filter_active_options(): void {

        const page_filters = this.tmp_active_favorites_filters_option?.page_filters;

        if (this.is_initialized) {
            if (
                isEmpty(page_filters) ||
                !isEqual(this.tmp_active_favorites_filters_option, this.old_tmp_active_favorites_filters_option)
            ) {
                this.old_active_field_filters = cloneDeep(this.get_active_field_filters);
                this.reset_all_visible_active_field_filters();
            }

            this.throttled_update_active_field_filters();
        }

        this.old_tmp_active_favorites_filters_option = cloneDeep(this.tmp_active_favorites_filters_option);

        this.is_initialized = true;
    }

    /**
     * Update visible option
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     *
     * @returns {Promise<void>}
     */
    private async update_visible_options(): Promise<void> {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.vo_field_ref)) {
            this.favorites_filters_visible_options = [];
            return;
        }

        // Init context filter of the current filter
        let whole_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

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

        let active_field_filters_query: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

        let tmp: DashboardFavoritesFiltersVO[] = [];

        let query_api_type_id: string = this.vo_field_ref.api_type_id;

        tmp = await query(query_api_type_id)
            // .field(this.vo_field_ref.field_id, 'label', this.vo_field_ref.api_type_id)
            .filter_by_text_eq('owner_id', this.data_user.id.toString())
            .filter_by_text_eq('dashboard_id', this.dashboard_page.dashboard_id.toString())
            .set_limit(this.widget_options?.max_visible_options)
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .select_vos<DashboardFavoritesFiltersVO>();

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
     * @param { { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }} [favorites_filters]
     * @returns {boolean}
     */
    private try_apply_actual_active_favorites_filters(favorites_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }): boolean {

        this.tmp_active_favorites_filters_option = this.favorites_filters_visible_options.find(
            (f) => isEqual(f?.page_filters, favorites_filters)
        );

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
     *
     * @returns {void}
     */
    private update_active_field_filters(): void {
        const favorites_field_filters = this.tmp_active_favorites_filters_option?.page_filters;
        const old_active_field_filters = this.old_active_field_filters;

        let active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {};

        // Add default active filters with the old one
        for (const api_type_id in old_active_field_filters) {
            const filters = old_active_field_filters[api_type_id];

            for (const field_id in filters) {
                // the actual filter
                const filter = filters[field_id];

                // Add default active filters
                active_field_filters[api_type_id] = {};
                active_field_filters[api_type_id][field_id] = filter;
            }
        }

        // Add/Overwrite active filters with the favorites one
        for (const api_type_id in favorites_field_filters) {
            const filters = favorites_field_filters[api_type_id];

            for (const field_id in filters) {
                // the actual filter
                const filter = filters[field_id];

                active_field_filters[api_type_id] = (active_field_filters[api_type_id] != undefined) ?
                    active_field_filters[api_type_id] :
                    {};
                active_field_filters[api_type_id][field_id] = filter;
            }
        }

        this.set_active_field_filters(active_field_filters);
    }

    /**
     * Reset All Visible Active Filters
     *
     * @returns {void}
     */
    private reset_all_visible_active_field_filters(): void {
        for (const db_id in ResetFiltersWidgetController.getInstance().reseters) {
            const db_reseters = ResetFiltersWidgetController.getInstance().reseters[db_id];

            for (const p_id in db_reseters) {
                const p_reseters = db_reseters[p_id];

                for (const w_id in p_reseters) {
                    const reset = p_reseters[w_id];

                    reset();
                }
            }
        }
    }

    /**
     * Get widget_options
     *
     * @return {ShowFavoritesFiltersWidgetOptions}
     */
    get widget_options(): ShowFavoritesFiltersWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: ShowFavoritesFiltersWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ShowFavoritesFiltersWidgetOptions;
                options = options ? new ShowFavoritesFiltersWidgetOptions().from(options) : null;
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

        return field.field_type == ModuleTableField.FIELD_TYPE_translatable_text;
    }

    /**
     * Get vo_field_ref
     *
     * @return {VOFieldRefVO}
     */
    get vo_field_ref(): VOFieldRefVO {
        const vo = new DashboardFavoritesFiltersVO();

        return new VOFieldRefVO().from({
            api_type_id: vo._type,
            field_id: "name",
            _type: "vo_field_ref"
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
}
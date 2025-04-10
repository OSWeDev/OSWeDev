import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterEnumWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterEnumWidgetManager';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import FieldValueFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../../../../shared/tools/TypesHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import ValidationFiltersCallUpdaters from '../../validation_filters_widget/ValidationFiltersCallUpdaters';
import ValidationFiltersWidgetController from '../../validation_filters_widget/ValidationFiltersWidgetController';
import './FieldValueFilterEnumWidgetComponent.scss';
import FieldValueFilterWidgetController from '../FieldValueFilterWidgetController';

@Component({
    template: require('./FieldValueFilterEnumWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterEnumWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

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

    private default_values_changed: boolean = false; //Attribut pour reaffecter les valeurs par défaut lorsqu'elles sont modifiées.


    private tmp_active_filter_options: DataFilterOption[] = []; // Local active filter options

    private filter_visible_options: DataFilterOption[] = [];

    private warn_existing_external_filters: boolean = false;

    private excludes_values_labels: { [label: string]: boolean } = {};
    private count_by_filter_visible_opt_id: { [id: number]: number } = {};
    private is_loading_count_by_filter_visible_opt_id: { [id: number]: boolean } = {};

    private is_init: boolean = false;

    private actual_query: string = null;

    private old_widget_options: FieldValueFilterWidgetOptionsVO = null;
    private widget_options: FieldValueFilterWidgetOptionsVO = null;

    private should_load_filter_visible_options: boolean = true;

    private last_calculation_cpt: number = 0;

    private already_loaded_query_params: boolean = false;

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(
        'FieldValueFilterEnumWidgetComponent.throttled_update_visible_options',
        this.update_visible_options.bind(this),
        50,
        false
    );

    private throttled_load_filter_visible_options_count = ThrottleHelper.declare_throttle_without_args(
        'FieldValueFilterEnumWidgetComponent.throttled_load_filter_visible_options_count',
        this.load_filter_visible_options_count.bind(this),
        50,
        false
    );

    private throttled_reset_visible_options = ThrottleHelper.declare_throttle_without_args(
        'FieldValueFilterEnumWidgetComponent.throttled_reset_visible_options',
        this.reset_visible_options.bind(this),
        300,
        false
    );



    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get field(): ModuleTableFieldVO {
        if (!this.vo_field_ref) {
            return null;
        }

        return ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
    }

    get placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)];
    }

    get can_select_multiple(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_multiple;
    }

    get add_is_null_selectable(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.add_is_null_selectable;
    }

    get force_filter_by_all_api_type_ids(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.force_filter_by_all_api_type_ids;
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return new VOFieldRefVO().from(options.vo_field_ref);
    }

    get no_inter_filter(): boolean {
        return this.widget_options.no_inter_filter;
    }

    get has_other_ref_api_type_id(): boolean {
        return this.widget_options.has_other_ref_api_type_id;
    }

    get other_ref_api_type_id(): string {
        return this.widget_options.other_ref_api_type_id;
    }

    get is_button(): boolean {
        return this.widget_options.is_button;
    }

    /**
     * Can Select All
     *  - Can select all clickable text
     */
    get can_select_all(): boolean {
        if (!this.widget_options) {
            return false;
        }

        const can_select_all = !!this.widget_options.can_select_all;
        const query_limit = this.widget_options.max_visible_options;

        if (!can_select_all) {
            return can_select_all;
        }

        // May be shown only if active filter options
        // length smaller than actual query limit
        return this.filter_visible_options?.length < query_limit;
    }

    /**
     * Can Select None
     *  - Can select none clickable text
     */
    get can_select_none(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_none;
    }

    get show_count_value(): boolean {
        return this.widget_options.show_count_value;
    }

    /**
     * Get Vo Field Ref Multiple
     * @returns {VOFieldRefVO[]}
     */
    get vo_field_ref_multiple(): VOFieldRefVO[] {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref_multiple) || (!options.vo_field_ref_multiple.length)) {
            return null;
        }

        const res: VOFieldRefVO[] = [];

        for (const i in options.vo_field_ref_multiple) {
            res.push(new VOFieldRefVO().from(options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get default_values(): DataFilterOption[] {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        // May be an array if multi select or a single value if not
        if ((!(options?.default_filter_opt_values)) || (!options.default_filter_opt_values.length)) {
            return null;
        }

        return options.get_default_filter_options();
    }

    get exclude_values(): DataFilterOption[] {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.exclude_filter_opt_values) || (!options.exclude_filter_opt_values.length)) {
            return null;
        }

        return options.get_exclude_values();
    }

    @Watch('filter_visible_options', { deep: true, immediate: true })
    @Watch('vo_field_ref')
    @Watch('widget_options')
    private async try_apply_query_params() {

        if (this.already_loaded_query_params) {
            return;
        }
        if (!this.widget_options) {
            return;
        }
        if (!this.vo_field_ref) {
            return;
        }
        if ((!this.filter_visible_options) || (!this.filter_visible_options.length)) {
            return;
        }

        /**
         * Try apply query params
         */
        let update_tmp_active_filter_options: boolean = false;
        const updated_tmp_active_filter_options: DataFilterOption[] = [];

        // get all search params (including ?)
        const queryString = window.location.search;
        // it will look like this: ?product=shirt&color=blue&newuser&size=m

        // parse the query string's paramters
        const urlParams = new URLSearchParams(queryString);

        // On tente de forcer même si on trouve pas dans la liste déjà chargée
        // Pour l'instant c'est très lié à un type number, à voir comment on adapte par la suite
        const param_name = FieldValueFilterWidgetController.get_query_param_filter_name(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id);
        const filter_value_str: string = urlParams.get(param_name);
        if (filter_value_str != null) {
            const filter_value_number: number = parseInt(filter_value_str);

            // On doit retrouver la valeur dans les options disponibles
            let filter_value: DataFilterOption = null;
            for (const i in this.filter_visible_options) {
                const filter_opt = this.filter_visible_options[i];
                if (filter_opt.numeric_value == filter_value_number) {
                    filter_value = filter_opt;
                    break;
                }
            }

            if (filter_value) {
                update_tmp_active_filter_options = true;
                updated_tmp_active_filter_options.push(filter_value);
            } else {
                filter_value = new DataFilterOption(
                    DataFilterOption.STATE_SELECTED,
                    filter_value_str,
                    null,
                    false,
                    false,
                    false,
                    null,
                    null,
                    null,
                    filter_value_number,
                    null,
                    null,
                    true,
                    [],
                    filter_value_str
                );
                update_tmp_active_filter_options = true;
                updated_tmp_active_filter_options.push(filter_value);
                this.filter_visible_options.push(filter_value);
            }
        }

        if (update_tmp_active_filter_options) {
            this.tmp_active_filter_options = updated_tmp_active_filter_options;
            this.already_loaded_query_params = true;
            this.onchange_tmp_active_filter_options();
        }
    }

    /**
     * Watch on page_widget
     *
     * @returns {void}
     */
    @Watch('page_widget', { immediate: true })
    private onchange_page_widget_options(): void {
        this.widget_options = this.get_widget_options();
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the tmp_active_filter_options with default widget_options
     *
     * @returns {void}
     */
    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options(): Promise<void> {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }

            if (!isEqual(this.widget_options.default_filter_opt_values, this.old_widget_options.default_filter_opt_values)) {
                this.default_values_changed = true;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.is_init = false;

        this.throttled_update_visible_options();
    }

    @Watch('get_active_field_filters', { deep: true })
    @Watch('get_active_api_type_ids', { deep: true })
    @Watch('get_query_api_type_ids', { deep: true })
    private async onchange_active_field_filters() {
        this.throttled_update_visible_options();
        this.set_all_count_by_filter_visible_loading(true);
    }

    /**
     * onchange_tmp_active_filter_options
     * tmp_active_filter_options is the visible active filters of the widget
     *  - Happen each time tmp_active_filter_options changes
     *
     * @returns {void}
     */
    @Watch('tmp_active_filter_options')
    private onchange_tmp_active_filter_options(): void {

        if (!this.widget_options) {
            return;
        }

        let active_filter_options: DataFilterOption[] = null;
        let context_filter: ContextFilterVO = null;

        if (TypesHandler.getInstance().isArray(this.tmp_active_filter_options)) {
            active_filter_options = this.tmp_active_filter_options;
        } else if (this.tmp_active_filter_options != null) {
            active_filter_options = [this.tmp_active_filter_options as any];
        }

        // If it not multi select, we take the first value
        if (!this.can_select_multiple && active_filter_options?.length > 1) {
            active_filter_options = active_filter_options.slice(0, 1);
            this.tmp_active_filter_options = active_filter_options;
        }

        // If there is no active filter, we remove the filter
        if ((!active_filter_options) || (!active_filter_options.length)) {
            this.remove_active_field_filter({
                vo_type: this.vo_field_ref.api_type_id,
                field_id: this.vo_field_ref.field_id
            });
            return;
        }

        let has_null_value: boolean = false;

        // Translate active options to context filter
        for (const i in active_filter_options) {
            const active_option: DataFilterOption = active_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            const new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                active_option,
                null,
                this.field,
                this.vo_field_ref
            );

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {
                context_filter = ContextFilterVOHandler.merge_context_filter_vos(
                    context_filter,
                    new_context_filter
                );
            }
        }

        if (has_null_value) {
            const cf_null_value: ContextFilterVO = new ContextFilterVO();
            cf_null_value.field_name = this.vo_field_ref.field_id;
            cf_null_value.vo_type = this.vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!context_filter) {
                context_filter = cf_null_value;
            } else {
                context_filter = ContextFilterVO.or([cf_null_value, context_filter]);
            }
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: context_filter,
        });

        this.set_all_count_by_filter_visible_loading(true);
    }

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    private async query_update_visible_options(queryStr: string) {
        this.actual_query = queryStr;
        this.throttled_update_visible_options();
    }

    private async reset_visible_options() {
        this.tmp_active_filter_options = [];
        this.filter_visible_options = [];
        // On update le visuel de tout le monde suite au reset
        this.throttled_update_visible_options();
    }

    /**
     * update_visible_options
     * This widget may depend on other widget active filters options
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     *
     * @returns {Promise<void>}
     */
    private async update_visible_options(): Promise<void> {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Init context filter of the current filter
        // Get context filter from store
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_from_field_filters(
            this.vo_field_ref,
            this.get_active_field_filters
        );

        // Say if has active field filter
        const has_active_field_filter: boolean = !!(root_context_filter);

        // Si on a des valeurs par défaut, on va faire l'init
        const old_is_init: boolean = this.is_init;

        this.is_init = true;

        // case when not currently initializing
        if (!old_is_init) {
            if (this.default_values) {
                // Si je n'ai pas de filtre actif OU que ma valeur de default values à changée, je prends les valeurs par défaut
                // case when does not have active filter
                if (!has_active_field_filter || this.default_values_changed) {
                    this.tmp_active_filter_options = this.default_values;
                    this.default_values_changed = false;

                    ValidationFiltersWidgetController.getInstance().throttle_call_updaters(
                        new ValidationFiltersCallUpdaters(
                            this.dashboard_page.dashboard_id,
                            this.dashboard_page.id,
                            this.page_widget.id
                        )
                    );

                    return;
                }
            }
        }

        // case when has active context_filter but active visible_filter empty
        // - try to apply context_filter or display filter application fail alert
        if (has_active_field_filter &&
            (!(this.tmp_active_filter_options?.length > 0))) {

            this.warn_existing_external_filters = !this.try_apply_context_filter(root_context_filter);
        }

        this.set_all_count_by_filter_visible_loading(true);

        // Load filter visible options once
        if (this.should_load_filter_visible_options) {
            // Load filter visible options from widget options
            await this.load_filter_visible_options(launch_cpt);
        }

        // Si on doit afficher le compteur, on fait les requêtes nécessaires
        this.throttled_load_filter_visible_options_count();
    }

    /**
     * load_filter_visible_options
     * - Load filter visible options from widget options
     *
     * @param {number} launch_cpt
     * @returns {Promise<void>}
     */
    private async load_filter_visible_options(launch_cpt: number): Promise<void> {

        let data_filter_options: DataFilterOption[] = await FieldValueFilterEnumWidgetManager.find_enum_data_filters_from_widget_options(
            this.dashboard,
            this.get_dashboard_api_type_ids,
            this.get_discarded_field_paths,
            this.widget_options,
            this.get_active_field_filters,
            {
                active_api_type_ids: this.get_active_api_type_ids,
                query_api_type_ids: this.get_query_api_type_ids,
                user: this.data_user,
            }
        );

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        if (!(data_filter_options?.length > 0)) {
            data_filter_options = [];
        }

        // Default showed filter opt values (force all filters to be shown if not already in the query result)
        const default_showed_filter_opt_values = this.widget_options.default_showed_filter_opt_values;

        if (default_showed_filter_opt_values?.length > 0) {
            // Add default_showed_filter_opt_values to data_filter_options (if not already in)
            const filter_options_to_add = default_showed_filter_opt_values.filter(
                (default_showed_filter_opt_value: DataFilterOption) => !data_filter_options.find(
                    (data_filter_option: DataFilterOption) => data_filter_option.numeric_value == default_showed_filter_opt_value.numeric_value
                )
            );

            data_filter_options = data_filter_options.concat(filter_options_to_add);
        }

        for (const i in data_filter_options) {
            const tmpi = data_filter_options[i];

            tmpi.label = this.t(tmpi.label);
        }

        if (this.add_is_null_selectable) {
            data_filter_options.unshift(new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.label('dataFilteroption.is_null'),
                RangeHandler.MIN_INT,
            ));
        }

        // We should keep all distinct filters
        this.filter_visible_options = [this.filter_visible_options, data_filter_options].reduce(
            (accumulator: DataFilterOption[], currentVal: DataFilterOption[]) => {

                // Add all filters that are not in accumulator (by numeric_value)
                const overflowing_filters = currentVal.filter(
                    (filter: DataFilterOption) => !accumulator.find(
                        (acc_filter) => acc_filter.numeric_value === filter.numeric_value
                    )
                );

                // Accumulator shall keep all distinct filters of each iteration
                return accumulator.concat(overflowing_filters);
            }
        );

        // Reorder filter_visible_options by numeric_value (ASC)
        this.filter_visible_options.sort((a, b) => {
            return a.numeric_value - b.numeric_value;
        });

        // is_button and default_showed_filter_opt_values may not change
        // if filter_visible_options is not empty, we should not load it again
        if (
            this.is_button && (
                this.widget_options?.default_showed_filter_opt_values?.length > 0 &&
                this.filter_visible_options?.length > 0
            )
        ) {
            this.should_load_filter_visible_options = false;
        }
    }

    /**
     * Handle Select All
     *  - Select all fields of the current active filter
     */
    private handle_select_all(): void {
        let selection: DataFilterOption[] = [];

        selection = this.filter_visible_options?.map((filter) =>
            new DataFilterOption(DataFilterOption.STATE_SELECTED, filter.label, filter.id)
        );

        this.tmp_active_filter_options = selection;
    }

    /**
     * Handle Select None
     *  - Remove all fields of the current selected active filter
     */
    private handle_select_none(): void {
        this.tmp_active_filter_options = [];
    }

    /**
     * load_filter_visible_options_count
     *  - Load filter visible options count from widget options
     *
     * @returns {Promise<void>}
     */
    private async load_filter_visible_options_count(): Promise<void> {

        if (!this.show_count_value) {
            this.is_loading_count_by_filter_visible_opt_id = {};
            this.count_by_filter_visible_opt_id = {};
            return;
        }

        this.count_by_filter_visible_opt_id = await FieldValueFilterEnumWidgetManager.find_enum_data_filters_count_from_widget_options(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            this.tmp_active_filter_options,
            this.filter_visible_options,
            {
                active_api_type_ids: this.get_active_api_type_ids,
                query_api_type_ids: this.get_query_api_type_ids,
                user: this.data_user,
            }
        );

        this.set_all_count_by_filter_visible_loading(false);
    }

    /**
     * set_all_count_by_filter_visible_loading
     *  - Set all count by active filter options loading
     *
     * @param {boolean} val
     * @returns {void}
     */
    private set_all_count_by_filter_visible_loading(val: boolean): void {
        for (const key in this.tmp_active_filter_options) {
            const enum_data_filter = this.tmp_active_filter_options[key];

            const is_in_active_filters_options = this.tmp_active_filter_options?.find((active_filter_option) =>
                active_filter_option.numeric_value === enum_data_filter.numeric_value
            );

            if (this.tmp_active_filter_options?.length > 0 && !is_in_active_filters_options) {
                this.is_loading_count_by_filter_visible_opt_id[enum_data_filter.numeric_value] = false;
            } else {
                this.is_loading_count_by_filter_visible_opt_id[enum_data_filter.numeric_value] = val;
            }
        }
    }

    /**
     * get_field_filters_by_api_type_ids
     *  - Get field filters by api type id
     *
     * @param {string[]} available_api_type_ids
     * @param {boolean} switch_current_field
     * @returns {{ [api_type_id: string]: FieldFiltersVO }}
     */
    private get_field_filters_by_api_type_ids(
        available_api_type_ids: string[],
        switch_current_field: boolean,
    ): { [api_type_id: string]: FieldFiltersVO } {
        const field_filters_by_api_type_id: { [api_type_id: string]: FieldFiltersVO } = {};

        let active_field_filters: FieldFiltersVO = null;

        if (!this.no_inter_filter) {
            active_field_filters = this.get_active_field_filters;
        }

        const field_filters_for_request: FieldFiltersVO = FieldFiltersVOManager.clean_field_filters_for_request(
            active_field_filters
        );

        for (const api_type_id in field_filters_for_request) {

            for (const i in available_api_type_ids) {
                const api_type_id_sup: string = available_api_type_ids[i];

                if (!field_filters_by_api_type_id[api_type_id_sup]) {
                    field_filters_by_api_type_id[api_type_id_sup] = {};
                }

                if (!this.get_query_api_type_ids.includes(api_type_id)) {
                    field_filters_by_api_type_id[api_type_id_sup][api_type_id] = field_filters_for_request[api_type_id];
                    continue;
                }

                let new_api_type_id: string = api_type_id_sup;

                if (this.force_filter_by_all_api_type_ids) {
                    new_api_type_id = api_type_id;
                }

                field_filters_by_api_type_id[api_type_id_sup][new_api_type_id] = cloneDeep(field_filters_for_request[api_type_id]);

                for (const field_id in field_filters_by_api_type_id[api_type_id_sup][new_api_type_id]) {
                    // Si je suis sur le field de la requête, je ne le prend pas en compte, il sera fait plus loin
                    if (switch_current_field && (field_id == this.vo_field_ref.field_id)) {
                        field_filters_by_api_type_id[api_type_id_sup][new_api_type_id][field_id] = null;
                        continue;
                    }

                    if (!field_filters_by_api_type_id[api_type_id_sup][new_api_type_id][field_id]) {
                        continue;
                    }

                    field_filters_by_api_type_id[api_type_id_sup][new_api_type_id][field_id].vo_type = api_type_id_sup;
                }
            }
        }

        return field_filters_by_api_type_id;
    }

    /**
     * try_apply_context_filter
     *  - Make the active filter options by the given context_filter
     *
     * @param {ContextFilterVO} filter
     * @returns {boolean}
     */
    private try_apply_context_filter(context_filter: ContextFilterVO): boolean {

        // create single data context_filter to apply
        const createDataFilter = (val: number): DataFilterOption => {
            const dataFilter = new DataFilterOption(
                DataFilterOption.STATE_SELECTED,
                this.t(this.field.enum_values[val]),
                val
            );
            dataFilter.string_value = this.field.enum_values[val];
            dataFilter.numeric_value = val;

            return dataFilter;
        };

        // case when no context_filter reset visible active context_filter options
        if (!context_filter) {
            if (this.tmp_active_filter_options && this.tmp_active_filter_options.length) {
                this.tmp_active_filter_options = [];
            }
            return true;
        }

        const active_filter_options: DataFilterOption[] = [];

        // context_filter must have one of the given param to continue
        if (!(context_filter.param_numranges?.length > 0)
            // TODO: Seen With Michael Waiting to Fix the final comportment
            // && context_filter.param_numeric == null
        ) {
            if (this.tmp_active_filter_options && this.tmp_active_filter_options.length) {
                this.tmp_active_filter_options = [];
            }
            return true;
        }

        // case context_filter param_numeric is sets
        // TODO: Seen With Michael Waiting to Fix the final comportment
        // if (context_filter.param_numeric != null) {
        //     const dataFilter = createDataFilter(context_filter.param_numeric);
        //     active_filter_options.push(dataFilter);
        // }

        // case context_filter param_numranges is sets
        if (context_filter.param_numranges?.length > 0) {
            RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (num: number) => {
                const dataFilter = createDataFilter(num);
                active_filter_options.push(dataFilter);
            });
        }

        this.tmp_active_filter_options = active_filter_options;

        return true;
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }

    /**
     * select_option
     *  - Select option
     *
     * @param {DataFilterOption} dfo
     * @returns {void}
     */
    private select_option(dfo: DataFilterOption): void {
        if (!dfo) {
            return;
        }

        // Find index of data_filter in tmp_active_filter_options
        const index: number = this.tmp_active_filter_options.findIndex(
            (e) => e.numeric_value == dfo.numeric_value
        );

        if (index >= 0) {
            // If data_filter is already in tmp_active_filter_options, remove it
            this.tmp_active_filter_options.splice(index, 1);
        } else {
            // If data_filter is not in tmp_active_filter_options, add it
            this.tmp_active_filter_options.push(dfo);
        }

        // If it not multi select, we just keep the given data_filter
        if (!this.can_select_multiple) {
            this.tmp_active_filter_options = this.tmp_active_filter_options.filter(
                (e) => e.numeric_value == dfo.numeric_value
            );
        }
    }

    private getStyle(dfo: DataFilterOption) {
        if (!dfo) {
            return null;
        }

        const dfo_id: number = dfo.numeric_value;

        let bg_color: string = this.widget_options.enum_bg_colors && this.widget_options.enum_bg_colors[dfo_id];
        let fg_color: string = this.widget_options.enum_fg_colors && this.widget_options.enum_fg_colors[dfo_id];

        bg_color = bg_color ?? null;
        fg_color = fg_color ?? 'white';

        if (bg_color?.length > 0) {
            return {
                backgroundColor: bg_color + ' !important',
                borderColor: bg_color + ' !important',
                color: fg_color + ' !important'
            };
        }

        return null;
    }

    /**
     * get_widget_options
     *  - Get widget options from page_widget json_options
     *
     * @returns {FieldValueFilterWidgetOptionsVO}
     */
    private get_widget_options(): FieldValueFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options?.length > 0) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                options = options ? new FieldValueFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}
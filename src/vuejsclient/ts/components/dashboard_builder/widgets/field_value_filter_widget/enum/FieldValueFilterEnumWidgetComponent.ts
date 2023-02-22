import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterHandler from '../../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTable from '../../../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../../../../../shared/tools/EnvHandler';
import PromisePipeline from '../../../../../../../shared/tools/PromisePipeline/PromisePipeline';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../../../../shared/tools/TypesHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import ValidationFiltersCallUpdaters from '../../validation_filters_widget/ValidationFiltersCallUpdaters';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import ValidationFiltersWidgetController from '../../validation_filters_widget/ValidationFiltersWidgetController';
import FieldValueFilterWidgetController from '../FieldValueFilterWidgetController';
import FieldValueFilterWidgetOptions from '../options/FieldValueFilterWidgetOptions';
import './FieldValueFilterEnumWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterEnumWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterEnumWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
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


    private tmp_filter_active_options: DataFilterOption[] = []; // Local active filter options

    private filter_visible_options: DataFilterOption[] = [];

    private warn_existing_external_filters: boolean = false;

    private excludes_values_labels: { [label: string]: boolean } = {};
    private count_by_filter_visible_opt_id: { [id: number]: number } = {};

    private is_init: boolean = false;

    private actual_query: string = null;
    private old_widget_options: FieldValueFilterWidgetOptions = null;

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });
    private last_calculation_cpt: number = 0;

    private throttled_reset_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.reset_visible_options.bind(this), 300, { leading: false, trailing: true });

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    @Watch('get_active_field_filters', { deep: true })
    @Watch('get_active_api_type_ids')
    @Watch('get_query_api_type_ids')
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    /**
     * Computed widget options
     *  - Happen on component|widget creation
     * @returns FieldValueFilterWidgetOptions
     */
    get widget_options(): FieldValueFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptions;
                options = options ? new FieldValueFilterWidgetOptions(
                    options.vo_field_ref,
                    options.vo_field_ref_lvl2,
                    options.vo_field_sort,
                    options.can_select_multiple,
                    options.is_checkbox,
                    options.checkbox_columns,
                    options.max_visible_options,
                    options.show_search_field,
                    options.hide_lvl2_if_lvl1_not_selected,
                    options.segmentation_type,
                    options.advanced_mode,
                    options.default_advanced_string_filter_type,
                    options.hide_btn_switch_advanced,
                    options.hide_advanced_string_filter_type,
                    options.vo_field_ref_multiple,
                    options.default_filter_opt_values,
                    options.default_ts_range_values,
                    options.default_boolean_values,
                    options.hide_filter,
                    options.no_inter_filter,
                    options.has_other_ref_api_type_id,
                    options.other_ref_api_type_id,
                    options.exclude_filter_opt_values,
                    options.exclude_ts_range_values,
                    options.placeholder_advanced_mode,
                    options.separation_active_filter,
                    options.vo_field_sort_lvl2,
                    options.autovalidate_advanced_filter,
                    options.add_is_null_selectable,
                    options.is_button,
                    options.enum_bg_colors,
                    options.enum_fg_colors,
                    options.show_count_value,
                    options.active_field_on_autovalidate_advanced_filter,
                    options.force_filter_all_api_type_ids,
                    options.bg_color,
                    options.fg_color_value,
                    options.fg_color_text,
                    options.show_all,
                    options.show_none,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the tmp_filter_active_options with default widget options
     * @returns void
     */
    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }

            if (!isEqual(this.widget_options.default_filter_opt_values, this.old_widget_options.default_filter_opt_values)) {
                this.default_values_changed = true;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.is_init = false;

        await this.throttled_update_visible_options();
    }

    /**
     * On Change Tmp Filter Active Options
     * tmp_filter_active_options is the visible active filters of the widget
     *  - Handle change on tmp filter active options
     *  - Happen each time tmp_filter_active_options changes
     * @returns void
     */
    @Watch('tmp_filter_active_options')
    private onchange_tmp_filter_active_options(): void {

        if (!this.widget_options) {
            return;
        }

        let translated_active_options: ContextFilterVO = null;
        let locale_tmp_filter_active_options = null;

        if (TypesHandler.getInstance().isArray(this.tmp_filter_active_options)) {
            locale_tmp_filter_active_options = this.tmp_filter_active_options;
        } else {
            if (this.tmp_filter_active_options != null) {
                locale_tmp_filter_active_options = [this.tmp_filter_active_options];
            }
        }

        if ((!locale_tmp_filter_active_options) || (!locale_tmp_filter_active_options.length)) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        let has_null_value: boolean = false;

        for (let i in locale_tmp_filter_active_options) {
            let active_option: DataFilterOption = locale_tmp_filter_active_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_translated_active_options = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(active_option, null, field, this.vo_field_ref);

            if (!new_translated_active_options) {
                continue;
            }

            if (!translated_active_options) {
                translated_active_options = new_translated_active_options;
            } else {
                translated_active_options = ContextFilterHandler.getInstance().merge_ContextFilterVOs(translated_active_options, new_translated_active_options);
            }
        }

        if (has_null_value) {
            let cf_null_value: ContextFilterVO = new ContextFilterVO();
            cf_null_value.field_id = this.vo_field_ref.field_id;
            cf_null_value.vo_type = this.vo_field_ref.api_type_id;
            cf_null_value.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;

            if (!translated_active_options) {
                translated_active_options = cf_null_value;
            } else {
                translated_active_options = ContextFilterVO.or([cf_null_value, translated_active_options]);
            }
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: translated_active_options,
        });
    }

    private async query_update_visible_options(queryStr: string) {
        this.actual_query = queryStr;
        await this.throttled_update_visible_options();
    }

    private async reset_visible_options() {
        this.tmp_filter_active_options = [];
        this.filter_visible_options = [];
        // On update le visuel de tout le monde suite au reset
        await this.throttled_update_visible_options();
    }

    /**
     * Update Visible Options
     * This widget may depend on other widget active filters options
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     * @returns Promise<void>
     */
    private async update_visible_options(): Promise<void> {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Init context filter of the current filter
        let root_context_filter: ContextFilterVO = null;

        // Get context filter from store
        root_context_filter = this.get_active_field_filters &&
            this.get_active_field_filters[this.vo_field_ref.api_type_id] ?
            this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] :
            null;

        // Say if has active field filter
        let has_active_field_filter: boolean = !!(root_context_filter);

        // Si on a des valeurs par défaut, on va faire l'init
        let old_is_init: boolean = this.is_init;

        this.is_init = true;

        // case when not currently initializing
        if (!old_is_init) {
            if (this.default_values && (this.default_values.length > 0)) {
                // Si je n'ai pas de filtre actif OU que ma valeur de default values à changée, je prends les valeurs par défaut
                // case when does not have active filter
                if (!has_active_field_filter || this.default_values_changed) {
                    this.default_values_changed = false;
                    this.tmp_filter_active_options = this.default_values;

                    ValidationFiltersWidgetController.getInstance().throttle_call_updaters(
                        new ValidationFiltersCallUpdaters(
                            this.dashboard_page.dashboard_id,
                            this.dashboard_page.id
                        )
                    );

                    return;
                }
            }
        }

        // case when has active context filter but active visible filter empty
        // - try to apply context filter or display filter application fail alert
        if (has_active_field_filter &&
            (!(this.tmp_filter_active_options?.length > 0))) {

            this.warn_existing_external_filters = !this.try_apply_actual_active_filters(root_context_filter);
        }

        let tmp: DataFilterOption[] = [];
        let add_tmp: { [numeric_value: number]: boolean } = {};

        let available_api_type_ids: string[] = this.get_available_api_type_ids(false);

        let custom_active_field_filters_by_api_type_id: { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } = this.get_custom_active_field_filters_by_api_type_id(
            available_api_type_ids,
            false,
        );

        let limit = EnvHandler.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);

        for (let i in available_api_type_ids) {
            let query_api_type_id: string = available_api_type_ids[i];

            let active_field_filters = custom_active_field_filters_by_api_type_id[query_api_type_id];

            let filters: ContextFilterVO[] = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                active_field_filters
            );

            let vo_field_ref: VOFieldRefVO = Object.assign(new VOFieldRefVO(), this.vo_field_ref);

            if (this.force_filter_all_api_type_ids) {
                vo_field_ref.api_type_id = query_api_type_id;
            }

            let query_ = query(query_api_type_id)
                .field(vo_field_ref.field_id, 'label', vo_field_ref.api_type_id)
                .add_filters(filters)
                .set_limit(this.widget_options.max_visible_options)
                .using(this.dashboard.api_type_ids);

            FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(query_, this.get_discarded_field_paths);

            query_.filters = ContextFilterHandler.getInstance().add_context_filters_exclude_values(
                this.exclude_values,
                vo_field_ref,
                query_.filters,
                false,
            );

            // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
            // Si ce n'est pas le cas, je n'envoie pas la requête
            let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[query_.base_api_type_id];

            if (
                base_table &&
                base_table.is_segmented
            ) {
                if (
                    !base_table.table_segmented_field ||
                    !base_table.table_segmented_field.manyToOne_target_moduletable ||
                    !active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type] ||
                    !Object.keys(active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]).length
                ) {
                    return;
                }

                let has_filter: boolean = false;

                for (let field_id in active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]) {
                    if (active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type][field_id]) {
                        has_filter = true;
                        break;
                    }
                }

                if (!has_filter) {
                    return;
                }
            } else {
                query_ = await FieldValueFilterWidgetController.getInstance().check_segmented_dependencies(this.dashboard, query_, this.get_discarded_field_paths, true);
            }

            await promise_pipeline.push(async () => {
                let tmp_values: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
                    query_,
                    this.actual_query
                );

                for (let j in tmp_values) {
                    let tmp_value = tmp_values[j];

                    if (!add_tmp[tmp_value.numeric_value]) {
                        add_tmp[tmp_value.numeric_value] = true;
                        tmp.push(tmp_value);
                    }
                }
            });
        }

        await promise_pipeline.end();

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        if (!tmp) {
            tmp = [];
        }

        for (let i in tmp) {
            let tmpi = tmp[i];
            tmpi.label = this.t(tmpi.label);
        }

        if (this.add_is_null_selectable) {
            tmp.unshift(new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.label('dataFilteroption.is_null'),
                RangeHandler.MIN_INT,
            ));
        }

        tmp.sort((a, b) => {
            return a.numeric_value - b.numeric_value;
        });

        this.filter_visible_options = tmp;

        // Si on doit afficher le compteur, on fait les requêtes nécessaires
        await this.set_count_value();
    }

    /**
     * Handle Select All
     *  - Select all fields of the current active filter
     */
    private handle_select_all(): void {
        let selection: DataFilterOption[] = [];

        selection = this.filter_visible_options?.map((filter) => new DataFilterOption(DataFilterOption.STATE_SELECTED, filter.label, filter.id));

        this.tmp_filter_active_options = selection;
    }

    /**
     * Handle Select None
     *  - Remove all fields of the current selected active filter
     */
    private handle_select_none(): void {
        this.tmp_filter_active_options = [];
    }

    /**
     *
     * @returns TODO vérifier car pas certains que ça fonctionnent dans tous les cas...
     */
    private async set_count_value() {
        if (!this.show_count_value) {
            this.count_by_filter_visible_opt_id = {};
            return;
        }

        let limit = EnvHandler.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);

        let available_api_type_ids: string[] = this.get_available_api_type_ids(true);

        let custom_active_field_filters_by_api_type_id: { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } = this.get_custom_active_field_filters_by_api_type_id(
            available_api_type_ids,
            true,
        );

        let count_by_filter_visible_opt_id: { [id: number]: number } = {};

        for (let j in this.filter_visible_options) {
            let filter_opt: DataFilterOption = this.filter_visible_options[j];

            // On RAZ le champ
            count_by_filter_visible_opt_id[filter_opt.numeric_value] = 0;

            for (let i in available_api_type_ids) {
                let api_type_id: string = available_api_type_ids[i];

                let filters: ContextFilterVO[] = ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                    custom_active_field_filters_by_api_type_id[api_type_id]
                );

                let enum_filter = ContextFilterHandler.getInstance().get_ContextFilterVO_from_DataFilterOption(
                    filter_opt,
                    null,
                    this.field,
                    this.vo_field_ref,
                );

                if (this.force_filter_all_api_type_ids) {
                    enum_filter.vo_type = api_type_id;
                }

                filters = filters.concat(enum_filter);

                await promise_pipeline.push(async () => {

                    if (!await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id))) {
                        return;
                    }

                    // pour éviter de récuperer le cache
                    let query_items_c = query(api_type_id)
                        .using(this.dashboard.api_type_ids)
                        .add_filters(filters);
                    FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(query_items_c, this.get_discarded_field_paths);
                    let items_c: number = await query_items_c
                        .select_count();

                    if (items_c >= 0) {
                        count_by_filter_visible_opt_id[filter_opt.numeric_value] += items_c;
                    }
                });
            }
        }

        await promise_pipeline.end();

        this.count_by_filter_visible_opt_id = count_by_filter_visible_opt_id;
    }

    private get_available_api_type_ids(for_count: boolean): string[] {
        if (this.has_other_ref_api_type_id && this.other_ref_api_type_id) {
            return [this.other_ref_api_type_id];
        }

        if (this.get_active_api_type_ids && (this.get_active_api_type_ids.length > 0)) {
            return this.get_active_api_type_ids;
        }

        if (this.get_query_api_type_ids && (this.get_query_api_type_ids.length > 0) && for_count) {
            return this.get_query_api_type_ids;
        }

        return [this.vo_field_ref.api_type_id];
    }

    private get_custom_active_field_filters_by_api_type_id(
        available_api_type_ids: string[],
        switch_current_field: boolean,
    ): { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } {
        let res: { [api_type_id: string]: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } } = {};

        let active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

        if (!this.no_inter_filter) {
            active_field_filters = this.get_active_field_filters;
        }

        let context_filters_for_request: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = ContextFilterHandler.getInstance().clean_context_filters_for_request(
            active_field_filters
        );

        for (let api_type_id in context_filters_for_request) {

            for (let i in available_api_type_ids) {
                let api_type_id_sup: string = available_api_type_ids[i];

                if (!res[api_type_id_sup]) {
                    res[api_type_id_sup] = {};
                }

                if (!this.get_query_api_type_ids.includes(api_type_id)) {
                    res[api_type_id_sup][api_type_id] = context_filters_for_request[api_type_id];
                    continue;
                }

                let new_api_type_id: string = api_type_id_sup;

                if (this.force_filter_all_api_type_ids) {
                    new_api_type_id = api_type_id;
                }

                res[api_type_id_sup][new_api_type_id] = cloneDeep(context_filters_for_request[api_type_id]);

                for (let field_id in res[api_type_id_sup][new_api_type_id]) {
                    // Si je suis sur le field de la requête, je ne le prend pas en compte, il sera fait plus loin
                    if (switch_current_field && (field_id == this.vo_field_ref.field_id)) {
                        res[api_type_id_sup][new_api_type_id][field_id] = null;
                        continue;
                    }

                    if (!res[api_type_id_sup][new_api_type_id][field_id]) {
                        continue;
                    }

                    res[api_type_id_sup][new_api_type_id][field_id].vo_type = api_type_id_sup;
                }
            }
        }

        return res;
    }

    /**
     * Try Apply Actual Active Filters
     *  - Make the showable active filter options by the given filter
     * @param filter ContextFilterVO
     * @returns boolean
     */
    private try_apply_actual_active_filters(filter: ContextFilterVO): boolean {

        // create single data filter to apply
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

        // case when no filter reset visible active filter options
        if (!filter) {
            if (this.tmp_filter_active_options && this.tmp_filter_active_options.length) {
                this.tmp_filter_active_options = [];
            }
            return true;
        }

        let active_filter_options: DataFilterOption[] = [];

        // filter must have one of the given param to continue
        if (!(filter.param_numranges?.length > 0)
            // TODO: Seen With Michael Waiting to Fix the final comportment
            // && filter.param_numeric == null
        ) {
            if (this.tmp_filter_active_options && this.tmp_filter_active_options.length) {
                this.tmp_filter_active_options = [];
            }
            return true;
        }

        // case filter param_numeric is sets
        // TODO: Seen With Michael Waiting to Fix the final comportment
        // if (filter.param_numeric != null) {
        //     const dataFilter = createDataFilter(filter.param_numeric);
        //     active_filter_options.push(dataFilter);
        // }

        // case filter param_numranges is sets
        if (filter.param_numranges?.length > 0) {
            RangeHandler.foreach_ranges_sync(filter.param_numranges, (num: number) => {
                const dataFilter = createDataFilter(num);
                active_filter_options.push(dataFilter);
            });
        }

        this.tmp_filter_active_options = active_filter_options;

        return true;
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }

    private select_option(dfo: DataFilterOption) {
        if (!dfo) {
            return;
        }

        let index: number = this.tmp_filter_active_options.findIndex((e) => e.numeric_value == dfo.numeric_value);

        if (index >= 0) {
            this.tmp_filter_active_options.splice(index, 1);
        } else {
            this.tmp_filter_active_options.push(dfo);
        }
    }

    private getStyle(dfo: DataFilterOption) {
        if (!dfo) {
            return null;
        }

        let dfo_id: number = dfo.numeric_value;

        let bg_color: string = this.widget_options.enum_bg_colors && this.widget_options.enum_bg_colors[dfo_id] ? this.widget_options.enum_bg_colors[dfo_id] : null;
        let fg_color: string = this.widget_options.enum_fg_colors && this.widget_options.enum_fg_colors[dfo_id] ? this.widget_options.enum_fg_colors[dfo_id] : 'white';

        if (!!bg_color) {
            return {
                backgroundColor: bg_color + ' !important',
                borderColor: bg_color + ' !important',
                color: fg_color + ' !important'
            };
        }

        return null;
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get field(): ModuleTableField<any> {
        if (!this.vo_field_ref) {
            return null;
        }

        return VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
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

    get force_filter_all_api_type_ids(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.force_filter_all_api_type_ids;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
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

    get show_all(): boolean {
        if (!this.widget_options) {
            return false;
        }

        const canShowAll = !!this.widget_options.show_all;
        const queryLimit = this.widget_options.max_visible_options;

        if (!canShowAll) {
            return canShowAll;
        }

        // May be shown only if active filter options
        // length smaller than actual query limit
        return this.filter_visible_options?.length < queryLimit;
    }

    get show_none(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.show_none;
    }

    get show_count_value(): boolean {
        return this.widget_options.show_count_value;
    }

    get default_values(): DataFilterOption[] {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.default_filter_opt_values) || (!options.default_filter_opt_values.length)) {
            return null;
        }

        let res: DataFilterOption[] = [];

        for (let i in options.default_filter_opt_values) {
            res.push(new DataFilterOption(
                options.default_filter_opt_values[i].select_state,
                options.default_filter_opt_values[i].label,
                options.default_filter_opt_values[i].id,
                options.default_filter_opt_values[i].disabled_state_selected,
                options.default_filter_opt_values[i].disabled_state_selectable,
                options.default_filter_opt_values[i].disabled_state_unselectable,
                options.default_filter_opt_values[i].img,
                options.default_filter_opt_values[i].desc,
                options.default_filter_opt_values[i].boolean_value,
                options.default_filter_opt_values[i].numeric_value,
                options.default_filter_opt_values[i].string_value,
                options.default_filter_opt_values[i].tstz_value,
                true,
            ));
        }

        return res;
    }

    get exclude_values(): DataFilterOption[] {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.exclude_filter_opt_values) || (!options.exclude_filter_opt_values.length)) {
            return null;
        }

        let res: DataFilterOption[] = [];

        for (let i in options.exclude_filter_opt_values) {
            res.push(new DataFilterOption(
                options.exclude_filter_opt_values[i].select_state,
                options.exclude_filter_opt_values[i].label,
                options.exclude_filter_opt_values[i].id,
                options.exclude_filter_opt_values[i].disabled_state_selected,
                options.exclude_filter_opt_values[i].disabled_state_selectable,
                options.exclude_filter_opt_values[i].disabled_state_unselectable,
                options.exclude_filter_opt_values[i].img,
                options.exclude_filter_opt_values[i].desc,
                options.exclude_filter_opt_values[i].boolean_value,
                options.exclude_filter_opt_values[i].numeric_value,
                options.exclude_filter_opt_values[i].string_value,
                options.exclude_filter_opt_values[i].tstz_value,
                true,
            ));
        }

        return res;
    }
}
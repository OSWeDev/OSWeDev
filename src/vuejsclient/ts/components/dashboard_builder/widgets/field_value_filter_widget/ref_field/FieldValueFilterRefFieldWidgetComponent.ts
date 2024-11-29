import { cloneDeep, debounce, isEqual } from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOHandler from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableVO';
import FieldFiltersVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/FieldFiltersVOHandler';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import FieldValueFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import ValidationFiltersCallUpdaters from '../../validation_filters_widget/ValidationFiltersCallUpdaters';
import ValidationFiltersWidgetController from '../../validation_filters_widget/ValidationFiltersWidgetController';
import FieldValueFilterWidgetController from '../FieldValueFilterWidgetController';
import AdvancedRefFieldFilter from './AdvancedRefFieldFilter';
import './FieldValueFilterRefFieldWidgetComponent.scss';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';

@Component({
    template: require('./FieldValueFilterRefFieldWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterRefFieldWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleDashboardPageGetter
    private get_widgets_invisibility: { [w_id: number]: boolean };

    @ModuleDashboardPageAction
    private set_widgets_invisibility: (widgets_invisibility: { [w_id: number]: boolean }) => void;

    @ModuleDashboardPageAction
    private set_widget_invisibility: (w_id: number) => void;

    @ModuleDashboardPageAction
    private set_widget_visibility: (w_id: number) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private default_values_changed: boolean = false; // Attribut pour reaffecter les valeurs par défaut lorsqu'elles sont modifiées.


    private tmp_active_filter_options: DataFilterOption[] = [];
    private tmp_active_filter_options_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = {};
    private active_option_lvl1: { [filter_opt_value: string]: boolean } = {};

    private filter_visible_options: DataFilterOption[] = [];
    private filter_visible_options_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = {};

    private is_advanced_filters: boolean = false;
    private force_filter_change: boolean = false;
    private advanced_ref_field_filters: AdvancedRefFieldFilter[] = [new AdvancedRefFieldFilter()];

    private warn_existing_external_filters: boolean = false;

    private actual_query: string = null;
    private search_field_checkbox: string = null;

    private utility_tested_on_type: string = null;
    private utility_tested_on_field: string = null;

    private is_init: boolean = false;
    private old_widget_options: FieldValueFilterWidgetOptionsVO = null;

    private last_calculation_cpt: number = 0;
    private already_loaded_query_params: boolean = false;

    private debounced_query_update_visible_options_checkbox = debounce(this.query_update_visible_options_checkbox.bind(this), 300);

    private filter_type_options: number[] = [
        AdvancedRefFieldFilter.FILTER_TYPE_EQ,
        AdvancedRefFieldFilter.FILTER_TYPE_NOTEQ,
        AdvancedRefFieldFilter.FILTER_TYPE_INF,
        AdvancedRefFieldFilter.FILTER_TYPE_INFEQ,
        AdvancedRefFieldFilter.FILTER_TYPE_SUP,
        AdvancedRefFieldFilter.FILTER_TYPE_SUPEQ,
        AdvancedRefFieldFilter.FILTER_TYPE_EST_NULL,
        AdvancedRefFieldFilter.FILTER_TYPE_NEST_PAS_NULL,
    ];

    private throttled_update_visible_options = (timeout: number = 300) => (ThrottleHelper.declare_throttle_without_args(this.update_visible_options.bind(this), timeout, { leading: false, trailing: true }))();

    @Watch('filter_visible_options', { deep: true, immediate: true })
    private async try_apply_query_params() {

        if (this.already_loaded_query_params) {
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


        // // To get a parameter simply write something like the follwing
        // let param_name = FieldValueFilterWidgetController.get_query_param_filter_name(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id);
        // const filter_value_str: string = urlParams.get(param_name);
        // if (filter_value_str != null) {
        //     const filter_value_number: number = parseInt(filter_value_str);

        //     // On doit retrouver la valeur dans les options disponibles
        //     let filter_value: DataFilterOption = null;
        //     for (let i in this.filter_visible_options) {
        //         let filter_opt = this.filter_visible_options[i];
        //         if (filter_opt.numeric_value == filter_value_number) {
        //             filter_value = filter_opt;
        //             break;
        //         }
        //     }

        //     if (filter_value) {
        //         update_tmp_active_filter_options = true;
        //         updated_tmp_active_filter_options.push(filter_value);
        //     }
        // }

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

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    get div_column_class(): string {
        if (!this.widget_options) {
            return null;
        }

        switch (this.widget_options.checkbox_columns) {
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_1:
            default:
                return 'col-md-12';
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_2:
                return 'col-md-6';
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_3:
                return 'col-md-4';
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_4:
                return 'col-md-3';
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_6:
                return 'col-md-2';
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_12:
                return 'col-md-1';
        }
    }

    get tmp_active_filter_options_by_column(): { [column_id: number]: DataFilterOption[] } {
        if ((!this.widget_options) || (!this.tmp_active_filter_options) || (!this.tmp_active_filter_options.length)) {
            return {};
        }

        let nb_columns = 1;
        switch (this.widget_options.checkbox_columns) {
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_2:
                nb_columns = 2;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_3:
                nb_columns = 3;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_4:
                nb_columns = 4;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_6:
                nb_columns = 6;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_12:
                nb_columns = 12;
                break;
        }

        const res: { [column_id: number]: DataFilterOption[] } = {};
        let column_id = 0;
        const nb_elt_by_column = Math.ceil(this.tmp_active_filter_options.length / nb_columns);

        for (const i in this.tmp_active_filter_options) {
            const filter_opt = this.tmp_active_filter_options[i];
            const i_n = parseInt(i);

            if (!res[column_id]) {
                res[column_id] = [];
            }

            res[column_id].push(filter_opt);

            column_id = Math.floor(i_n / nb_elt_by_column);
        }

        return res;
    }

    get filter_visible_options_by_column(): { [column_id: number]: DataFilterOption[] } {
        if ((!this.filter_visible_options) || (!this.filter_visible_options.length)) {
            return {};
        }

        let nb_columns = 1;
        switch (this.widget_options.checkbox_columns) {
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_2:
                nb_columns = 2;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_3:
                nb_columns = 3;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_4:
                nb_columns = 4;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_6:
                nb_columns = 6;
                break;
            case FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_12:
                nb_columns = 12;
                break;
        }

        const res: { [column_id: number]: DataFilterOption[] } = {};
        let column_id = 0;
        const nb_elt_by_column = Math.ceil(this.filter_visible_options.length / nb_columns);

        for (const i in this.filter_visible_options) {
            const filter_opt = this.filter_visible_options[i];
            const i_n = parseInt(i);
            column_id = Math.floor(i_n / nb_elt_by_column);

            if (!res[column_id]) {
                res[column_id] = [];
            }

            res[column_id].push(filter_opt);
        }

        return res;
    }

    /**
     * Computed widget options
     *  - Called on component|widget creation
     * @returns FieldValueFilterWidgetOptionsVO
     */
    get widget_options(): FieldValueFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                options = options ? new FieldValueFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the tmp_active_filter_options with default widget options
     *
     * @returns void
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
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

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     *  - Initialize the tmp_active_filter_options with default widget options
     * @returns {void}
     */
    @Watch('get_active_field_filters', { deep: true })
    private onchange_active_field_filters(): void {
        this.throttled_update_visible_options();
    }

    /**
     * onchange_tmp_active_filter_options
     * tmp_active_filter_options is the visible active filters of the widget
     * - Happen each time tmp_active_filter_options changes
     * - Update the active_field_filters
     * @returns {void}
     */
    @Watch('tmp_active_filter_options', { deep: true })
    private onchange_tmp_active_filter_options(): void {

        if (!this.widget_options) {
            return;
        }

        // Si on doit masquer le lvl2, on va désactiver tous les options lvl2 qui ne doivent plus être cochées
        if (this.hide_lvl2_if_lvl1_not_selected) {
            // Si plus d'optlvl1 actif, je désactive tous les lvl2
            if (!this.tmp_active_filter_options || !this.tmp_active_filter_options.length) {
                this.tmp_active_filter_options_lvl2 = {};
                return;
            }

            // On regarde quelles optlvl1 est actif
            const optlvl1_by_label: { [label: string]: boolean } = {};

            for (const i in this.tmp_active_filter_options) {
                optlvl1_by_label[this.tmp_active_filter_options[i].label] = true;
            }

            let has_changes: boolean = false;
            const new_tmp_active_filter_options_lvl2 = {};
            for (const filter_opt_value in this.tmp_active_filter_options_lvl2) {
                if (optlvl1_by_label[filter_opt_value]) {
                    // On garde le filtre car le lvl1 est actif
                    new_tmp_active_filter_options_lvl2[filter_opt_value] = this.tmp_active_filter_options_lvl2[filter_opt_value];
                    continue;
                }

                has_changes = true;
            }

            if (has_changes) {
                this.tmp_active_filter_options_lvl2 = new_tmp_active_filter_options_lvl2;
                return;
            }

        }

        // Si on a un lvl2, on va filtrer par leurs valeurs donc on va dans l'autre fonction
        if (this.vo_field_ref_lvl2 && this.tmp_active_filter_options_lvl2 && (Object.keys(this.tmp_active_filter_options_lvl2).length > 0)) {
            this.onchange_tmp_active_filter_options_lvl2();
            return;
        }

        const context_filter = FieldValueFilterWidgetManager.create_context_filter_from_ref_field_filter_options(
            this.vo_field_ref,
            this.tmp_active_filter_options,
            {
                vo_field_ref_multiple: this.vo_field_ref_multiple,
                vo_field_ref: this.vo_field_ref,
            }
        );

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: context_filter,
        });
    }

    @Watch('tmp_active_filter_options_lvl2')
    private onchange_tmp_active_filter_options_lvl2() {

        if (!this.widget_options || !this.vo_field_ref_lvl2) {
            return;
        }

        const active_field_filter_lvl2: ContextFilterVO[] = [];

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        const filter_visible_options_by_values: { [value: string]: DataFilterOption } = {};

        for (const i in this.filter_visible_options) {
            filter_visible_options_by_values[this.filter_visible_options[i].label] = this.filter_visible_options[i];
        }

        for (const i in this.tmp_active_filter_options) {
            const filter_opt_value: string = this.tmp_active_filter_options[i].label;
            if (!this.tmp_active_filter_options_lvl2[filter_opt_value] || !this.tmp_active_filter_options_lvl2[filter_opt_value].length) {

                const context_filter = FieldValueFilterWidgetManager.create_context_filter_from_ref_field_filter_options(
                    this.vo_field_ref,
                    [this.tmp_active_filter_options[i]],
                    {
                        vo_field_ref_multiple: this.vo_field_ref_multiple,
                        vo_field_ref: this.vo_field_ref,
                    }
                );

                if (context_filter) {
                    active_field_filter_lvl2.push(context_filter);
                }
            }
        }

        for (const filter_opt_value in this.tmp_active_filter_options_lvl2) {
            if (!this.tmp_active_filter_options_lvl2[filter_opt_value].length) {
                continue;
            }

            const context_filter = FieldValueFilterWidgetManager.create_context_filter_from_ref_field_filter_options(
                this.vo_field_ref_lvl2,
                this.tmp_active_filter_options_lvl2[filter_opt_value],
                {
                    vo_field_ref_multiple: this.vo_field_ref_multiple,
                    vo_field_ref: this.vo_field_ref,
                }
            );

            if (!context_filter) {
                continue;
            }

            const context_filter_lvl1 = FieldValueFilterWidgetManager.create_context_filter_from_ref_field_filter_options(
                this.vo_field_ref,
                [filter_visible_options_by_values[filter_opt_value]],
                {
                    vo_field_ref_multiple: this.vo_field_ref_multiple,
                    vo_field_ref: this.vo_field_ref,
                }
            );

            if (context_filter_lvl1) {
                active_field_filter_lvl2.push(ContextFilterVO.and([context_filter_lvl1, context_filter]));
            } else {
                active_field_filter_lvl2.push(context_filter);
            }
        }

        if (active_field_filter_lvl2.length > 0) {
            this.set_active_field_filter({
                field_id: this.vo_field_ref_lvl2.field_id,
                vo_type: this.vo_field_ref_lvl2.api_type_id,
                active_field_filter: ContextFilterVO.or(active_field_filter_lvl2),
            });
        } else {
            if (this.vo_field_ref_lvl2) {
                this.remove_active_field_filter({ vo_type: this.vo_field_ref_lvl2.api_type_id, field_id: this.vo_field_ref_lvl2.field_id });
            }
        }

        this.remove_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id
        });
    }

    /**
     * Handle Select All
     *  - Select all fields of the current active filter
     */
    private handle_select_all(): void {
        let selection: DataFilterOption[] = [];

        // Case when we are on a button filter and we cannot select multiple options
        if (this.is_button && !this.can_select_multiple) {
            this.tmp_active_filter_options = [];
            return;
        }

        selection = this.filter_visible_options?.map((_filter) =>
            new DataFilterOption(DataFilterOption.STATE_SELECTED, _filter.label, _filter.id)
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

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedRefFieldFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private add_advanced_ref_field_filter() {
        if (!this.advanced_ref_field_filters) {
            this.advanced_ref_field_filters = [];
            return;
        }

        this.advanced_ref_field_filters[this.advanced_ref_field_filters.length - 1].link_type = AdvancedRefFieldFilter.LINK_TYPE_ET;
        this.advanced_ref_field_filters.push(new AdvancedRefFieldFilter());
    }

    private validate_advanced_ref_field_filter() {

        if (!this.is_advanced_filter_valid) {
            this.remove_active_field_filter({
                vo_type: this.vo_field_ref.api_type_id,
                field_id: this.vo_field_ref.field_id
            });

            return;
        }


        const context_active_filter_options: ContextFilterVO[] = [];

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        let previous_filter: AdvancedRefFieldFilter = null;
        let tmp_context_filter: ContextFilterVO = null;


        // query().filter_by_date_after().filter_by_date_before()
        // a.or(b).or(c)
        // ContextFilterVO.or([a, b, c]).by_date_eq().by_date_before()

        if (this.vo_field_ref_multiple?.length > 0) {
            // Case when we have a search from multiple vos api_type_id
            // We need to create a context_filter for each of those
            for (const j in this.vo_field_ref_multiple) {
                const vo_field_ref_multiple = this.vo_field_ref_multiple[j];

                const moduletable_multiple = ModuleTableController.module_tables_by_vo_type[vo_field_ref_multiple.api_type_id];
                const field_multiple = moduletable_multiple.get_field_by_id(vo_field_ref_multiple.field_id);

                tmp_context_filter = null;
                previous_filter = null;

                for (const i in this.advanced_ref_field_filters) {
                    const advanced_filter: AdvancedRefFieldFilter = this.advanced_ref_field_filters[i];

                    tmp_context_filter = this.get_advanced_ref_field_filter(
                        tmp_context_filter,
                        advanced_filter,
                        field_multiple,
                        vo_field_ref_multiple,
                        previous_filter
                    );
                }

                if (tmp_context_filter) {
                    context_active_filter_options.push(tmp_context_filter);
                }
            }
        }

        previous_filter = null;
        tmp_context_filter = null;

        for (const i in this.advanced_ref_field_filters) {
            const advanced_filter: AdvancedRefFieldFilter = this.advanced_ref_field_filters[i];

            if (field) {
                tmp_context_filter = this.get_advanced_ref_field_filter(
                    tmp_context_filter,
                    advanced_filter,
                    field,
                    this.vo_field_ref,
                    previous_filter
                );
            }
        }

        if (tmp_context_filter) {
            context_active_filter_options.push(tmp_context_filter);
        }

        if (context_active_filter_options.length > 0) {
            this.set_active_field_filter({
                field_id: this.vo_field_ref.field_id,
                vo_type: this.vo_field_ref.api_type_id,
                active_field_filter: ContextFilterVO.or(context_active_filter_options),
            });
        }
    }

    private get_advanced_ref_field_filter(context_filter: ContextFilterVO, advanced_filter: AdvancedRefFieldFilter, field: ModuleTableFieldVO, vo_field_ref: VOFieldRefVO, previous_filter: AdvancedRefFieldFilter): ContextFilterVO {
        const new_context_filter = this.get_ContextFilterVO_from_AdvancedRefFieldFilter(advanced_filter, field, vo_field_ref);

        if (!new_context_filter) {
            return null;
        }

        if (!context_filter) {
            context_filter = new_context_filter;
        } else {

            const link_ = new ContextFilterVO();
            link_.field_name = context_filter.field_name;
            link_.vo_type = context_filter.vo_type;

            if (previous_filter.link_type == AdvancedRefFieldFilter.LINK_TYPE_ET) {
                link_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
            } else {
                link_.filter_type = ContextFilterVO.TYPE_FILTER_OR;
            }

            link_.left_hook = context_filter;
            link_.right_hook = new_context_filter;
            context_filter = link_;
        }

        previous_filter = advanced_filter;

        return context_filter;
    }

    private delete_advanced_ref_field_filter(index: number) {
        if ((!this.advanced_ref_field_filters) || (index >= this.advanced_ref_field_filters.length - 1)) {
            return;
        }

        this.advanced_ref_field_filters.splice(index, 1);
    }

    private switch_link_type(advanced_ref_field_filter: AdvancedRefFieldFilter) {
        advanced_ref_field_filter.link_type = 1 - advanced_ref_field_filter.link_type;
    }

    /**
     * Toggle Advanced Filters
     * Do toggle the advanced option of string filter
     */
    private toggle_advanced_filters() {
        this.is_advanced_filters = !this.is_advanced_filters;
        this.force_filter_change = true;

        if (this.tmp_active_filter_options?.length > 0) {
            this.tmp_active_filter_options = null;
        }

        if (this.active_option_lvl1 && Object.keys(this.active_option_lvl1).length > 0) {
            this.active_option_lvl1 = {};
        }

        if (this.tmp_active_filter_options_lvl2 && Object.keys(this.tmp_active_filter_options_lvl2).length > 0) {
            this.tmp_active_filter_options_lvl2 = {};
        }

        // revove the active filter from context
        if (this.vo_field_ref) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
        }

        this.advanced_ref_field_filters = [new AdvancedRefFieldFilter()];

        this.throttled_update_visible_options();
    }

    private query_update_visible_options(_query: string) {
        this.actual_query = _query;
        this.throttled_update_visible_options();
    }

    private query_update_visible_options_checkbox() {
        this.actual_query = this.search_field_checkbox;
        this.throttled_update_visible_options();
    }

    /**
     * Reset visible options
     */
    private reset_visible_options() {
        // Reset des filtres
        this.tmp_active_filter_options = []; // Reset le niveau 1
        this.active_option_lvl1 = {};
        this.tmp_active_filter_options_lvl2 = {}; //Reset le niveau 2
        this.filter_visible_options_lvl2 = {};
        this.advanced_ref_field_filters = [new AdvancedRefFieldFilter()]; // Reset les champs saisie libre

        // On update le visuel de tout le monde suite au reset
        this.throttled_update_visible_options(0);
    }

    /**
     * Update visible option
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     * @returns void
     */
    private async update_visible_options(): Promise<void> {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options_lvl2 = {};
            this.filter_visible_options = [];
            return;
        }

        // Init context filter of the current filter
        const root_context_filter: ContextFilterVO = FieldFiltersVOManager.get_context_filter_from_field_filters(
            this.vo_field_ref,
            this.get_active_field_filters,
        );

        // Say if has active field filter
        const has_active_field_filter: boolean = !!(root_context_filter);

        // Si on a des valeurs par défaut, on va faire l'init
        const old_is_init: boolean = this.is_init;

        this.is_init = true;

        // case when not currently initializing
        if (!old_is_init) {
            // Sets visible active filter options with default values
            if (this.default_values?.length > 0) {

                // Si je n'ai pas de filtre actif OU que ma valeur de default values à changée, je prends les valeurs par défaut
                // case when does not have active filter
                if (!has_active_field_filter || this.default_values_changed) {
                    this.default_values_changed = false;
                    this.tmp_active_filter_options = this.default_values;

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

        // // Marche mais pas si simple, ça bouge tout le rendu et suivant les widgets inutiles ça crée des trous, pas toujours les mêmes, ... compliqué
        // /**
        //  * On check d'abord si le filtre est utile. Sans aucun filtrage, si on a pas encore checké, est-ce qu'on a plus de 1 résultat ?
        //  *  Sinon le filtre est inutile on peut décider de la cacher
        //  */
        // if ((this.utility_tested_on_type != this.vo_field_ref.api_type_id) ||
        //     (this.utility_tested_on_field != this.vo_field_ref.field_id)) {

        //     this.utility_tested_on_type = this.vo_field_ref.api_type_id;
        //     this.utility_tested_on_field = this.vo_field_ref.field_id;

        //     let no_filters_count = await query(this.vo_field_ref.api_type_id)
        //         .field(this.vo_field_ref.field_id, 'label').select_count();
        //     if (no_filters_count <= 1) {

        //         let invisibility = this.get_widgets_invisibility;
        //         if (!invisibility[this.page_widget.id]) {
        //             this.set_widget_invisibility(this.page_widget.id);
        //         }

        //         // if (!this.page_widget.hide) {
        //         //     this.dashboard_page.hide = true;
        //         // }
        //     } else {
        //         let invisibility = this.get_widgets_invisibility;
        //         if (invisibility[this.page_widget.id]) {
        //             this.set_widget_visibility(this.page_widget.id);
        //         }

        //         // if (this.page_widget.hide) {
        //         //     this.page_widget.hide = false;
        //         // }
        //     }
        // }

        /**
         * Si le filtrage est vide, on repasse en filtrage normal si on était en avancé
         */
        // case when does not have active context filter and not forcing filter to change
        // - Switch to normal filter if we were in advanced mode
        if ((!has_active_field_filter) && (!this.force_filter_change)) {

            if (this.is_advanced_filters && !this.advanced_mode) {
                this.is_advanced_filters = false;

                if (this.advanced_ref_field_filters?.length > 0) {
                    this.advanced_ref_field_filters = null;
                }
            }
        }

        if (this.force_filter_change) {
            this.force_filter_change = false;
        }

        if (this.advanced_mode && !this.is_advanced_filters) {
            this.toggle_advanced_filters();
        }

        // case when not currently initializing
        if (!old_is_init) {
            if (this.default_advanced_ref_field_filter_type != null) {
                for (const i in this.advanced_ref_field_filters) {
                    this.advanced_ref_field_filters[i].filter_type = this.default_advanced_ref_field_filter_type;
                }

                if (!this.has_content_filter_type[this.default_advanced_ref_field_filter_type]) {
                    this.validate_advanced_ref_field_filter();
                    return;
                }
            }
        }

        // case when has active context filter but active visible filter empty
        // - try to apply context filter or display filter application fail alert
        if (has_active_field_filter &&
            (!(this.tmp_active_filter_options?.length > 0))) {

            this.warn_existing_external_filters = !this.try_apply_actual_active_filters(
                root_context_filter
            );
        }

        // /**
        //  * Cas où l'on réinit un filter alors qu'on a déjà un filtre actif enregistré (retour sur la page du filtre typiquement)
        //  */
        // if (this.vo_field_ref_lvl2 &&
        //     this.get_active_field_filters && this.get_active_field_filters[this.vo_field_ref_lvl2.api_type_id] &&
        //     this.get_active_field_filters[this.vo_field_ref_lvl2.api_type_id][this.vo_field_ref_lvl2.field_id] &&
        //     ((!this.tmp_active_filter_options_lvl2) || (!this.tmp_active_filter_options_lvl2.length))) {

        //     /**
        //      * On essaye d'appliquer les filtres. Si on peut pas appliquer un filtre, on garde l'info pour afficher une petite alerte
        //      */
        //     let res: boolean = !this.try_apply_actual_active_filters_lvl2(this.get_active_field_filters[this.vo_field_ref_lvl2.api_type_id][this.vo_field_ref_lvl2.field_id]);

        //     if (!this.warn_existing_external_filters) {
        //         this.warn_existing_external_filters = res;
        //     }
        // }

        if (!this.is_advanced_filters) {
            const field_sort: VOFieldRefVO = this.vo_field_sort ? this.vo_field_sort : this.vo_field_ref;

            let active_field_filters: FieldFiltersVO = null;

            if (!this.no_inter_filter) {
                active_field_filters = FieldFiltersVOManager.clean_field_filters_for_request(
                    this.get_active_field_filters,
                    { should_restrict_to_api_type_id: true }
                );

                if (this.vo_field_ref_lvl2) {
                    const is_active_field_filters_query_empty = FieldFiltersVOHandler.is_field_filters_empty(
                        this.vo_field_ref_lvl2,
                        active_field_filters
                    );

                    if (!is_active_field_filters_query_empty) {
                        delete active_field_filters[this.vo_field_ref_lvl2.api_type_id][this.vo_field_ref_lvl2.field_id];
                    }
                }
            }

            let tmp: DataFilterOption[] = [];

            const api_type_id: string = (this.has_other_ref_api_type_id && this.other_ref_api_type_id) ?
                this.other_ref_api_type_id :
                this.vo_field_ref.api_type_id;

            const access_policy_name = ModuleDAO.instance.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
            const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

            if (!has_access) {
                return;
            }

            let context_query = query(api_type_id)
                .field(this.vo_field_ref.field_id, 'label', this.vo_field_ref.api_type_id)
                .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters))
                .set_limit(this.widget_options.max_visible_options)
                .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
                .using(this.get_dashboard_api_type_ids);

            FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(
                context_query,
                this.get_discarded_field_paths
            );

            context_query.filters = ContextFilterVOHandler.add_context_filters_exclude_values(
                this.exclude_values,
                this.vo_field_ref,
                context_query.filters,
                false,
            );

            // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
            // Si ce n'est pas le cas, je n'envoie pas la requête
            const base_table: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[context_query.base_api_type_id];

            if (
                base_table &&
                base_table.is_segmented
            ) {
                if (
                    !base_table.table_segmented_field ||
                    !base_table.table_segmented_field.foreign_ref_vo_type ||
                    !active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type] ||
                    !Object.keys(active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type]).length
                ) {
                    return;
                }

                let has_filter: boolean = false;

                for (const field_id in active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type]) {
                    if (active_field_filters[base_table.table_segmented_field.foreign_ref_vo_type][field_id]) {
                        has_filter = true;
                        break;
                    }
                }

                if (!has_filter) {
                    return;
                }
            } else {
                context_query = await FieldValueFilterWidgetController.getInstance().check_segmented_dependencies(
                    context_query,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths,
                    true
                );
            }

            tmp = await ModuleContextFilter.instance.select_filter_visible_options(
                context_query,
                this.actual_query,
            );

            // We must keep and apply the last request response
            // - This widget may already have perform a request
            if (this.last_calculation_cpt != launch_cpt) {
                return;
            }

            // Si on cherche à faire du multi-filtrage, on charge toutes les données
            if (this.vo_field_ref_multiple?.length > 0) {
                for (const i in this.vo_field_ref_multiple) {
                    const field_ref: VOFieldRefVO = this.vo_field_ref_multiple[i];

                    const field_ref_api_type_id = field_ref.api_type_id;

                    const field_ref_access_policy_name = ModuleDAO.instance.getAccessPolicyName(
                        ModuleDAO.DAO_ACCESS_TYPE_READ,
                        field_ref_api_type_id
                    );

                    const has_access_field_ref_api_type_id = await ModuleAccessPolicy.getInstance().testAccess(
                        field_ref_access_policy_name
                    );

                    if (!has_access_field_ref_api_type_id) {
                        return;
                    }

                    const query_field_ref = query(field_ref_api_type_id)
                        .field(field_ref.field_id, 'label')
                        .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters))
                        .set_limit(this.widget_options.max_visible_options)
                        .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
                        .using(this.get_dashboard_api_type_ids);

                    FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(query_field_ref, this.get_discarded_field_paths);

                    const tmp_field_ref: DataFilterOption[] = await ModuleContextFilter.instance.select_filter_visible_options(
                        query_field_ref,
                        this.actual_query,
                    );

                    if (tmp_field_ref && (tmp_field_ref.length > 0)) {
                        if (!tmp) {
                            tmp = [];
                        }

                        tmp = tmp.concat(tmp_field_ref);
                    }
                }
            }

            if (this.is_translatable_type) {
                tmp.sort((a: DataFilterOption, b: DataFilterOption) => {
                    const la = this.label(a.label);
                    const lb = this.label(b.label);

                    if (la < lb) {
                        return -1;
                    }

                    if (lb < la) {
                        return 1;
                    }

                    return 0;
                });
            }

            // On va supprimer ce qu'y dépasse s'il y a
            if (tmp && (tmp.length > this.widget_options.max_visible_options)) {
                tmp.splice((this.widget_options.max_visible_options - 1), (tmp.length - this.widget_options.max_visible_options));
            }

            // Si je ne suis pas sur la dernière demande, je me casse
            if (this.last_calculation_cpt != launch_cpt) {
                return;
            }

            let tmp_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = {};

            if (this.vo_field_ref_lvl2) {
                const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
                const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

                const promises = [];

                for (const i in tmp) {
                    const opt: DataFilterOption = tmp[i];

                    promises.push((async () => {
                        const active_field_filters_lvl2: FieldFiltersVO = {};

                        if (!active_field_filters_lvl2[this.vo_field_ref.api_type_id]) {
                            active_field_filters_lvl2[this.vo_field_ref.api_type_id] = {};
                        }

                        if (!active_field_filters_lvl2[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]) {
                            active_field_filters_lvl2[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                                opt,
                                null,
                                field,
                                this.vo_field_ref
                            );
                        }

                        const field_sort_lvl2: VOFieldRefVO = this.vo_field_sort_lvl2 ? this.vo_field_sort_lvl2 : this.vo_field_ref_lvl2;

                        const field_ref_api_type_id = this.vo_field_ref_lvl2.api_type_id;

                        const field_ref_access_policy_name = ModuleDAO.instance.getAccessPolicyName(
                            ModuleDAO.DAO_ACCESS_TYPE_READ,
                            field_ref_api_type_id
                        );

                        const has_access_field_ref_api_type_id = await ModuleAccessPolicy.getInstance().testAccess(
                            field_ref_access_policy_name
                        );

                        if (!has_access_field_ref_api_type_id) {
                            return;
                        }

                        const context_query_lvl2 = query(field_ref_api_type_id)
                            .field(this.vo_field_ref_lvl2.field_id, 'label')
                            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters_lvl2))
                            .set_limit(this.widget_options.max_visible_options)
                            .set_sort(new SortByVO(field_sort_lvl2.api_type_id, field_sort_lvl2.field_id, true))
                            .using(this.get_dashboard_api_type_ids);

                        FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(
                            context_query_lvl2,
                            this.get_discarded_field_paths
                        );

                        const tmp_lvl2_opts: DataFilterOption[] = await ModuleContextFilter.instance.select_filter_visible_options(
                            context_query_lvl2,
                            this.actual_query
                        );

                        if (tmp_lvl2_opts && (tmp_lvl2_opts.length > 0)) {
                            tmp_lvl2[opt.label] = tmp_lvl2_opts;
                        }
                    })());
                }

                if (promises.length > 0) {
                    await all_promises(promises);
                }
            }

            // Si je ne suis pas sur la dernière demande, je me casse
            if (this.last_calculation_cpt != launch_cpt) {
                return;
            }

            if (!tmp) {
                tmp = [];
                tmp_lvl2 = {};
            }

            if (this.separation_active_filter && (tmp.length > 0)) {
                for (const key in this.tmp_active_filter_options) {
                    const tfao = this.tmp_active_filter_options[key];
                    const index_opt = tmp?.findIndex((e) => e.label == tfao.label);
                    if (index_opt > -1) {
                        tmp.splice(index_opt, 1);
                    }
                }
            }

            if (this.add_is_null_selectable) {
                tmp.unshift(new DataFilterOption(
                    DataFilterOption.STATE_SELECTABLE,
                    this.label('datafilteroption.is_null'),
                    RangeHandler.MIN_INT,
                ));
            }

            this.filter_visible_options = tmp;
            this.filter_visible_options_lvl2 = tmp_lvl2;
        }
    }


    // create single data filter to apply
    private createDataFilter(id: number): DataFilterOption {
        const dataFilter = new DataFilterOption(
            DataFilterOption.STATE_SELECTED,
            id.toString(),
            id
        );
        dataFilter.numeric_value = id;

        return dataFilter;
    }

    /**
     * Try Apply Actual Active Filters
     *  - Make the showable active filter options by the given filter
     * @param filter ContextFilterVO
     * @returns boolean
     */
    private try_apply_actual_active_filters(filter_: ContextFilterVO): boolean {

        if (!filter) {
            if (this.is_advanced_filters) {
                this.is_advanced_filters = false;
            }
            if (this.tmp_active_filter_options?.length > 0) {
                this.tmp_active_filter_options = null;
                this.active_option_lvl1 = {};
            }
            if (this.advanced_ref_field_filters) {
                this.advanced_ref_field_filters = null;
            }

            return true;
        }

        /**
         * si on a des filtres autres que simple, on doit passer en advanced
         */
        if (this.has_advanced_filter(filter_)) {

            if (!this.is_advanced_filters) {
                this.is_advanced_filters = true;
            }

            if (this.tmp_active_filter_options?.length > 0) {
                this.tmp_active_filter_options = null;
                this.active_option_lvl1 = {};
            }

            const advanced_filters: AdvancedRefFieldFilter[] = [];

            if ((this.vo_field_ref_multiple?.length > 0)) {
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
            } else {
                this.try_apply_advanced_filters(filter_, advanced_filters);
            }

            this.advanced_ref_field_filters = advanced_filters;
        } else {

            if (this.is_advanced_filters) {
                this.is_advanced_filters = false;
            }

            if (this.advanced_ref_field_filters) {
                this.advanced_ref_field_filters = null;
            }

            const tmp_active_filter_options: DataFilterOption[] = [];

            for (const i in filter_.param_numeric_array) {
                const id = filter_.param_numeric_array[i];

                const dataFilter = this.createDataFilter(id);

                tmp_active_filter_options.push(dataFilter);

                this.active_option_lvl1[dataFilter.label] = true;
            }

            this.tmp_active_filter_options = tmp_active_filter_options;
        }

        return true;
    }

    private has_advanced_filter(filter_: ContextFilterVO): boolean {
        if ((filter_.filter_type == ContextFilterVO.TYPE_TEXT_EQUALS_ANY) && (filter_.param_numeric_array != null) && (filter_.param_numeric_array.length > 0)) {
            return false;
        }

        return true;
    }

    /**
     * handle change filter opt input
     *  - happen when we toggle checkbox | radio button
     * @param input the select option input field value
     * @param opt Option object
     */
    private handle_change_filter_opt_input(input: any, opt: DataFilterOption) {
        let tmp_active_filter_options: DataFilterOption[] = cloneDeep(this.tmp_active_filter_options);

        if (!tmp_active_filter_options?.length || !this.can_select_multiple) {
            tmp_active_filter_options = [];
        }

        const opt_index: number = tmp_active_filter_options?.findIndex((e) => e.label == opt.label);
        const opt_splice: number = this.filter_visible_options?.findIndex((e) => e.label == opt.label);

        if (opt_index >= 0) {
            // toggle the active filter to false
            // - remove from the active filters
            Vue.set(this.active_option_lvl1, opt.label, false);
            tmp_active_filter_options.splice(opt_index, 1);

            if (this.separation_active_filter) {
                this.filter_visible_options.push(opt);
            }
        } else {
            // toggle the active filter to true
            // add it to the active filters
            Vue.set(this.active_option_lvl1, opt.label, true);
            tmp_active_filter_options.push(opt);

            if (this.separation_active_filter) {
                this.filter_visible_options.splice(opt_splice, 1);
            }
        }

        if (!this.can_select_multiple) {
            this.tmp_active_filter_options_lvl2 = {};
        }
        this.tmp_active_filter_options = tmp_active_filter_options;
    }

    private onchange_filter_opt_lvl2_input(input: any, opt: DataFilterOption, optlvl1: DataFilterOption) {
        let tmp_active_filter_options_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = cloneDeep(this.tmp_active_filter_options_lvl2);

        if (!tmp_active_filter_options_lvl2 || !this.can_select_multiple) {
            tmp_active_filter_options_lvl2 = {};
        }

        let opt_index: number = -1;

        if (tmp_active_filter_options_lvl2[optlvl1.label]) {
            opt_index = tmp_active_filter_options_lvl2[optlvl1.label]?.findIndex((e) => e.label == opt.label);
        }

        if (opt_index >= 0) {
            tmp_active_filter_options_lvl2[optlvl1.label].splice(opt_index, 1);
        } else {
            if (!tmp_active_filter_options_lvl2[optlvl1.label]) {
                tmp_active_filter_options_lvl2[optlvl1.label] = [];
            }

            tmp_active_filter_options_lvl2[optlvl1.label].push(opt);
        }

        if (!this.can_select_multiple) {
            this.tmp_active_filter_options = null;
        }
        this.tmp_active_filter_options_lvl2 = tmp_active_filter_options_lvl2;
    }

    private get_ContextFilterVO_from_AdvancedRefFieldFilter(advanced_filter: AdvancedRefFieldFilter, field: ModuleTableFieldVO, vo_field_ref: VOFieldRefVO): ContextFilterVO {
        let translated_active_options = null;

        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:

                switch (advanced_filter.filter_type) {
                    case AdvancedRefFieldFilter.FILTER_TYPE_EQ:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_num_eq(advanced_filter.filter_content);
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_NOTEQ:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_num_not_eq(advanced_filter.filter_content);
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_INF:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_num_inf(advanced_filter.filter_content);
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_INFEQ:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_num_inf_eq(advanced_filter.filter_content);
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_SUP:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_num_sup(advanced_filter.filter_content);
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_SUPEQ:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_num_sup_eq(advanced_filter.filter_content);
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_EST_NULL:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).has_null();
                        break;
                    case AdvancedRefFieldFilter.FILTER_TYPE_NEST_PAS_NULL:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).is_not_null();
                        break;
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_color:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }

    private try_apply_advanced_filters(filter_: ContextFilterVO, advanced_filters: AdvancedRefFieldFilter[]) {
        const advanced_filter = new AdvancedRefFieldFilter();

        switch (filter_.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
                advanced_filters[(advanced_filters.length - 1)].link_type = AdvancedRefFieldFilter.LINK_TYPE_ET;
                this.try_apply_advanced_filters(filter_.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
                advanced_filters[(advanced_filters.length - 1)].link_type = AdvancedRefFieldFilter.LINK_TYPE_OU;
                this.try_apply_advanced_filters(filter_.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_EQ;
                advanced_filter.filter_content = filter_.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_NOTEQ;
                advanced_filter.filter_content = filter_.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ALL:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_INF;
                advanced_filter.filter_content = filter_.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ALL:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_INFEQ;
                advanced_filter.filter_content = filter_.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ALL:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_SUP;
                advanced_filter.filter_content = filter_.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ALL:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_SUPEQ;
                advanced_filter.filter_content = filter_.param_numeric;
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_EST_NULL;
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                advanced_filter.filter_type = AdvancedRefFieldFilter.FILTER_TYPE_NEST_PAS_NULL;
                break;

            default:
                throw new Error('Not Implemented');
        }

        advanced_filters.push(advanced_filter);
    }

    private onchange_advanced_ref_field_filter_content() {
        if (this.autovalidate_advanced_filter) {
            this.validate_advanced_ref_field_filter();
        }
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
        const index: number = this.tmp_active_filter_options?.findIndex(
            (e) => e.label == dfo.label
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
                (e) => e.label == dfo.label
            );
        }
    }

    get has_content_filter_type(): { [filter_type: number]: boolean } {
        const res: { [filter_type: number]: boolean } = {
            [AdvancedRefFieldFilter.FILTER_TYPE_EQ]: true,
            [AdvancedRefFieldFilter.FILTER_TYPE_NOTEQ]: true,
            [AdvancedRefFieldFilter.FILTER_TYPE_INF]: true,
            [AdvancedRefFieldFilter.FILTER_TYPE_INFEQ]: true,
            [AdvancedRefFieldFilter.FILTER_TYPE_SUP]: true,
            [AdvancedRefFieldFilter.FILTER_TYPE_SUPEQ]: true,
            [AdvancedRefFieldFilter.FILTER_TYPE_EST_NULL]: false,
            [AdvancedRefFieldFilter.FILTER_TYPE_NEST_PAS_NULL]: false,
        };

        return res;
    }

    get is_advanced_filter_valid(): boolean {
        if (!this.widget_options) {
            return false;
        }

        if ((!this.advanced_ref_field_filters) || (!this.advanced_ref_field_filters.length)) {
            return false;
        }

        for (const i in this.advanced_ref_field_filters) {
            const advanced_ref_field_filter = this.advanced_ref_field_filters[i];

            if (!this.has_content_filter_type[advanced_ref_field_filter.filter_type]) {
                continue;
            }

            if (advanced_ref_field_filter.filter_content == null) {
                return false;
            }
        }

        return true;
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get link_type_labels(): { [link_type: number]: string } {
        return AdvancedRefFieldFilter.FILTER_TYPE_LABELS;
    }

    get placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)];
    }

    get advanced_mode_placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.get_advanced_mode_placeholder_code_text(this.page_widget.id)])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_advanced_mode_placeholder_code_text(this.page_widget.id)];
    }

    get can_select_multiple(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_multiple;
    }

    get show_search_field(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.show_search_field;
    }

    get add_is_null_selectable(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.add_is_null_selectable;
    }

    get separation_active_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.separation_active_filter;
    }

    get is_checkbox(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.is_checkbox;
    }

    get is_button(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.is_button;
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
     * Can select None
     *  - Can select none clickable text
     */
    get can_select_none(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.can_select_none;
    }

    get hide_lvl2_if_lvl1_not_selected(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.hide_lvl2_if_lvl1_not_selected;
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get vo_field_ref_lvl2(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref_lvl2);
    }

    get vo_field_sort(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_sort)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort);
    }

    get vo_field_sort_lvl2(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_sort_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort_lvl2);
    }

    get advanced_mode(): boolean {
        return this.widget_options.advanced_mode;
    }

    get default_advanced_ref_field_filter_type(): number {
        return this.widget_options.default_advanced_ref_field_filter_type;
    }

    get hide_btn_switch_advanced(): boolean {
        return this.widget_options.hide_btn_switch_advanced;
    }

    get no_inter_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.no_inter_filter;
    }

    get has_other_ref_api_type_id(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.has_other_ref_api_type_id;
    }

    get other_ref_api_type_id(): string {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.other_ref_api_type_id;
    }

    get hide_advanced_ref_field_filter_type(): boolean {
        return this.widget_options.hide_advanced_ref_field_filter_type;
    }

    get vo_field_ref_multiple(): VOFieldRefVO[] {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref_multiple) || (!options.vo_field_ref_multiple.length)) {
            return null;
        }

        const res: VOFieldRefVO[] = [];

        for (const i in options.vo_field_ref_multiple) {
            res.push(Object.assign(new VOFieldRefVO(), options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get default_values(): DataFilterOption[] {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.default_filter_opt_values) || (!options.default_filter_opt_values.length)) {
            return null;
        }

        const res: DataFilterOption[] = [];

        for (const i in options.default_filter_opt_values) {
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
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.exclude_filter_opt_values) || (!options.exclude_filter_opt_values.length)) {
            return null;
        }

        const res: DataFilterOption[] = [];

        for (const i in options.exclude_filter_opt_values) {
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

    get autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.autovalidate_advanced_filter;
    }

    get active_field_on_autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.active_field_on_autovalidate_advanced_filter;
    }

    get is_translatable_type(): boolean {
        if (!this.vo_field_ref) {
            return false;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        if (!moduletable) {
            return false;
        }

        const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        if (!field) {
            return false;
        }

        return field.field_type == ModuleTableFieldVO.FIELD_TYPE_translatable_text;
    }

    get base_filter(): string {
        return 'filter_opt_' + this.page_widget.id + '_';
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }
}
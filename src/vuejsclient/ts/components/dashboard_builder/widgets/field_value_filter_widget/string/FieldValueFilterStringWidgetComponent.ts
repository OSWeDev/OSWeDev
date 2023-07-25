import { cloneDeep, debounce, isEqual } from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ContextFilterVOManager from '../../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTable from '../../../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
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
import AdvancedStringFilter from './AdvancedStringFilter';
import './FieldValueFilterStringWidgetComponent.scss';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import FieldFiltersVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/FieldFiltersVOHandler';
import FieldValueFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import FieldValueFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';

@Component({
    template: require('./FieldValueFilterStringWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterStringWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

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


    private tmp_filter_active_options: DataFilterOption[] = [];
    private tmp_filter_active_options_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = {};
    private active_option_lvl1: { [filter_opt_value: string]: boolean } = {};

    private filter_visible_options: DataFilterOption[] = [];
    private filter_visible_options_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = {};

    private is_advanced_filters: boolean = false;
    private force_filter_change: boolean = false;
    private advanced_string_filters: AdvancedStringFilter[] = [new AdvancedStringFilter()];

    private warn_existing_external_filters: boolean = false;

    private actual_query: string = null;
    private search_field_checkbox: string = null;

    private utility_tested_on_type: string = null;
    private utility_tested_on_field: string = null;

    private is_init: boolean = false;
    private old_widget_options: FieldValueFilterWidgetOptionsVO = null;

    private last_calculation_cpt: number = 0;

    private debounced_query_update_visible_options_checkbox = debounce(this.query_update_visible_options_checkbox.bind(this), 300);

    private filter_type_options: number[] = [
        AdvancedStringFilter.FILTER_TYPE_COMMENCE,
        AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS,
        AdvancedStringFilter.FILTER_TYPE_EST,
        AdvancedStringFilter.FILTER_TYPE_EST_NULL,
        AdvancedStringFilter.FILTER_TYPE_EST_VIDE,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE
    ];

    private throttled_update_visible_options = (timeout: number = 300) => (
        ThrottleHelper.getInstance().declare_throttle_without_args(
            this.update_visible_options.bind(this),
            timeout,
            { leading: false, trailing: true })
    )()

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

    get tmp_filter_active_options_by_column(): { [column_id: number]: DataFilterOption[] } {
        if ((!this.widget_options) || (!this.tmp_filter_active_options) || (!this.tmp_filter_active_options.length)) {
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

        let res: { [column_id: number]: DataFilterOption[] } = {};
        let column_id = 0;
        let nb_elt_by_column = Math.ceil(this.tmp_filter_active_options.length / nb_columns);

        for (let i in this.tmp_filter_active_options) {
            let filter_opt = this.tmp_filter_active_options[i];
            let i_n = parseInt(i);

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

        let res: { [column_id: number]: DataFilterOption[] } = {};
        let column_id = 0;
        let nb_elt_by_column = Math.ceil(this.filter_visible_options.length / nb_columns);

        for (let i in this.filter_visible_options) {
            let filter_opt = this.filter_visible_options[i];
            let i_n = parseInt(i);
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
            if (!!this.page_widget.json_options) {
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
     *  - Initialize the tmp_filter_active_options with default widget options
     *
     * @returns void
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
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

        this.throttled_update_visible_options();
    }

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     *  - Initialize the tmp_filter_active_options with default widget options
     * @returns {void}
     */
    @Watch('get_active_field_filters', { deep: true })
    private onchange_active_field_filters(): void {
        this.throttled_update_visible_options();
    }

    /**
     * On Change Tmp Filter Active Options
     * tmp_filter_active_options is the visible active filters of the widget
     *  - Handle change on tmp filter active options
     *  - Happen each time tmp_filter_active_options changes
     * @returns void
     */
    @Watch('tmp_filter_active_options')
    private onchange_tmp_filter_active_options() {

        if (!this.widget_options) {
            return;
        }

        // Si on doit masquer le lvl2, on va désactiver tous les options lvl2 qui ne doivent plus être cochées
        if (this.hide_lvl2_if_lvl1_not_selected) {
            // Si plus d'optlvl1 actif, je désactive tous les lvl2
            if (!this.tmp_filter_active_options || !this.tmp_filter_active_options.length) {
                this.tmp_filter_active_options_lvl2 = {};
                return;
            }

            // On regarde quelles optlvl1 est actif
            let optlvl1_by_label: { [label: string]: boolean } = {};

            for (let i in this.tmp_filter_active_options) {
                optlvl1_by_label[this.tmp_filter_active_options[i].label] = true;
            }

            let has_changes: boolean = false;
            let new_tmp_filter_active_options_lvl2 = {};
            for (let filter_opt_value in this.tmp_filter_active_options_lvl2) {
                if (optlvl1_by_label[filter_opt_value]) {
                    // On garde le filtre car le lvl1 est actif
                    new_tmp_filter_active_options_lvl2[filter_opt_value] = this.tmp_filter_active_options_lvl2[filter_opt_value];
                    continue;
                }

                has_changes = true;
            }

            if (has_changes) {
                this.tmp_filter_active_options_lvl2 = new_tmp_filter_active_options_lvl2;
                return;
            }

        }

        // Si on a un lvl2, on va filtrer par leurs valeurs donc on va dans l'autre fonction
        if (this.vo_field_ref_lvl2 && this.tmp_filter_active_options_lvl2 && (Object.keys(this.tmp_filter_active_options_lvl2).length > 0)) {
            this.onchange_tmp_filter_active_options_lvl2();
            return;
        }

        const context_filter = FieldValueFilterWidgetManager.create_context_filter_from_string_filter_options(
            this.vo_field_ref,
            this.tmp_filter_active_options,
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

    @Watch('tmp_filter_active_options_lvl2')
    private onchange_tmp_filter_active_options_lvl2() {

        if (!this.widget_options) {
            return;
        }

        let active_field_filter_lvl2: ContextFilterVO[] = [];

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        let filter_visible_options_by_values: { [value: string]: DataFilterOption } = {};

        for (let i in this.filter_visible_options) {
            filter_visible_options_by_values[this.filter_visible_options[i].label] = this.filter_visible_options[i];
        }

        for (let i in this.tmp_filter_active_options) {
            let filter_opt_value: string = this.tmp_filter_active_options[i].label;
            if (!this.tmp_filter_active_options_lvl2[filter_opt_value] || !this.tmp_filter_active_options_lvl2[filter_opt_value].length) {

                const context_filter = FieldValueFilterWidgetManager.create_context_filter_from_string_filter_options(
                    this.vo_field_ref,
                    [this.tmp_filter_active_options[i]],
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

        for (let filter_opt_value in this.tmp_filter_active_options_lvl2) {
            if (!this.tmp_filter_active_options_lvl2[filter_opt_value].length) {
                continue;
            }

            const context_filter = FieldValueFilterWidgetManager.create_context_filter_from_string_filter_options(
                this.vo_field_ref_lvl2,
                this.tmp_filter_active_options_lvl2[filter_opt_value],
                {
                    vo_field_ref_multiple: this.vo_field_ref_multiple,
                    vo_field_ref: this.vo_field_ref,
                }
            );

            if (!context_filter) {
                continue;
            }

            const context_filter_lvl1 = FieldValueFilterWidgetManager.create_context_filter_from_string_filter_options(
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

        selection = this.filter_visible_options?.map((_filter) =>
            new DataFilterOption(DataFilterOption.STATE_SELECTED, _filter.label, _filter.id)
        );

        this.tmp_filter_active_options = selection;
    }

    /**
     * Handle Select None
     *  - Remove all fields of the current selected active filter
     */
    private handle_select_none(): void {
        this.tmp_filter_active_options = [];
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedStringFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private add_advanced_string_filter() {
        if (!this.advanced_string_filters) {
            this.advanced_string_filters = [];
            return;
        }

        this.advanced_string_filters[this.advanced_string_filters.length - 1].link_type = AdvancedStringFilter.LINK_TYPE_ET;
        this.advanced_string_filters.push(new AdvancedStringFilter());
    }

    private validate_advanced_string_filter() {

        if (!this.is_advanced_filter_valid) {
            this.remove_active_field_filter({
                vo_type: this.vo_field_ref.api_type_id,
                field_id: this.vo_field_ref.field_id
            });

            return;
        }


        let context_filter_active_options: ContextFilterVO[] = [];

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

        let previous_filter: AdvancedStringFilter = null;
        let tmp_context_filter: ContextFilterVO = null;


        // query().filter_by_date_after().filter_by_date_before()
        // a.or(b).or(c)
        // ContextFilterVO.or([a, b, c]).by_date_eq().by_date_before()

        if (this.vo_field_ref_multiple?.length > 0) {
            // Case when we have a search from multiple vos api_type_id
            // We need to create a context_filter for each of those
            for (let j in this.vo_field_ref_multiple) {
                const vo_field_ref_multiple = this.vo_field_ref_multiple[j];

                const moduletable_multiple = VOsTypesManager.moduleTables_by_voType[vo_field_ref_multiple.api_type_id];
                const field_multiple = moduletable_multiple.get_field_by_id(vo_field_ref_multiple.field_id);

                tmp_context_filter = null;
                previous_filter = null;

                for (let i in this.advanced_string_filters) {
                    const advanced_filter: AdvancedStringFilter = this.advanced_string_filters[i];

                    tmp_context_filter = this.get_advanced_string_filter(
                        tmp_context_filter,
                        advanced_filter,
                        field_multiple,
                        vo_field_ref_multiple,
                        previous_filter
                    );
                }

                if (tmp_context_filter) {
                    context_filter_active_options.push(tmp_context_filter);
                }
            }
        }

        previous_filter = null;
        tmp_context_filter = null;

        for (let i in this.advanced_string_filters) {
            let advanced_filter: AdvancedStringFilter = this.advanced_string_filters[i];

            tmp_context_filter = this.get_advanced_string_filter(
                tmp_context_filter,
                advanced_filter,
                field,
                this.vo_field_ref,
                previous_filter
            );
        }

        if (tmp_context_filter) {
            context_filter_active_options.push(tmp_context_filter);
        }

        if (context_filter_active_options.length > 0) {
            this.set_active_field_filter({
                field_id: this.vo_field_ref.field_id,
                vo_type: this.vo_field_ref.api_type_id,
                active_field_filter: ContextFilterVO.or(context_filter_active_options),
            });
        }
    }

    private get_advanced_string_filter(context_filter: ContextFilterVO, advanced_filter: AdvancedStringFilter, field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO, previous_filter: AdvancedStringFilter): ContextFilterVO {
        let new_context_filter = this.get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter, field, vo_field_ref);

        if (!new_context_filter) {
            return null;
        }

        if (!context_filter) {
            context_filter = new_context_filter;
        } else {

            let link_ = new ContextFilterVO();
            link_.field_id = context_filter.field_id;
            link_.vo_type = context_filter.vo_type;

            if (previous_filter.link_type == AdvancedStringFilter.LINK_TYPE_ET) {
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

    private delete_advanced_string_filter(index: number) {
        if ((!this.advanced_string_filters) || (index >= this.advanced_string_filters.length - 1)) {
            return;
        }

        this.advanced_string_filters.splice(index, 1);
    }

    private switch_link_type(advanced_string_filter: AdvancedStringFilter) {
        advanced_string_filter.link_type = 1 - advanced_string_filter.link_type;
    }

    /**
     * Toggle Advanced Filters
     * Do toggle the advanced option of string filter
     */
    private toggle_advanced_filters() {
        this.is_advanced_filters = !this.is_advanced_filters;
        this.force_filter_change = true;

        this.tmp_filter_active_options = null;
        this.active_option_lvl1 = {};
        this.tmp_filter_active_options_lvl2 = {};

        // revove the active filter from context
        if (!!this.vo_field_ref) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
        }

        this.advanced_string_filters = [new AdvancedStringFilter()];

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
        this.tmp_filter_active_options = []; // Reset le niveau 1
        this.active_option_lvl1 = {};
        this.tmp_filter_active_options_lvl2 = {}; //Reset le niveau 2
        this.filter_visible_options_lvl2 = {};
        this.advanced_string_filters = [new AdvancedStringFilter()]; // Reset les champs saisie libre

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

        let launch_cpt: number = (this.last_calculation_cpt + 1);

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
        let has_active_field_filter: boolean = !!(root_context_filter);

        // Si on a des valeurs par défaut, on va faire l'init
        let old_is_init: boolean = this.is_init;

        this.is_init = true;

        // case when not currently initializing
        if (!old_is_init) {
            // Sets visible active filter options with default values
            if (this.default_values?.length > 0) {

                // Si je n'ai pas de filtre actif OU que ma valeur de default values à changée, je prends les valeurs par défaut
                // case when does not have active filter
                if (!has_active_field_filter || this.default_values_changed) {
                    this.default_values_changed = false;
                    this.tmp_filter_active_options = this.default_values;

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

                if (this.advanced_string_filters?.length > 0) {
                    this.advanced_string_filters = null;
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
            if (this.default_advanced_string_filter_type != null) {
                for (let i in this.advanced_string_filters) {
                    this.advanced_string_filters[i].filter_type = this.default_advanced_string_filter_type;
                }

                if (!this.has_content_filter_type[this.default_advanced_string_filter_type]) {
                    this.validate_advanced_string_filter();
                    return;
                }
            }
        }

        // case when has active context filter but active visible filter empty
        // - try to apply context filter or display filter application fail alert
        if (has_active_field_filter &&
            (!(this.tmp_filter_active_options?.length > 0))) {

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
        //     ((!this.tmp_filter_active_options_lvl2) || (!this.tmp_filter_active_options_lvl2.length))) {

        //     /**
        //      * On essaye d'appliquer les filtres. Si on peut pas appliquer un filtre, on garde l'info pour afficher une petite alerte
        //      */
        //     let res: boolean = !this.try_apply_actual_active_filters_lvl2(this.get_active_field_filters[this.vo_field_ref_lvl2.api_type_id][this.vo_field_ref_lvl2.field_id]);

        //     if (!this.warn_existing_external_filters) {
        //         this.warn_existing_external_filters = res;
        //     }
        // }

        let field_sort: VOFieldRefVO = this.vo_field_sort ? this.vo_field_sort : this.vo_field_ref;

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

        let api_type_id: string = (this.has_other_ref_api_type_id && this.other_ref_api_type_id) ?
            this.other_ref_api_type_id :
            this.vo_field_ref.api_type_id;

        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, api_type_id);
        const has_access = await ModuleAccessPolicy.getInstance().testAccess(access_policy_name);

        if (!has_access) {
            return;
        }

        let context_query = query(api_type_id)
            .field(this.vo_field_ref.field_id, 'label', this.vo_field_ref.api_type_id)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters))
            .set_limit(this.widget_options.max_visible_options)
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .using(this.dashboard.api_type_ids);

        FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(
            context_query,
            this.get_discarded_field_paths
        );

        context_query.filters = ContextFilterVOHandler.getInstance().add_context_filters_exclude_values(
            this.exclude_values,
            this.vo_field_ref,
            context_query.filters,
            false,
        );

        // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
        // Si ce n'est pas le cas, je n'envoie pas la requête
        let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

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
            context_query = await FieldValueFilterWidgetController.getInstance().check_segmented_dependencies(
                this.dashboard,
                context_query,
                this.get_discarded_field_paths,
                true
            );
        }

        tmp = await ModuleContextFilter.getInstance().select_filter_visible_options(
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
            for (let i in this.vo_field_ref_multiple) {
                let field_ref: VOFieldRefVO = this.vo_field_ref_multiple[i];

                const field_ref_api_type_id = field_ref.api_type_id;

                const field_ref_access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_READ,
                    field_ref_api_type_id
                );

                const has_access_field_ref_api_type_id = await ModuleAccessPolicy.getInstance().testAccess(
                    field_ref_access_policy_name
                );

                if (!has_access_field_ref_api_type_id) {
                    return;
                }

                let query_field_ref = query(field_ref_api_type_id)
                    .field(field_ref.field_id, 'label')
                    .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters))
                    .set_limit(this.widget_options.max_visible_options)
                    .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
                    .using(this.dashboard.api_type_ids);

                FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(query_field_ref, this.get_discarded_field_paths);

                let tmp_field_ref: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
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
                let la = this.label(a.label);
                let lb = this.label(b.label);

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
            let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
            let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

            let promises = [];

            for (let i in tmp) {
                let opt: DataFilterOption = tmp[i];

                promises.push((async () => {
                    let active_field_filters_lvl2: FieldFiltersVO = {};

                    if (!active_field_filters_lvl2[this.vo_field_ref.api_type_id]) {
                        active_field_filters_lvl2[this.vo_field_ref.api_type_id] = {};
                    }

                    if (!active_field_filters_lvl2[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]) {
                        active_field_filters_lvl2[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] = ContextFilterVOManager.get_context_filter_from_data_filter_option(
                            opt,
                            null,
                            field,
                            this.vo_field_ref
                        );
                    }

                    let field_sort_lvl2: VOFieldRefVO = this.vo_field_sort_lvl2 ? this.vo_field_sort_lvl2 : this.vo_field_ref_lvl2;

                    const field_ref_api_type_id = this.vo_field_ref_lvl2.api_type_id;

                    const field_ref_access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
                        ModuleDAO.DAO_ACCESS_TYPE_READ,
                        field_ref_api_type_id
                    );

                    const has_access_field_ref_api_type_id = await ModuleAccessPolicy.getInstance().testAccess(
                        field_ref_access_policy_name
                    );

                    if (!has_access_field_ref_api_type_id) {
                        return;
                    }

                    let context_query_lvl2 = query(field_ref_api_type_id)
                        .field(this.vo_field_ref_lvl2.field_id, 'label')
                        .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters_lvl2))
                        .set_limit(this.widget_options.max_visible_options)
                        .set_sort(new SortByVO(field_sort_lvl2.api_type_id, field_sort_lvl2.field_id, true))
                        .using(this.dashboard.api_type_ids);

                    FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(
                        context_query_lvl2,
                        this.get_discarded_field_paths
                    );

                    let tmp_lvl2_opts: DataFilterOption[] = await ModuleContextFilter.getInstance().select_filter_visible_options(
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
            for (const key in this.tmp_filter_active_options) {
                let tfao = this.tmp_filter_active_options[key];
                let index_opt = tmp.findIndex((e) => e.label == tfao.label);
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


    // create single data filter to apply
    private createDataFilter(text: string, index: string | number): DataFilterOption {
        let dataFilter = new DataFilterOption(
            DataFilterOption.STATE_SELECTED,
            text,
            parseInt(index.toString())
        );
        dataFilter.string_value = text;

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
            if (this.tmp_filter_active_options) {
                this.tmp_filter_active_options = null;
                this.active_option_lvl1 = {};
            }
            if (this.advanced_string_filters) {
                this.advanced_string_filters = null;
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

            if (this.tmp_filter_active_options) {
                this.tmp_filter_active_options = null;
                this.active_option_lvl1 = {};
            }

            let advanced_filters: AdvancedStringFilter[] = [];

            if ((this.vo_field_ref_multiple?.length > 0)) {
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
            } else {
                this.try_apply_advanced_filters(filter_, advanced_filters);
            }

            this.advanced_string_filters = advanced_filters;
        } else {

            if (this.is_advanced_filters) {
                this.is_advanced_filters = false;
            }

            if (this.advanced_string_filters) {
                this.advanced_string_filters = null;
            }

            let tmp_filter_active_options: DataFilterOption[] = [];

            for (let i in filter_.param_textarray) {
                let text = filter_.param_textarray[i];

                const dataFilter = this.createDataFilter(text, i);

                tmp_filter_active_options.push(dataFilter);

                this.active_option_lvl1[dataFilter.label] = true;
            }

            this.tmp_filter_active_options = tmp_filter_active_options;
        }

        return true;
    }

    // private try_apply_actual_active_filters_lvl2(filter: ContextFilterVO): boolean {
    //     if (!filter) {
    //         if (this.is_advanced_filters) {
    //             this.is_advanced_filters = false;
    //         }
    //         if (this.tmp_filter_active_options_lvl2) {
    //             this.tmp_filter_active_options_lvl2 = null;
    //         }
    //         if (this.advanced_string_filters) {
    //             this.advanced_string_filters = null;
    //         }

    //         return true;
    //     }

    //     /**
    //      * si on a des filtres autres que simple, on doit passer en advanced
    //      */
    //     if (this.has_advanced_filter(filter)) {

    //         if (!this.is_advanced_filters) {
    //             this.is_advanced_filters = true;
    //         }
    //         if (this.tmp_filter_active_options_lvl2) {
    //             this.tmp_filter_active_options_lvl2 = null;
    //         }
    //         let advanced_filters: AdvancedStringFilter[] = [];
    //         this.try_apply_advanced_filters(filter, advanced_filters);
    //         this.advanced_string_filters = advanced_filters;
    //     } else {

    //         if (this.is_advanced_filters) {
    //             this.is_advanced_filters = false;
    //         }
    //         if (this.advanced_string_filters) {
    //             this.advanced_string_filters = null;
    //         }

    //         let tmp_filter_active_options_lvl2: DataFilterOption[] = [];

    //         for (let i in filter.param_textarray) {
    //             let text = filter.param_textarray[i];
    //             let datafilter = new DataFilterOption(
    //                 DataFilterOption.STATE_SELECTED,
    //                 text,
    //                 parseInt(i.toString())
    //             );
    //             datafilter.string_value = text;
    //             tmp_filter_active_options_lvl2.push(datafilter);
    //         }
    //         this.tmp_filter_active_options_lvl2 = tmp_filter_active_options_lvl2;
    //     }
    //     return true;
    // }

    private has_advanced_filter(filter_: ContextFilterVO): boolean {
        if ((filter_.filter_type == ContextFilterVO.TYPE_TEXT_EQUALS_ANY) && (filter_.param_textarray != null) && (filter_.param_textarray.length > 0)) {
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
        let tmp_filter_active_options: DataFilterOption[] = cloneDeep(this.tmp_filter_active_options);

        if (!tmp_filter_active_options || !this.can_select_multiple) {
            tmp_filter_active_options = [];
        }

        let opt_index: number = tmp_filter_active_options.findIndex((e) => e.label == opt.label);
        let opt_splice: number = this.filter_visible_options.findIndex((e) => e.label == opt.label);

        if (opt_index >= 0) {
            // toggle the active filter to false
            // - remove from the active filters
            Vue.set(this.active_option_lvl1, opt.label, false);
            tmp_filter_active_options.splice(opt_index, 1);

            if (this.separation_active_filter) {
                this.filter_visible_options.push(opt);
            }
        } else {
            // toggle the active filter to true
            // add it to the active filters
            Vue.set(this.active_option_lvl1, opt.label, true);
            tmp_filter_active_options.push(opt);

            if (this.separation_active_filter) {
                this.filter_visible_options.splice(opt_splice, 1);
            }
        }

        if (!this.can_select_multiple) {
            this.tmp_filter_active_options_lvl2 = {};
        }
        this.tmp_filter_active_options = tmp_filter_active_options;
    }

    private onchange_filter_opt_lvl2_input(input: any, opt: DataFilterOption, optlvl1: DataFilterOption) {
        let tmp_filter_active_options_lvl2: { [filter_opt_value: string]: DataFilterOption[] } = cloneDeep(this.tmp_filter_active_options_lvl2);

        if (!tmp_filter_active_options_lvl2 || !this.can_select_multiple) {
            tmp_filter_active_options_lvl2 = {};
        }

        let opt_index: number = -1;

        if (tmp_filter_active_options_lvl2[optlvl1.label]) {
            opt_index = tmp_filter_active_options_lvl2[optlvl1.label].findIndex((e) => e.label == opt.label);
        }

        if (opt_index >= 0) {
            tmp_filter_active_options_lvl2[optlvl1.label].splice(opt_index, 1);
        } else {
            if (!tmp_filter_active_options_lvl2[optlvl1.label]) {
                tmp_filter_active_options_lvl2[optlvl1.label] = [];
            }

            tmp_filter_active_options_lvl2[optlvl1.label].push(opt);
        }

        if (!this.can_select_multiple) {
            this.tmp_filter_active_options = null;
        }
        this.tmp_filter_active_options_lvl2 = tmp_filter_active_options_lvl2;
    }

    private get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter: AdvancedStringFilter, field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): ContextFilterVO {
        let translated_active_options = null;

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:

                switch (advanced_filter.filter_type) {
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_starting_with(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_starting_with_none(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_including(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_excluding(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has_none(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_NULL:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).has_null();
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).is_not_null();
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_VIDE:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has('');
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has_none('');
                        break;
                }
                break;

            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }

    private try_apply_advanced_filters(filter_: ContextFilterVO, advanced_filters: AdvancedStringFilter[]) {
        let advanced_filter = new AdvancedStringFilter();

        switch (filter_.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
                advanced_filters[(advanced_filters.length - 1)].link_type = AdvancedStringFilter.LINK_TYPE_ET;
                this.try_apply_advanced_filters(filter_.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_advanced_filters(filter_.left_hook, advanced_filters);
                advanced_filters[(advanced_filters.length - 1)].link_type = AdvancedStringFilter.LINK_TYPE_OU;
                this.try_apply_advanced_filters(filter_.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_COMMENCE;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST_NULL;
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL;
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                if (filter_.param_text == '') {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST_VIDE;
                    advanced_filter.filter_content = filter_.param_text;
                } else {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST;
                    advanced_filter.filter_content = filter_.param_text;
                }
                break;
            case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                if (filter_.param_text == '') {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE;
                    advanced_filter.filter_content = filter_.param_text;
                } else {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS;
                    advanced_filter.filter_content = filter_.param_text;
                }
                break;

            default:
                throw new Error('Not Implemented');
        }

        advanced_filters.push(advanced_filter);
    }

    private onchange_advanced_string_filter_content() {
        if (this.autovalidate_advanced_filter) {
            this.validate_advanced_string_filter();
        }
    }

    private select_option(dfo: DataFilterOption) {
        if (!dfo) {
            return;
        }

        let index: number = this.tmp_filter_active_options.findIndex((e) => e.label == dfo.label);

        if (index >= 0) {
            this.tmp_filter_active_options.splice(index, 1);
        } else {
            this.tmp_filter_active_options.push(dfo);
        }
    }

    get has_content_filter_type(): { [filter_type: number]: boolean } {
        let res: { [filter_type: number]: boolean } = {
            [AdvancedStringFilter.FILTER_TYPE_COMMENCE]: true,
            [AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_CONTIENT]: true,
            [AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_EST]: true,
            [AdvancedStringFilter.FILTER_TYPE_EST_NULL]: false,
            [AdvancedStringFilter.FILTER_TYPE_EST_VIDE]: false,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL]: false,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE]: false,
        };

        return res;
    }

    get is_advanced_filter_valid(): boolean {
        if (!this.widget_options) {
            return false;
        }

        if ((!this.advanced_string_filters) || (!this.advanced_string_filters.length)) {
            return false;
        }

        for (let i in this.advanced_string_filters) {
            let advanced_string_filter = this.advanced_string_filters[i];

            if (!this.has_content_filter_type[advanced_string_filter.filter_type]) {
                continue;
            }

            if (advanced_string_filter.filter_content == '') {
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
        return AdvancedStringFilter.FILTER_TYPE_LABELS;
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
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get vo_field_ref_lvl2(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref_lvl2);
    }

    get vo_field_sort(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_sort)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort);
    }

    get vo_field_sort_lvl2(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_sort_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort_lvl2);
    }

    get advanced_mode(): boolean {
        return this.widget_options.advanced_mode;
    }

    get default_advanced_string_filter_type(): number {
        return this.widget_options.default_advanced_string_filter_type;
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

    get hide_advanced_string_filter_type(): boolean {
        return this.widget_options.hide_advanced_string_filter_type;
    }

    get vo_field_ref_multiple(): VOFieldRefVO[] {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref_multiple) || (!options.vo_field_ref_multiple.length)) {
            return null;
        }

        let res: VOFieldRefVO[] = [];

        for (let i in options.vo_field_ref_multiple) {
            res.push(Object.assign(new VOFieldRefVO(), options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get default_values(): DataFilterOption[] {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

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
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

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

    get base_filter(): string {
        return 'filter_opt_' + this.page_widget.id + '_';
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }
}
import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOHandler from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import FieldValueFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTableVO from '../../../../../../../shared/modules/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/ModuleTableFieldVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
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
import FieldValueFilterWidgetController from '../FieldValueFilterWidgetController';
import AdvancedNumberFilter from './AdvancedNumberFilter';
import './FieldValueFilterNumberWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterNumberWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterNumberWidgetComponent extends VueComponentBase {

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

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private default_values_changed: boolean = false; //Attribut pour reaffecter les valeurs par défaut lorsqu'elles sont modifiées.


    private tmp_active_filter_options: DataFilterOption[] = null;

    private filter_visible_options: DataFilterOption[] = [];

    private advanced_filters: boolean = true;
    private advanced_number_filters: AdvancedNumberFilter[] = [new AdvancedNumberFilter()];

    private warn_existing_external_filters: boolean = false;

    private is_init: boolean = false;
    private old_widget_options: FieldValueFilterWidgetOptionsVO = null;

    private actual_query: string = null;
    private last_calculation_cpt: number = 0;

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private filter_type_options: number[] = [
        AdvancedNumberFilter.FILTER_TYPE_INF,
        AdvancedNumberFilter.FILTER_TYPE_INFEQ,
        AdvancedNumberFilter.FILTER_TYPE_SUP,
        AdvancedNumberFilter.FILTER_TYPE_SUPEQ,
        AdvancedNumberFilter.FILTER_TYPE_EST_NULL,
        AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL,
        AdvancedNumberFilter.FILTER_TYPE_EQ,
        AdvancedNumberFilter.FILTER_TYPE_NOTEQ,
    ];

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

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

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    @Watch('tmp_active_filter_options')
    private onchange_tmp_active_filter_options() {

        if (!this.widget_options) {
            return;
        }

        let context_filter: ContextFilterVO = null;
        let locale_tmp_active_filter_options = null;

        if (TypesHandler.getInstance().isArray(this.tmp_active_filter_options)) {
            locale_tmp_active_filter_options = this.tmp_active_filter_options;
        } else {
            if (this.tmp_active_filter_options != null) {
                locale_tmp_active_filter_options = [this.tmp_active_filter_options];
            }
        }

        if ((!locale_tmp_active_filter_options) || (!locale_tmp_active_filter_options.length)) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        let has_null_value: boolean = false;

        for (let i in locale_tmp_active_filter_options) {
            let active_option = locale_tmp_active_filter_options[i];

            if (active_option.id == RangeHandler.MIN_INT) {
                has_null_value = true;
                continue;
            }

            let new_context_filter = ContextFilterVOManager.create_context_filter_from_data_filter_option(
                active_option,
                null,
                field,
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
            let cf_null_value: ContextFilterVO = new ContextFilterVO();
            cf_null_value.field_id = this.vo_field_ref.field_id;
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
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedNumberFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    private onchange_advanced_number_filter_content() {
        if (this.autovalidate_advanced_filter) {
            this.validate_advanced_number_filter();
        }
    }

    private add_advanced_number_filter() {
        if (!this.advanced_number_filters) {
            this.advanced_number_filters = [];
            return;
        }

        this.advanced_number_filters[this.advanced_number_filters.length - 1].link_type = AdvancedNumberFilter.LINK_TYPE_ET;
        this.advanced_number_filters.push(new AdvancedNumberFilter());
    }

    private validate_advanced_number_filter() {
        if (!this.is_advanced_filter_valid) {
            return;
        }

        let context_filter: ContextFilterVO = null;

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        let previous_filter: AdvancedNumberFilter = null;

        for (let i in this.advanced_number_filters) {
            let advanced_filter: AdvancedNumberFilter = this.advanced_number_filters[i];

            let new_context_filter = this.get_ContextFilterVO_from_AdvancedNumberFilter(advanced_filter, field);

            if (!new_context_filter) {
                continue;
            }

            if (!context_filter) {
                context_filter = new_context_filter;
            } else {

                let link_ = new ContextFilterVO();
                link_.field_id = context_filter.field_id;
                link_.vo_type = context_filter.vo_type;

                if (previous_filter.link_type == AdvancedNumberFilter.LINK_TYPE_ET) {
                    link_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
                } else {
                    link_.filter_type = ContextFilterVO.TYPE_FILTER_OR;
                }

                link_.left_hook = context_filter;
                link_.right_hook = new_context_filter;
                context_filter = link_;
            }
            previous_filter = advanced_filter;
        }

        if (!context_filter) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: context_filter,
        });
    }

    private delete_advanced_number_filter(i: number) {
        if ((!this.advanced_number_filters) || (i >= this.advanced_number_filters.length - 1)) {
            return;
        }
        this.advanced_number_filters.splice(i, 1);
    }

    private switch_link_type(advanced_number_filter: AdvancedNumberFilter) {
        advanced_number_filter.link_type = 1 - advanced_number_filter.link_type;
    }

    private async switch_advanced_filters() {
        this.advanced_filters = !this.advanced_filters;

        if (this.tmp_active_filter_options?.length > 0) {
            this.tmp_active_filter_options = null;
        }

        if (!!this.vo_field_ref) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
        }
        this.advanced_number_filters = [new AdvancedNumberFilter()];

        await this.throttled_update_visible_options();
    }

    private async query_update_visible_options(queryStr: string) {
        this.actual_query = queryStr;
        await this.throttled_update_visible_options();
    }

    private async reset_visible_options() {
        this.tmp_active_filter_options = [];
        this.filter_visible_options = [];
        this.advanced_number_filters = [new AdvancedNumberFilter()];
        // On update le visuel de tout le monde suite au reset
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Si on a des valeurs par défaut, on va faire l'init
        let old_is_init: boolean = this.is_init;

        this.is_init = true;

        if (!old_is_init) {
            // Si on a des valeurs par défaut, on va faire l'init
            if (this.default_values && (this.default_values.length > 0)) {

                // Si je n'ai pas de filtre actif OU que ma valeur de default values à changée, je prends les valeurs par défaut
                let has_active_field_filter: boolean = !!(
                    this.get_active_field_filters &&
                    this.get_active_field_filters[this.vo_field_ref.api_type_id] &&
                    this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]
                );

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

        /**
         * Si le filtrage est vide, on repasse en filtrage normal si on était en avancé
         */
        if ((!this.get_active_field_filters) || (!this.get_active_field_filters[this.vo_field_ref.api_type_id]) ||
            (!this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id])) {

            // if (this.advanced_filters) {
            //     this.advanced_filters = false;
            // }
            if (this.advanced_number_filters) {
                this.advanced_number_filters = [new AdvancedNumberFilter()];
            }
        }

        /**
         * Cas où l'on réinit un filter alors qu'on a déjà un filtre actif enregistré (retour sur la page du filtre typiquement)
         */
        if (this.get_active_field_filters && this.get_active_field_filters[this.vo_field_ref.api_type_id] &&
            this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] &&
            ((!this.tmp_active_filter_options) || (!this.tmp_active_filter_options.length))) {

            /**
             * On essaye d'appliquer les filtres. Si on peut pas appliquer un filtre, on garde l'info pour afficher une petite alerte
             */
            this.warn_existing_external_filters = !this.try_apply_actual_active_filters(this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]);
        }

        if (!this.advanced_filters) {
            let active_field_filters_query: FieldFiltersVO = null;

            if (!this.no_inter_filter) {
                active_field_filters_query = FieldFiltersVOManager.clean_field_filters_for_request(
                    this.get_active_field_filters
                );
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

            let query_ = query(api_type_id)
                .set_limit(
                    this.widget_options.max_visible_options,
                    0
                );
            query_.fields = [new ContextQueryFieldVO(this.vo_field_ref.api_type_id, this.vo_field_ref.field_id, 'label')];
            query_.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters_query);
            query_.active_api_type_ids = this.get_dashboard_api_type_ids;

            FieldValueFilterWidgetController.getInstance().add_discarded_field_paths(query_, this.get_discarded_field_paths);

            query_.filters = ContextFilterVOHandler.add_context_filters_exclude_values(
                this.exclude_values,
                this.vo_field_ref,
                query_.filters,
                false,
            );

            // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
            // Si ce n'est pas le cas, je n'envoie pas la requête
            let base_table: ModuleTableVO<any> = VOsTypesManager.moduleTables_by_voType[query_.base_api_type_id];

            if (
                base_table &&
                base_table.is_segmented
            ) {
                if (
                    !base_table.table_segmented_field ||
                    !base_table.table_segmented_field.manyToOne_target_moduletable ||
                    !active_field_filters_query[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type] ||
                    !Object.keys(active_field_filters_query[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]).length
                ) {
                    return;
                }

                let has_filter: boolean = false;

                for (let field_id in active_field_filters_query[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]) {
                    if (active_field_filters_query[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type][field_id]) {
                        has_filter = true;
                        break;
                    }
                }

                if (!has_filter) {
                    return;
                }
            } else {
                query_ = await FieldValueFilterWidgetController.getInstance().check_segmented_dependencies(
                    query_,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths,
                    true);
            }

            tmp = await ModuleContextFilter.getInstance().select_filter_visible_options(
                query_,
                this.actual_query
            );


            // Si je ne suis pas sur la dernière demande, je me casse
            if (this.last_calculation_cpt != launch_cpt) {
                return;
            }

            if (!tmp) {
                tmp = [];
            }

            if (this.add_is_null_selectable) {
                tmp.unshift(new DataFilterOption(
                    DataFilterOption.STATE_SELECTABLE,
                    this.label('datafilteroption.is_null'),
                    RangeHandler.MIN_INT,
                ));
            }

            this.filter_visible_options = tmp;
        }
    }

    private try_apply_actual_active_filters(filter: ContextFilterVO): boolean {
        if (!filter) {
            // if (this.advanced_filters) {
            //     this.advanced_filters = false;
            // }
            if (this.tmp_active_filter_options?.length > 0) {
                this.tmp_active_filter_options = null;
            }
            if (this.advanced_number_filters) {
                this.advanced_number_filters = [new AdvancedNumberFilter()];
            }

            return true;
        }

        /**
         * si on a des filtres autres que simple, on doit passer en advanced
         */
        if (this.has_advanced_filter(filter)) {

            if (!this.advanced_filters) {
                this.advanced_filters = true;
            }
            if (this.tmp_active_filter_options?.length > 0) {
                this.tmp_active_filter_options = null;
            }

            let advanced_filters: AdvancedNumberFilter[] = [];
            this.try_apply_advanced_filters(filter, advanced_filters);
            this.advanced_number_filters = advanced_filters;
        } else {

            // if (this.advanced_filters) {
            //     this.advanced_filters = false;
            // }
            if (this.advanced_number_filters) {
                this.advanced_number_filters = [new AdvancedNumberFilter()];
            }

            let tmp_active_filter_options: DataFilterOption[] = [];

            for (let i in filter.param_textarray) {
                let text = filter.param_textarray[i];
                let datafilter = new DataFilterOption(
                    DataFilterOption.STATE_SELECTED,
                    text,
                    parseInt(i.toString())
                );
                datafilter.string_value = text;
                tmp_active_filter_options.push(datafilter);
            }
            this.tmp_active_filter_options = tmp_active_filter_options;
        }
        return true;
    }

    private has_advanced_filter(filter: ContextFilterVO): boolean {
        if ((filter.filter_type == ContextFilterVO.TYPE_NUMERIC_INTERSECTS) && (filter.param_textarray != null) && (filter.param_textarray.length > 0)) {
            return false;
        }

        return true;
    }

    private get_ContextFilterVO_from_AdvancedNumberFilter(advanced_filter: AdvancedNumberFilter, field: ModuleTableFieldVO<any>): ContextFilterVO {
        let context_filter = new ContextFilterVO();

        context_filter.field_id = this.vo_field_ref.field_id;
        context_filter.vo_type = this.vo_field_ref.api_type_id;

        let field_type = null;
        if ((!field) && (this.vo_field_ref.field_id == 'id')) {
            field_type = ModuleTableFieldVO.FIELD_TYPE_int;
        } else {
            field_type = field.field_type;
        }

        let need_value: boolean = false;

        switch (field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
                switch (advanced_filter.filter_type) {
                    case AdvancedNumberFilter.FILTER_TYPE_EST_NULL:
                        context_filter.filter_type = ContextFilterVO.TYPE_NULL_ANY;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL:
                        context_filter.filter_type = ContextFilterVO.TYPE_NULL_NONE;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_INF:
                        need_value = true;
                        context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_INF_ANY;
                        context_filter.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_INFEQ:
                        need_value = true;
                        context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY;
                        context_filter.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_SUP:
                        need_value = true;
                        context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_SUP_ANY;
                        context_filter.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_SUPEQ:
                        need_value = true;
                        context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY;
                        context_filter.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_EQ:
                        need_value = true;
                        context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
                        context_filter.param_numeric = advanced_filter.filter_content;
                        break;
                    case AdvancedNumberFilter.FILTER_TYPE_NOTEQ:
                        need_value = true;
                        context_filter.filter_type = ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;
                        context_filter.param_numeric = advanced_filter.filter_content;
                        break;
                }
                break;

            default:
                throw new Error('Not Implemented');
        }

        if (need_value && ((context_filter.param_numeric === null) || (!context_filter.param_numeric.toString().length))) {
            return null;
        }

        return context_filter;
    }

    private try_apply_advanced_filters(filter: ContextFilterVO, advanced_filters: AdvancedNumberFilter[]) {
        let advanced_filter = new AdvancedNumberFilter();

        switch (filter.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                this.try_apply_advanced_filters(filter.left_hook, advanced_filters);
                advanced_filters[(advanced_filters.length - 1)].link_type = AdvancedNumberFilter.LINK_TYPE_ET;
                this.try_apply_advanced_filters(filter.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_advanced_filters(filter.left_hook, advanced_filters);
                advanced_filters[(advanced_filters.length - 1)].link_type = AdvancedNumberFilter.LINK_TYPE_OU;
                this.try_apply_advanced_filters(filter.right_hook, advanced_filters);
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_EST_NULL;
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_INF;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_INFEQ;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL;
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_SUP;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY:
                advanced_filter.filter_type = AdvancedNumberFilter.FILTER_TYPE_SUPEQ;
                advanced_filter.filter_content = filter.param_numeric;
                break;

            default:
                throw new Error('Not Implemented');
        }

        advanced_filters.push(advanced_filter);
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get link_type_labels(): { [link_type: number]: string } {
        return AdvancedNumberFilter.FILTER_TYPE_LABELS;
    }

    get is_advanced_filter_valid(): boolean {
        if (!this.widget_options) {
            return false;
        }

        if ((!this.advanced_number_filters) || (!this.advanced_number_filters.length)) {
            return false;
        }

        for (let i in this.advanced_number_filters) {
            let advanced_number_filter = this.advanced_number_filters[i];

            if (!this.has_content_filter_type[advanced_number_filter.filter_type]) {
                continue;
            }

            if (advanced_number_filter.filter_content == null) {
                return false;
            }
        }

        return true;
    }

    get has_content_filter_type(): { [filter_type: number]: boolean } {
        let res: { [filter_type: number]: boolean } = {
            [AdvancedNumberFilter.FILTER_TYPE_INF]: true,
            [AdvancedNumberFilter.FILTER_TYPE_INFEQ]: true,
            [AdvancedNumberFilter.FILTER_TYPE_SUP]: true,
            [AdvancedNumberFilter.FILTER_TYPE_SUPEQ]: true,
            [AdvancedNumberFilter.FILTER_TYPE_EST_NULL]: false,
            [AdvancedNumberFilter.FILTER_TYPE_NEST_PAS_NULL]: false,
            [AdvancedNumberFilter.FILTER_TYPE_EQ]: true,
            [AdvancedNumberFilter.FILTER_TYPE_NOTEQ]: true,
        };

        return res;
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

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
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

    get widget_options() {
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

    get autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.autovalidate_advanced_filter;
    }
}
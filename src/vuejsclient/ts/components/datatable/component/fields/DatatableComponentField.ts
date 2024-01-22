import { cloneDeep, isArray } from 'lodash';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToOneReferenceDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import VarDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/VarDatatableFieldVO';
import DashboardBuilderController from '../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IRange from '../../../../../../shared/modules/DataRender/interfaces/IRange';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import ConditionHandler, { ConditionStatement } from '../../../../../../shared/tools/ConditionHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../../../shared/tools/TypesHandler';
import VarDataRefComponent from '../../../Var/components/dataref/VarDataRefComponent';
import VueComponentBase from '../../../VueComponentBase';
import FileDatatableFieldComponent from '../fields/file/file_datatable_field';
import './DatatableComponentField.scss';
import DBVarDatatableFieldComponent from './dashboard_var/db_var_datatable_field';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./DatatableComponentField.pug'),
    components: {
        Filedatatablefieldcomponent: FileDatatableFieldComponent,
        Dbvardatatablefieldcomponent: DBVarDatatableFieldComponent
    }
})
export default class DatatableComponentField extends VueComponentBase {

    @Prop({
        type: Object,
        default: () => ({})
    })
    private field: DatatableField<any, any> | VarDatatableFieldVO<any, any>;

    @Prop()
    private vo: IDistantVOBase;

    @Prop({ default: null })
    private column: TableColumnDescVO;

    @Prop({ default: null })
    private columns: TableColumnDescVO[];

    @Prop({ default: false })
    private show_label: boolean;

    @Prop({ default: false })
    private explicit_html: boolean;

    @Prop({ default: false })
    private is_dashboard_builder: boolean;

    @Prop({ default: false })
    private show_tooltip: boolean;

    @Prop({ default: false })
    private disabled_many_to_one_link: boolean;

    @Prop({ default: null })
    private filter_custom_field_filters: { [field_id: string]: string };

    @Prop({ default: null })
    private do_not_user_filter_active_ids: number[];

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private filter: () => any;

    @Prop({ default: false })
    private table_is_busy: boolean;

    @Prop({ default: false })
    private editable: boolean;

    @Prop({ default: null })
    private with_style: string;

    @Prop({ default: null })
    private column_key: string;

    @Prop({ default: null })
    private filter_additional_params: any[];

    private has_access_DAO_ACCESS_TYPE_INSERT_OR_UPDATE: boolean = false;

    private is_load: boolean = false;

    get field_type(): string {
        return this.field?.field_type || ModuleTableField.FIELD_TYPE_int; // Pour le cas de l'id
    }
    private var_value: VarDataValueResVO = null;

    private custom_style: string = null;

    private throttle_init_custom_style = ThrottleHelper.declare_throttle_without_args(this.init_custom_style.bind(this), 50, { leading: false });

    public async mounted() {
        if ((this.field as ManyToOneReferenceDatatableFieldVO<any>).targetModuleTable) {
            this.has_access_DAO_ACCESS_TYPE_INSERT_OR_UPDATE = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE,
                    (this.field as ManyToOneReferenceDatatableFieldVO<any>).targetModuleTable.vo_type
                )
            );
        }

        this.is_load = true;
    }

    @Watch('with_style', { immediate: true })
    @Watch('var_value')
    private async onchange_var_value() {
        this.throttle_init_custom_style();
    }


    private get_crud_link(api_type_id: string, vo_id: number) {
        if (!this.has_access_DAO_ACCESS_TYPE_INSERT_OR_UPDATE) {
            return;
        }

        if (this.is_dashboard_builder) {
            let route_name: string = this.$route.name.replace(DashboardBuilderController.ROUTE_NAME_CRUD, '').replace(DashboardBuilderController.ROUTE_NAME_CRUD_ALL, '');

            route_name += DashboardBuilderController.ROUTE_NAME_CRUD + DashboardBuilderController.ROUTE_NAME_CRUD_ALL;

            let route_params = cloneDeep(this.$route.params);

            if (vo_id) {
                route_params.dashboard_vo_action = DashboardBuilderController.DASHBOARD_VO_ACTION_EDIT;
            } else {
                route_params.dashboard_vo_action = DashboardBuilderController.DASHBOARD_VO_ACTION_ADD;
            }

            route_params.dashboard_vo_id = vo_id ? vo_id.toString() : null;

            route_params.api_type_id_action = api_type_id;

            return {
                name: route_name,
                params: route_params,
            };
        }

        return this.getCRUDUpdateLink(api_type_id, vo_id);
    }

    private get_filtered_value(val) {

        if (val == null) {
            return null;
        }

        if (!this.filter) {
            return val;
        }

        let params = [val];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    /**
     * init_custom_style
     * - init the custom style of the cell depending on the field type and the value
     *
     * @returns {void}
     */
    private init_custom_style(): void {
        const column_key = this.column_key;
        let style = this.with_style ?? '';

        if (!this.columns || !column_key) {
            return;
        }

        // The column description
        const column: TableColumnDescVO = this.columns[column_key];

        let added_dynamic_style = false;

        // deduct style from field type and column colors_by_value_and_conditions
        for (const key in column?.colors_by_value_and_conditions) {
            const color_by_value_and_condition = column.colors_by_value_and_conditions[key];

            if (!color_by_value_and_condition) {
                continue;
            }

            // The condition to apply the color
            const condition = color_by_value_and_condition.condition;
            // The value to compare
            const value = TypesHandler.isNumeric(color_by_value_and_condition.value) ?
                parseFloat(color_by_value_and_condition.value) :
                color_by_value_and_condition.value;

            if (column.is_number && ConditionHandler.dynamic_statement(this.field_value, condition as ConditionStatement, value)) {
                style += `; background-color: ${color_by_value_and_condition.color?.bg}; color: ${color_by_value_and_condition.color?.text};`;
                added_dynamic_style = true;
            }

            if (column.is_var && ConditionHandler.dynamic_statement(this.var_value ? this.var_value.value : null, condition as ConditionStatement, value)) {
                style += `; background-color: ${color_by_value_and_condition.color?.bg}; color: ${color_by_value_and_condition.color?.text};`;
                added_dynamic_style = true;
            }
        }

        if (added_dynamic_style) {
            style += ";text-align: center;border-radius: 4px;";
        }


        this.custom_style = style;
    }

    /**
     * handle_var_value_callback
     * - keep track of the var value (from the VarDataRefComponent child)
     *
     * @param {VarDataValueResVO} var_value
     * @param {VarDataRefComponent} component
     */
    private handle_var_value_callback(var_value: VarDataValueResVO, component: VarDataRefComponent) {
        this.var_value = var_value;

        return var_value.value;
    }

    get simple_field(): SimpleDatatableFieldVO<any, any> {
        return (this.field as SimpleDatatableFieldVO<any, any>);
    }

    private get_segmented_max(range: IRange) {
        if (!range) {
            return null;
        }

        return RangeHandler.getSegmentedMax(range);
    }

    private get_segmented_min(range: IRange) {
        if (!range) {
            return null;
        }

        return RangeHandler.getSegmentedMin(range);
    }

    private refresh() {
        this.$emit('refresh');
    }

    get field_value(): any {

        // if (this.vo[this.field.datatable_field_uid] == null) {
        //     return this.vo[this.field.datatable_field_uid];
        // }

        // switch (this.field.type) {
        //     case DatatableField.SIMPLE_FIELD_TYPE:

        //         switch (this.simple_field.field_type) {
        //             case ModuleTableField.FIELD_TYPE_enum:

        //                 let enum_val = this.vo[this.field.datatable_field_uid];
        //                 return this.t(this.simple_field.enum_values[enum_val]);

        //             default:
        //                 return this.vo[this.field.datatable_field_uid];
        //         }
        //     default:

        // Si je suis sur un champ HTML, je cherche à afficher les balises HTML
        if (this.field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            if (
                (this.simple_field.field_type == ModuleTableField.FIELD_TYPE_html) ||
                (this.simple_field.field_type == ModuleTableField.FIELD_TYPE_html_array)
            ) {
                return this.explicit_html ? this.vo[this.field.datatable_field_uid + '__raw'] : this.vo[this.field.datatable_field_uid];
            }

            if (this.field.field_type == ModuleTableField.FIELD_TYPE_translatable_text) {
                if (!this.vo[this.field.datatable_field_uid + '__raw']) {
                    return null;
                }

                if (!isArray(this.vo[this.field.datatable_field_uid + '__raw'])) {

                    if (!!this.field.moduleTableField.translatable_params_field_id) {
                        let params = null;
                        try {
                            params = JSON.parse(this.vo[this.field.moduleTableField.translatable_params_field_id]);
                        } catch (error) {
                            ConsoleHandler.error(error);
                        }
                        return this.label(this.vo[this.field.datatable_field_uid + '__raw'], params);
                    } else {
                        return this.label(this.vo[this.field.datatable_field_uid + '__raw']);
                    }
                }

                if (this.vo[this.field.datatable_field_uid + '__raw'].length == 0) {
                    return null;
                }

                let res = [];
                for (let i in this.vo[this.field.datatable_field_uid + '__raw']) {
                    let translatable_text = this.vo[this.field.datatable_field_uid + '__raw'][i];

                    if (!!this.field.moduleTableField.translatable_params_field_id) {
                        let params = null;
                        try {
                            params = JSON.parse(this.vo[this.field.moduleTableField.translatable_params_field_id][i]);
                        } catch (error) {
                            ConsoleHandler.error(error);
                        }
                        res.push(this.label(translatable_text, params));
                    } else {
                        res.push(this.label(translatable_text));
                    }
                }

                return res.join(', ');
            }
        }

        return this.vo[this.field.datatable_field_uid];
        // }
    }

    get transliterate_enum_value_to_class_name(): string {
        return ((this.field_value !== null && this.field_value !== undefined) ? this.field_value.toString().replace(/[^a-zA-Z0-9-_]/ig, '_') : this.field_value);
    }

    get is_custom_field_type(): boolean {
        return !!this.custom_field_types;
    }

    get custom_field_types(): TableFieldTypeControllerBase {
        if (TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
            return TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[this.simple_field.field_type];
        }

        return null;
    }
}
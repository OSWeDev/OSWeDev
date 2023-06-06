import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToOneReferenceDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import DashboardBuilderController from '../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import VueComponentBase from '../../../VueComponentBase';
import FileDatatableFieldComponent from '../fields/file/file_datatable_field';
import DBVarDatatableFieldComponent from './dashboard_var/db_var_datatable_field';
import './DatatableComponentField.scss';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';

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
    private field: DatatableField<any, any>;

    @Prop()
    private vo: IDistantVOBase;

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
    private filter: () => any;

    @Prop({ default: false })
    private table_is_busy: boolean;

    @Prop({ default: false })
    private editable: boolean;

    @Prop({ default: null })
    private filter_additional_params: any[];

    private has_access_DAO_ACCESS_TYPE_INSERT_OR_UPDATE: boolean = false;
    private is_load: boolean = false;

    public async mounted() {
        if ((this.field as ManyToOneReferenceDatatableFieldVO<any>).targetModuleTable) {
            this.has_access_DAO_ACCESS_TYPE_INSERT_OR_UPDATE = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, (this.field as ManyToOneReferenceDatatableFieldVO<any>).targetModuleTable.vo_type)
            );
        }

        this.is_load = true;
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

    get simple_field(): SimpleDatatableFieldVO<any, any> {
        return (this.field as SimpleDatatableFieldVO<any, any>);
    }

    get field_value(): any {

        // if (this.vo[this.field.datatable_field_uid] == null) {
        //     return this.vo[this.field.datatable_field_uid];
        // }

        // switch (this.field.type) {
        //     case DatatableField.SIMPLE_FIELD_TYPE:

        //         switch (this.simple_field.moduleTableField.field_type) {
        //             case ModuleTableField.FIELD_TYPE_enum:

        //                 let enum_val = this.vo[this.field.datatable_field_uid];
        //                 return this.t(this.simple_field.moduleTableField.enum_values[enum_val]);

        //             default:
        //                 return this.vo[this.field.datatable_field_uid];
        //         }
        //     default:
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
            return TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[this.simple_field.moduleTableField.field_type];
        }

        return null;
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
}
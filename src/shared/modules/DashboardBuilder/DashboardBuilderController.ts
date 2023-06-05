import { RouteConfig } from 'vue-router';
import ContextFilterVO, { filter } from '../ContextFilter/vos/ContextFilterVO';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import FieldFiltersVO from '../ContextFilter/vos/FieldFiltersVO';
import TableColumnDescVO from './vos/TableColumnDescVO';

export default class DashboardBuilderController {

    /**
     * On ajoute l'id tout simplement après le prefix et on a le code trad
     */

    public static DASHBOARD_NAME_CODE_PREFIX: string = "dashboard.name.";
    public static PAGE_NAME_CODE_PREFIX: string = "dashboard.page.name.";
    public static WIDGET_NAME_CODE_PREFIX: string = "dashboard.widget.name.";
    public static VOFIELDREF_NAME_CODE_PREFIX: string = "dashboard.vofieldref.name.";
    public static TableColumnDesc_NAME_CODE_PREFIX: string = "dashboard.table_column_desc.name.";

    public static DASHBOARD_VO_ACTION_ADD: string = "add";
    public static DASHBOARD_VO_ACTION_EDIT: string = "edit";
    public static DASHBOARD_VO_ACTION_DELETE: string = "delete";
    public static DASHBOARD_VO_ACTION_VOCUS: string = "vocus";

    public static ROUTE_NAME_CRUD: string = "__CRUD";
    public static ROUTE_NAME_CRUD_ALL: string = "__all";

    public static getInstance(): DashboardBuilderController {
        if (!DashboardBuilderController.instance) {
            DashboardBuilderController.instance = new DashboardBuilderController();
        }
        return DashboardBuilderController.instance;
    }

    private static instance: DashboardBuilderController = null;

    protected constructor() {
    }

    public addRouteForDashboard(path: string, name: string, component: any, crud: boolean): RouteConfig[] {
        let routes = [{
            path: path,
            name: name,
            component: component,
            props: true,
        }];

        if (crud) {
            name += DashboardBuilderController.ROUTE_NAME_CRUD;

            routes.push({
                path: path + '/:dashboard_vo_action/:dashboard_vo_id',
                name: name,
                component: component,
                props: true,
            });

            name += DashboardBuilderController.ROUTE_NAME_CRUD_ALL;

            routes.push({
                path: path + '/:dashboard_vo_action/:dashboard_vo_id/:api_type_id_action',
                name: name,
                component: component,
                props: true,
            });
        }

        return routes;
    }

    public add_table_row_context(
        context: FieldFiltersVO,
        columns: TableColumnDescVO[],
        row_value: any
    ): FieldFiltersVO {

        /**
         * Si on a des colonnes qui sont des colonnes de données sur la row, on doit amender les filtres pour ajouter le "contexte" de la ligne
         */
        if (!context) {
            context = {};
        }

        for (let i in columns) {
            let column = columns[i];

            if (column.type != TableColumnDescVO.TYPE_vo_field_ref) {
                continue;
            }

            /**
             * Si on est sur une aggrégation, on doit ignorer le filtrage sur cette colonne
             */
            if (column.many_to_many_aggregate) {
                continue;
            }

            if (!context[column.api_type_id]) {
                context[column.api_type_id] = {};
            }

            let field_filter = this.get_ContextFilterVO_add_Column_context(column, row_value);

            if (!context[column.api_type_id][column.field_id]) {
                context[column.api_type_id][column.field_id] = field_filter;
            } else {

                let existing_filter = context[column.api_type_id][column.field_id];
                let and_filter = new ContextFilterVO();
                and_filter.field_id = column.field_id;
                and_filter.vo_type = column.api_type_id;
                and_filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
                and_filter.left_hook = existing_filter;
                and_filter.right_hook = field_filter;
                context[column.api_type_id][column.field_id] = and_filter;
            }
        }

        return context;
    }

    public get_ContextFilterVO_add_Column_context(
        column: TableColumnDescVO, row_value: any): ContextFilterVO {
        let translated_active_options = null;

        let moduletable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
        let field = moduletable.get_field_by_id(column.field_id);

        if (row_value[column.datatable_field_uid + '__raw'] == null) {
            translated_active_options = filter(column.api_type_id, column.field_id).is_null();
        } else {
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

                    /**
                     * Si on a un regroupement, on peut avoir un array en raw, et dans ce cas on doit x les ranges
                     */
                    if (Array.isArray(row_value[column.datatable_field_uid + '__raw'])) {
                        translated_active_options = filter(column.api_type_id, column.field_id).by_num_has(row_value[column.datatable_field_uid + '__raw']);
                    } else {
                        translated_active_options = filter(column.api_type_id, column.field_id).by_num_eq(row_value[column.datatable_field_uid + '__raw']);
                    }

                    break;

                case ModuleTableField.FIELD_TYPE_tstz:
                    translated_active_options = filter(column.api_type_id, column.field_id).by_date_eq(row_value[column.datatable_field_uid + '__raw']);
                    break;

                case ModuleTableField.FIELD_TYPE_html:
                case ModuleTableField.FIELD_TYPE_password:
                case ModuleTableField.FIELD_TYPE_email:
                case ModuleTableField.FIELD_TYPE_file_field:
                case ModuleTableField.FIELD_TYPE_string:
                case ModuleTableField.FIELD_TYPE_textarea:
                case ModuleTableField.FIELD_TYPE_translatable_text:

                    /**
                     * Si on a un regroupement, on peut avoir un array en raw, et dans ce cas on doit x les ranges
                     */
                    if (Array.isArray(row_value[column.datatable_field_uid + '__raw'])) {
                        translated_active_options = filter(column.api_type_id, column.field_id).by_text_has(row_value[column.datatable_field_uid + '__raw']);
                    } else {
                        translated_active_options = filter(column.api_type_id, column.field_id).by_text_eq(row_value[column.datatable_field_uid + '__raw']);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                case ModuleTableField.FIELD_TYPE_html_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_boolean:
                    if (!!row_value[column.datatable_field_uid + '__raw']) {
                        translated_active_options = filter(column.api_type_id, column.field_id).is_true();
                    } else {
                        translated_active_options = filter(column.api_type_id, column.field_id).is_false();
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_numrange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_daterange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_hourrange:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_tsrange:

                    if (row_value[column.datatable_field_uid + '__raw'] != null) {
                        translated_active_options = filter(column.api_type_id, column.field_id).by_num_x_ranges([row_value[column.datatable_field_uid + '__raw']]);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_hourrange_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_float_array:
                case ModuleTableField.FIELD_TYPE_tstz_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_string_array:
                    throw new Error('Not Implemented');

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                case ModuleTableField.FIELD_TYPE_month:
                    translated_active_options = filter(column.api_type_id, column.field_id).by_date_eq(row_value[column.datatable_field_uid + '__raw']);
                    break;

                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                    throw new Error('Not Implemented');
            }
        }

        return translated_active_options;
    }
}
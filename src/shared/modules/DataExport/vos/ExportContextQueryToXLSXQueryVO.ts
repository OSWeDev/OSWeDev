import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../ContextFilter/vos/ContextQueryVO";
import DatatableField from "../../DAO/vos/datatable/DatatableField";
import FieldFiltersVO from "../../DashboardBuilder/vos/FieldFiltersVO";
import TableColumnDescVO from "../../DashboardBuilder/vos/TableColumnDescVO";
import IDistantVOBase from "../../IDistantVOBase";
import ExportVarIndicatorVO from "./ExportVarIndicatorVO";
import ExportVarcolumnConfVO from "./ExportVarcolumnConfVO";

export default class ExportContextQueryToXLSXQueryVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "export_contextquery_to_xlsx";

    public static STATE_LABELS: string[] = [
        'export_contextquery_to_xlsx.STATE_TODO',
        'export_contextquery_to_xlsx.STATE_EXPORTING',
        'export_contextquery_to_xlsx.STATE_DONE',
        'export_contextquery_to_xlsx.STATE_ERROR'
    ];
    public static STATE_TODO: number = 0;
    public static STATE_EXPORTING: number = 1;
    public static STATE_DONE: number = 2;
    public static STATE_ERROR: number = 3;

    public static create_new(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,

        columns: TableColumnDescVO[] = null,
        fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
        active_field_filters: FieldFiltersVO = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        is_secured: boolean = false,
        file_access_policy_name: string = null,

        target_user_id: number = null,

        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        export_active_field_filters?: boolean,
        export_vars_indicator?: boolean,
        send_email_with_export_notification?: boolean,

        vars_indicator?: ExportVarIndicatorVO,
    ) {
        const res: ExportContextQueryToXLSXQueryVO = new ExportContextQueryToXLSXQueryVO();

        res.filename = filename;
        res.context_query = context_query;
        res.ordered_column_list = ordered_column_list;
        res.column_labels = column_labels;
        res.exportable_datatable_custom_field_columns = exportable_datatable_custom_field_columns;

        res.columns = columns;
        res.fields = fields;
        res.varcolumn_conf = varcolumn_conf;
        res.active_field_filters = active_field_filters;
        res.custom_filters = custom_filters;
        res.active_api_type_ids = active_api_type_ids;
        res.discarded_field_paths = discarded_field_paths;

        res.is_secured = is_secured;
        res.file_access_policy_name = file_access_policy_name;

        res.target_user_id = target_user_id;

        res.do_not_use_filter_by_datatable_field_uid = do_not_use_filter_by_datatable_field_uid;

        res.export_active_field_filters = export_active_field_filters;
        res.export_vars_indicator = export_vars_indicator;
        res.send_email_with_export_notification = send_email_with_export_notification;

        res.vars_indicator = vars_indicator;

        return res;
    }

    public id: number;
    public _type: string = ExportContextQueryToXLSXQueryVO.API_TYPE_ID;

    public state: number;

    public filename: string;
    public context_query: ContextQueryVO;
    public ordered_column_list: string[];
    public column_labels: { [field_name: string]: string };
    public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string };

    public columns: TableColumnDescVO[];
    public fields: { [datatable_field_uid: string]: DatatableField<any, any> };
    public varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO };
    public active_field_filters: FieldFiltersVO;
    public custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } };
    public active_api_type_ids: string[];
    public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    public is_secured: boolean = false;
    public file_access_policy_name: string;

    public target_user_id: number;

    public do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } };

    public export_active_field_filters: boolean;
    public export_vars_indicator: boolean;
    public send_email_with_export_notification: boolean;

    public vars_indicator: ExportVarIndicatorVO;
}
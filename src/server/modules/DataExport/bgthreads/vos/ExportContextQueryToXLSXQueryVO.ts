import ContextFilterVO from "../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import TableColumnDescVO from "../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO";
import ExportVarcolumnConf from "../../../../../shared/modules/DataExport/vos/ExportVarcolumnConf";

export default class ExportContextQueryToXLSXQueryVO {
    public constructor(
        public filename: string,
        public context_query: ContextQueryVO,
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string },
        public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,

        public columns: TableColumnDescVO[],
        public varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        public active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        public custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        public active_api_type_ids: string[] = null,
        public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        public is_secured: boolean = false,
        public file_access_policy_name: string = null,

        public target_user_id: number = null) {
    }
}
import ContextFilterVO from "../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryVO from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DatatableField from "../../../../../shared/modules/DAO/vos/datatable/DatatableField";
import FieldFiltersVO from "../../../../../shared/modules/ContextFilter/vos/FieldFiltersVO";
import TableColumnDescVO from "../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO";
import IExportOptions from "../../../../../shared/modules/DataExport/interfaces/IExportOptions";
import ExportVarcolumnConf from "../../../../../shared/modules/DataExport/vos/ExportVarcolumnConf";
import ExportVarIndicator from "../../../../../shared/modules/DataExport/vos/ExportVarIndicator";

export default class ExportContextQueryToXLSXQueryVO {
    public constructor(
        public filename: string,
        public context_query: ContextQueryVO,
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string },
        public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,

        public columns: TableColumnDescVO[] = null,
        public fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        public varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        public active_field_filters: FieldFiltersVO = null,
        public custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        public active_api_type_ids: string[] = null,
        public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        public is_secured: boolean = false,
        public file_access_policy_name: string = null,

        public target_user_id: number = null,

        public do_not_user_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        public export_options?: IExportOptions,

        public vars_indicator?: ExportVarIndicator,
    ) { }
}
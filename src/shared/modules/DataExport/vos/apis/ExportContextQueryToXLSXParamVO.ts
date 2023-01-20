import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';
import ContextFilterVO from '../../../ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../ContextFilter/vos/ContextQueryVO';
import DatatableField from '../../../DAO/vos/datatable/DatatableField';
import TableColumnDescVO from '../../../DashboardBuilder/vos/TableColumnDescVO';
import ExportVarcolumnConf from '../ExportVarcolumnConf';

export default class ExportContextQueryToXLSXParamVO implements IAPIParamTranslator<ExportContextQueryToXLSXParamVO> {

    public static fromParams(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        columns: TableColumnDescVO[] = null,
        fields: { [datatable_field_uid: number]: DatatableField<any, any> } = null,
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,
        is_secured: boolean = false,
        file_access_policy_name: string = null,
        target_user_id: number = null
    ): ExportContextQueryToXLSXParamVO {

        return new ExportContextQueryToXLSXParamVO(
            filename, context_query, ordered_column_list, column_labels, exportable_datatable_custom_field_columns, columns, fields, varcolumn_conf,
            active_field_filters, custom_filters, active_api_type_ids, discarded_field_paths, is_secured, file_access_policy_name, target_user_id);
    }

    public static getAPIParams(param: ExportContextQueryToXLSXParamVO): any[] {
        return [
            param.filename,
            param.context_query,
            param.ordered_column_list,
            param.column_labels,
            param.exportable_datatable_custom_field_columns,
            param.columns,
            param.fields,
            param.varcolumn_conf,
            param.active_field_filters,
            param.custom_filters,
            param.active_api_type_ids,
            param.discarded_field_paths,
            param.is_secured,
            param.file_access_policy_name,
            param.target_user_id
        ];
    }

    public constructor(
        public filename: string,
        public context_query: ContextQueryVO,
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string },

        public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        public columns: TableColumnDescVO[] = null,
        public fields: { [datatable_field_uid: number]: DatatableField<any, any> } = null,
        public varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        public active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        public custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        public active_api_type_ids: string[] = null,
        public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        public is_secured: boolean = false,
        public file_access_policy_name: string = null,
        public target_user_id: number = null
    ) { }
}

export const ExportContextQueryToXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportContextQueryToXLSXParamVO> = ExportContextQueryToXLSXParamVO;
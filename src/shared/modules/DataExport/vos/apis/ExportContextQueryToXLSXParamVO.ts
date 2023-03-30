import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';
import ContextFilterVO from '../../../ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../ContextFilter/vos/ContextQueryVO';
import DatatableField from '../../../DAO/vos/datatable/DatatableField';
import TableColumnDescVO from '../../../DashboardBuilder/vos/TableColumnDescVO';
import { IExportOptions } from '../../interfaces/IExportOptions';
import { ExportVarIndicator } from '../ExportVarIndicator';
import ExportVarcolumnConf from '../ExportVarcolumnConf';

export default class ExportContextQueryToXLSXParamVO implements IAPIParamTranslator<ExportContextQueryToXLSXParamVO> {

    public static fromParams(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        columns: TableColumnDescVO[] = null,
        fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
        custom_filters: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,
        is_secured: boolean = false,
        file_access_policy_name: string = null,
        target_user_id: number = null,
        do_not_user_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,
        export_options: IExportOptions = null,
        vars_indicator?: ExportVarIndicator,
    ): ExportContextQueryToXLSXParamVO {

        return new ExportContextQueryToXLSXParamVO(
            filename, context_query, ordered_column_list, column_labels, exportable_datatable_custom_field_columns, columns, fields, varcolumn_conf,
            active_field_filters, custom_filters, active_api_type_ids, discarded_field_paths, is_secured, file_access_policy_name, target_user_id,
            do_not_user_filter_by_datatable_field_uid, export_options, vars_indicator);
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
            param.target_user_id,
            param.do_not_user_filter_by_datatable_field_uid,
            param.export_options,
            param.vars_indicator,
        ];
    }

    public constructor(
        public filename?: string,
        public context_query?: ContextQueryVO,
        public ordered_column_list?: string[],
        public column_labels?: { [field_name: string]: string },

        public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        public columns: TableColumnDescVO[] = null,
        public fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        public varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConf } = null,
        public active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null,
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

    public from(props: {
        filename?: string,
        context_query?: ContextQueryVO,
        ordered_column_list?: string[],
        column_labels?: { [field_name: string]: string },
        exportable_datatable_custom_field_columns?: { [datatable_field_uid: string]: string },
        columns?: TableColumnDescVO[],
        fields?: { [datatable_field_uid: string]: DatatableField<any, any> },
        varcolumn_conf?: { [datatable_field_uid: string]: ExportVarcolumnConf },
        active_field_filters?: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        custom_filters?: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } },
        active_api_type_ids?: string[],
        discarded_field_paths?: { [vo_type: string]: { [field_id: string]: boolean } },
        is_secured?: boolean,
        file_access_policy_name?: string,
        target_user_id?: number,
        do_not_user_filter_by_datatable_field_uid?: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } },
        export_options?: IExportOptions,
        vars_indicator?: ExportVarIndicator,
    }): ExportContextQueryToXLSXParamVO {

        this.filename = props.filename ?? this.filename;
        this.context_query = Object.assign(new ContextQueryVO(), props.context_query) ?? this.context_query;
        this.ordered_column_list = props.ordered_column_list ?? this.ordered_column_list;
        this.column_labels = props.column_labels ?? this.column_labels;
        this.exportable_datatable_custom_field_columns = props.exportable_datatable_custom_field_columns ?? this.exportable_datatable_custom_field_columns;
        this.columns = props.columns?.map((c) => Object.assign(new TableColumnDescVO(), c)) ?? this.columns;
        this.fields = props.fields ?? this.fields;
        this.varcolumn_conf = props.varcolumn_conf ?? this.varcolumn_conf;
        this.active_field_filters = props.active_field_filters ?? this.active_field_filters;
        this.custom_filters = props.custom_filters ?? this.custom_filters;
        this.active_api_type_ids = props.active_api_type_ids ?? this.active_api_type_ids;
        this.discarded_field_paths = props.discarded_field_paths ?? this.discarded_field_paths;
        this.is_secured = props.is_secured ?? this.is_secured;
        this.file_access_policy_name = props.file_access_policy_name ?? this.file_access_policy_name;
        this.target_user_id = props.target_user_id ?? this.target_user_id;
        this.do_not_user_filter_by_datatable_field_uid = props.do_not_user_filter_by_datatable_field_uid ?? this.do_not_user_filter_by_datatable_field_uid;
        this.export_options = props.export_options ?? this.export_options;
        this.vars_indicator = props.vars_indicator ?? this.vars_indicator;

        return this;
    }
}

export const ExportContextQueryToXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportContextQueryToXLSXParamVO> = ExportContextQueryToXLSXParamVO;
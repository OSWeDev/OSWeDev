/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';
import ContextFilterVO from '../../../ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../ContextFilter/vos/ContextQueryVO';
import DatatableField from '../../../DAO/vos/datatable/DatatableField';
import FieldFiltersVO from '../../../DashboardBuilder/vos/FieldFiltersVO';
import TableColumnDescVO from '../../../DashboardBuilder/vos/TableColumnDescVO';
import AbstractVO from '../../../VO/abstract/AbstractVO';
import ExportVarIndicatorVO from '../ExportVarIndicatorVO';
import ExportVarcolumnConfVO from '../ExportVarcolumnConfVO';

/**
 * @class ExportContextQueryToXLSXParamVO
 *  - This VO is used to export a context query to an XLSX file
 */
export default class ExportContextQueryToXLSXParamVO extends AbstractVO implements IAPIParamTranslator<ExportContextQueryToXLSXParamVO> {

    public constructor(
        public dashboard_id?: number,
        public filename?: string,
        public context_query?: ContextQueryVO,
        public ordered_column_list?: string[],
        public column_labels?: { [field_name: string]: string },

        public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        public columns: TableColumnDescVO[] = null,
        public fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        public varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
        public active_field_filters: FieldFiltersVO = null,
        public custom_filters: FieldFiltersVO = null,
        public active_api_type_ids: string[] = null,
        public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,

        public is_secured: boolean = false,
        public file_access_policy_name: string = null,
        public target_user_id: number = null,
        public do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,

        public export_active_field_filters?: boolean,
        public export_vars_indicator?: boolean,
        public send_email_with_export_notification?: boolean,

        // public vars_indicator?: ExportVarIndicatorVO[],
        public vars_indicator?: ExportVarIndicatorVO,
    ) {
        super();
    }

    public static fromParams(
        dashboard_id: number,
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        columns: TableColumnDescVO[] = null,
        fields: { [datatable_field_uid: string]: DatatableField<any, any> } = null,
        varcolumn_conf: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = null,
        active_field_filters: FieldFiltersVO = null,
        custom_filters: FieldFiltersVO = null,
        active_api_type_ids: string[] = null,
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = null,
        is_secured: boolean = false,
        file_access_policy_name: string = null,
        target_user_id: number = null,
        do_not_use_filter_by_datatable_field_uid: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = null,
        export_active_field_filters?: boolean,
        export_vars_indicator?: boolean,
        send_email_with_export_notification?: boolean,
        // vars_indicator?: ExportVarIndicatorVO[],
        vars_indicator?: ExportVarIndicatorVO,
    ): ExportContextQueryToXLSXParamVO {

        return new ExportContextQueryToXLSXParamVO(
            dashboard_id,
            filename, context_query, ordered_column_list, column_labels, exportable_datatable_custom_field_columns, columns, fields, varcolumn_conf,
            active_field_filters, custom_filters, active_api_type_ids, discarded_field_paths, is_secured, file_access_policy_name, target_user_id,
            do_not_use_filter_by_datatable_field_uid, export_active_field_filters, export_vars_indicator, send_email_with_export_notification, vars_indicator);
    }

    public static getAPIParams(param: ExportContextQueryToXLSXParamVO): any[] {
        return [
            param.dashboard_id,
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
            param.do_not_use_filter_by_datatable_field_uid,
            param.export_active_field_filters,
            param.export_vars_indicator,
            param.send_email_with_export_notification,
            param.vars_indicator,
        ];
    }

    public from(props: Partial<ExportContextQueryToXLSXParamVO>): this {
        super.from(props);

        this.context_query = Object.assign(new ContextQueryVO(), props.context_query) ?? this.context_query;
        this.columns = props.columns?.map((c) => Object.assign(new TableColumnDescVO(), c)) ?? this.columns;

        return this;
    }
}

export const ExportContextQueryToXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportContextQueryToXLSXParamVO> = ExportContextQueryToXLSXParamVO;
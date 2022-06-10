import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';
import ContextQueryVO from '../../../ContextFilter/vos/ContextQueryVO';

export default class ExportContextQueryToXLSXParamVO implements IAPIParamTranslator<ExportContextQueryToXLSXParamVO> {

    public static fromParams(
        filename: string,
        context_query: ContextQueryVO,
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): ExportContextQueryToXLSXParamVO {

        return new ExportContextQueryToXLSXParamVO(filename, context_query, ordered_column_list, column_labels, exportable_datatable_custom_field_columns, is_secured, file_access_policy_name);
    }

    public static getAPIParams(param: ExportContextQueryToXLSXParamVO): any[] {
        return [
            param.filename,
            param.context_query,
            param.ordered_column_list,
            param.column_labels,
            param.exportable_datatable_custom_field_columns,
            param.is_secured,
            param.file_access_policy_name
        ];
    }

    public constructor(
        public filename: string,
        public context_query: ContextQueryVO,
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string },
        public exportable_datatable_custom_field_columns: { [datatable_field_uid: string]: string } = null,
        public is_secured: boolean = false,
        public file_access_policy_name: string = null
    ) { }
}

export const ExportContextQueryToXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportContextQueryToXLSXParamVO> = ExportContextQueryToXLSXParamVO;
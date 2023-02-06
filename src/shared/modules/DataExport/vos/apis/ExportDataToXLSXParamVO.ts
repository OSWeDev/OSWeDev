import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';
import IExportableDatas from '../../interfaces/IExportableDatas';

export default class ExportDataToXLSXParamVO implements IExportableDatas, IAPIParamTranslator<ExportDataToXLSXParamVO> {

    public static fromParams(
        filename: string,
        datas: any[],
        ordered_column_list: string[],
        column_labels: { [field_name: string]: string },
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): ExportDataToXLSXParamVO {

        return new ExportDataToXLSXParamVO(filename, datas, ordered_column_list, column_labels, api_type_id, is_secured, file_access_policy_name);
    }

    public static getAPIParams(param: ExportDataToXLSXParamVO): any[] {
        return [
            param.filename,
            param.datas,
            param.ordered_column_list,
            param.column_labels,
            param.api_type_id,
            param.is_secured,
            param.file_access_policy_name
        ];
    }

    public constructor(
        public filename: string,
        public datas: any[],
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string },
        public api_type_id: string,
        public is_secured: boolean = false,
        public file_access_policy_name: string = null
    ) { }
}

export const ExportDataToXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportDataToXLSXParamVO> = ExportDataToXLSXParamVO;
import IExportableDatas from '../../../../../server/modules/DataExport/interfaces/IExportableDatas';
import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';

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

    public constructor(
        public filename: string,
        public datas: any[],
        public ordered_column_list: string[],
        public column_labels: { [field_name: string]: string },
        public api_type_id: string,
        public is_secured: boolean = false,
        public file_access_policy_name: string = null
    ) { }

    public getAPIParams(): any[] {
        return [
            this.filename,
            this.datas,
            this.ordered_column_list,
            this.column_labels,
            this.api_type_id,
            this.is_secured,
            this.file_access_policy_name
        ];
    }
}

export const ExportDataToXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportDataToXLSXParamVO> = ExportDataToXLSXParamVO;
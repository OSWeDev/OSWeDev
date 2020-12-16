import IExportableMultiSheetsDatas from '../../../../../server/modules/DataExport/interfaces/IExportableMultiSheetsDatas';
import IExportableSheet from '../../../../../server/modules/DataExport/interfaces/IExportableSheet';
import IAPIParamTranslator from '../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../API/interfaces/IAPIParamTranslatorStatic';

export default class ExportDataToMultiSheetsXLSXParamVO implements IExportableMultiSheetsDatas, IAPIParamTranslator<ExportDataToMultiSheetsXLSXParamVO> {

    public static fromParams(
        filename: string,
        sheets: IExportableSheet[],
        api_type_id: string,
        is_secured: boolean = false,
        file_access_policy_name: string = null
    ): ExportDataToMultiSheetsXLSXParamVO {

        return new ExportDataToMultiSheetsXLSXParamVO(filename, sheets, api_type_id, is_secured, file_access_policy_name);
    }

    public constructor(
        public filename: string,
        public sheets: IExportableSheet[],
        public api_type_id: string,
        public is_secured: boolean = false,
        public file_access_policy_name: string = null
    ) { }

    public getAPIParams(): any[] {
        return [
            this.filename,
            this.sheets,
            this.api_type_id,
            this.is_secured,
            this.file_access_policy_name
        ];
    }
}

export const ExportDataToMultiSheetsXLSXParamVOStatic: IAPIParamTranslatorStatic<ExportDataToMultiSheetsXLSXParamVO> = ExportDataToMultiSheetsXLSXParamVO;
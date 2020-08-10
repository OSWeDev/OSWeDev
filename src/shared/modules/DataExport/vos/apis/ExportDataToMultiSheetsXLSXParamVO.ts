import IExportableMultiSheetsDatas from '../../../../../server/modules/DataExport/interfaces/IExportableMultiSheetsDatas';
import IExportableSheet from '../../../../../server/modules/DataExport/interfaces/IExportableSheet';

export default class ExportDataToMultiSheetsXLSXParamVO implements IExportableMultiSheetsDatas {

    public constructor(
        public filename: string,
        public sheets: IExportableSheet[],
        public api_type_id: string,
        public is_secured: boolean = false,
        public file_access_policy_name: string = null
    ) { }
}
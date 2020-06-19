import IExportableDatas from '../../../../../server/modules/DataExport/interfaces/IExportableDatas';

export default class ExportDataToXLSXParamVO implements IExportableDatas {

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
import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class DataImportColumnVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_data_import_column";

    public static TYPE_STRING: string = "string";
    public static TYPE_DATE: string = "date";
    public static TYPE_NUMBER: string = "number";

    public id: number;
    public _type: string = DataImportColumnVO.API_TYPE_ID;

    public constructor(
        public column_index: number,
        public name: string,
        public data_import_file_id: number,
        public type: string = DataImportColumnVO.TYPE_STRING
    ) { }
}
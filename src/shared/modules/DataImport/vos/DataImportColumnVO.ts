import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportColumnVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_column";

    public static TYPE_STRING: string = "string";
    public static TYPE_DATE: string = "date";
    public static TYPE_NUMBER: string = "number";

    public id: number;
    public _type: string = DataImportColumnVO.API_TYPE_ID;

    /**
     * 
     * @param column_index 0 indexed
     * @param title The title as found in the imported file
     * @param vo_field_name The corresponding field_name in the corresponding vo
     * @param data_import_format_id The format this column appears in
     * @param type The column type in the file (in case of data conversions between file and DB)
     */
    public constructor(
        public column_index: number,
        public title: string,
        public data_import_format_id: number,
        public type: string = DataImportColumnVO.TYPE_STRING,
        public vo_field_name: string = null
    ) {
        this.vo_field_name = title;
    }
}
import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportColumnVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_column";

    public static TYPE_STRING: string = "string";
    public static TYPE_DATE: string = "date";
    public static TYPE_NUMBER: string = "number";

    public id: number;
    public _type: string = DataImportColumnVO.API_TYPE_ID;

    // 0 indexed
    public column_index: number;

    // The title as found in the imported file
    public title: string;

    // The corresponding field_name in the corresponding vo
    public vo_field_name: string;

    // The format this column appears in
    public data_import_file_id: number;

    // Le type de la colonne dans le fichier (pour des cas de conversion entre data en base et data à importer)
    public type: string;
}
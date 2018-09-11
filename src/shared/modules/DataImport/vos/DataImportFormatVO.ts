import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportFormatVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_import_file";

    public static TYPE_LABELS: string[] = ['import.file_types.XLS.name', 'import.file_types.XLSX.name', 'import.file_types.CSV.name'];
    public static TYPE_XLS: number = 0;
    public static TYPE_XLSX: number = 1;
    public static TYPE_CSV: number = 2;

    public id: number;
    public _type: string = DataImportFormatVO.API_TYPE_ID;

    public import_uid: string;
    public type: number;

    /** sheet_name ou sheet_index au choix, avec une priorité sur le sheet_name si il est rempli */
    public sheet_name: string;
    /** 0 indexed */
    public sheet_index: number;

    /** 0 indexed */
    public first_row_index: number;

    // Fichier type de ce format d'import pour exemple
    public file_id: number;

    public api_type_id: string;

    public post_exec_module_id: number;

    public copy_folder: string;
}
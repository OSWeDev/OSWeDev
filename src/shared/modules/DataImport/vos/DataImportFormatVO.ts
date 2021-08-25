import IDistantVOBase from '../../IDistantVOBase';

export default class DataImportFormatVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dif";

    public static TYPE_LABELS: string[] = ['import.file_types.XLS.name', 'import.file_types.XLSX.name', 'import.file_types.CSV.name'];
    public static TYPE_XLS: number = 0;
    public static TYPE_XLSX: number = 1;
    public static TYPE_CSV: number = 2;

    public static TYPE_ENCODING_LABELS: string[] = ['import.encoding.utf8.name', 'import.encoding.windows1252.name'];
    public static TYPE_UTF8: number = 0;
    public static TYPE_WINDOWS1252: number = 1;

    public static TYPE_COLUMN_POSITION_LABELS: string[] = ['import.column_position.label.name', 'import.column_position.index.name'];
    public static TYPE_COLUMN_POSITION_LABEL: number = 0;
    public static TYPE_COLUMN_POSITION_INDEX: number = 1;

    public static TYPE_SHEET_POSITION_LABELS: string[] = ['import.sheet_position.label.name', 'import.sheet_position.index.name', 'import.sheet_position.scan.name'];
    public static TYPE_SHEET_POSITION_LABEL: number = 0;
    public static TYPE_SHEET_POSITION_INDEX: number = 1;
    public static TYPE_SHEET_POSITION_SCAN: number = 2;

    public id: number;
    public _type: string = DataImportFormatVO.API_TYPE_ID;

    public import_uid: string;
    public type: number;
    public encoding: number;

    public type_sheet_position: number;

    public type_column_position: number;
    /** 0 indexed - LABELS */
    public column_labels_row_index: number;

    /** sheet_name ou sheet_index au choix, avec une priorité sur le sheet_name si il est rempli */
    public sheet_name: string;
    /** 0 indexed */
    public sheet_index: number;

    /** 0 indexed - DATAS */
    public first_row_index: number;

    // Fichier type de ce format d'import pour exemple
    public file_id: number;

    public api_type_id: string;

    public post_exec_module_id: number;

    public copy_folder: string;

    /**
     * Réaliser des imports en plusieurs petits bouts quand c'est possible
     */
    public batch_import: boolean;

    /**
     * Taille idéale d'une segmentation pour cet import (ni trop petit pour les perfs, ni trop grand pour la survie et disponibilité du serveur)
     */
    public batch_size: number;
}
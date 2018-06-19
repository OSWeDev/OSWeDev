import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class DataImportFileVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_data_import_file";

    public static TYPE_XLS: string = "XLS";
    public static TYPE_XLSX: string = "XLSX";
    public static TYPE_CSV: string = "CSV";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: DataImportFileVO): DataImportFileVO {
        if (!e) {
            return null;
        }

        e.first_row_index = ConversionHandler.forceNumber(e.first_row_index);
        e.sheet_index = ConversionHandler.forceNumber(e.sheet_index);
        e.id = ConversionHandler.forceNumber(e.id);

        e._type = DataImportFileVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: DataImportFileVO[]): DataImportFileVO[] {
        for (let i in es) {
            es[i] = DataImportFileVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = DataImportFileVO.API_TYPE_ID;
    public import_name: string;
    public type: string;

    /** sheet_name ou sheet_index au choix, avec une priorité sur le sheet_name si il est rempli */
    public sheet_name: string;
    /** 0 indexed */
    public sheet_index: number;

    /** 0 indexed */
    public first_row_index: number;
    public copy_folder: string;
    public datatable_fullname: string;

    public post_traitement_module: string;
}
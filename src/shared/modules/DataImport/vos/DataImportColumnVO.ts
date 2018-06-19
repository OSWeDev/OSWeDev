import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class DataImportColumnVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "module_data_import_column";

    public static TYPE_STRING: string = "string";
    public static TYPE_DATE: string = "date";
    public static TYPE_NUMBER: string = "number";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: DataImportColumnVO): DataImportColumnVO {
        if (!e) {
            return null;
        }

        e.column_index = ConversionHandler.forceNumber(e.column_index);
        e.id = ConversionHandler.forceNumber(e.id);
        e.data_import_file_id = ConversionHandler.forceNumber(e.data_import_file_id);

        e._type = DataImportColumnVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: DataImportColumnVO[]): DataImportColumnVO[] {
        for (let i in es) {
            es[i] = DataImportColumnVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = DataImportColumnVO.API_TYPE_ID;

    public constructor(
        public column_index: number,
        public name: string,
        public data_import_file_id: number,
        public type: string = DataImportColumnVO.TYPE_STRING
    ) { }
}
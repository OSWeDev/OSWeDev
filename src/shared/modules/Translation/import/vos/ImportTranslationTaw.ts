import ImportTranslation from './ImportTranslation';
import IImportedData from '../../../DataImport/interfaces/IImportedData';

export default class ImportTranslationRaw extends ImportTranslation implements IImportedData {
    public importation_state: number;
    public not_validated_msg: string;
    public not_imported_msg: string;
    public not_posttreated_msg: string;
    public creation_date: string;
    public target_vo_id: number;
    public historic_id: number;
    public imported_line_number: number;
}
import DataImportHistoricVO from '../vos/DataImportHistoricVO';
import IImportData from './IImportData';
import IImportOptions from './IImportOptions';

export default interface IPostTraitementModule {
    hook_merge_imported_datas_in_database(datas: IImportData[], import_target_date_index: string, historic: DataImportHistoricVO, options: IImportOptions): Promise<boolean>;
}
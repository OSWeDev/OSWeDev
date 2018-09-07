import DataImportHistoricVO from '../vos/DataImportHistoricVO';
import IImportedData from './IImportedData';

export default interface IPostTraitementModule {
    hook_merge_imported_datas_in_database(datas: IImportedData[], historic: DataImportHistoricVO): Promise<boolean>;
}
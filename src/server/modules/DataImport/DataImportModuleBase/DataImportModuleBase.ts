import IPostTraitementModule from '../../../../shared/modules/DataImport/interfaces/IPostTraitementModule';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import IImportData from '../../../../shared/modules/DataImport/interfaces/IImportData';
import IImportOptions from '../../../../shared/modules/DataImport/interfaces/IImportOptions';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';

export default abstract class DataImportModuleBase implements IPostTraitementModule, IModuleBase {

    public static DataImportRoleName: string = "DataImportRoleName";

    protected constructor(public name: string) {

        this.name = name;
        ModulesManager.getInstance().registerModule(DataImportModuleBase.DataImportRoleName, this);
    }

    public registerApis() { }
    public initialize() { }

    public abstract hook_merge_imported_datas_in_database(datas: IImportData[], import_target_date_index: string, historic: DataImportHistoricVO, options: IImportOptions): Promise<boolean>;
    public abstract async hook_configure_import();
}
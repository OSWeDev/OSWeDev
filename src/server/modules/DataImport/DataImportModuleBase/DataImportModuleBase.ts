import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import IPostTraitementModule from '../../../../shared/modules/DataImport/interfaces/IPostTraitementModule';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ModuleServerBase from '../../ModuleServerBase';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';

export default abstract class DataImportModuleBase<ImportedData extends IImportedData> extends ModuleServerBase implements IPostTraitementModule, IModuleBase {

    public static DataImportRoleName: string = "DataImportRoleName";

    public hook_get_batch_mode_batch_datas: (raw_api_type_id: string, importHistoric: DataImportHistoricVO, format: DataImportFormatVO, offset: number, batch_size: number, importation_state: number) => Promise<IImportedData[]> = null;

    protected constructor(public name: string) {
        super(name);
        this.name = name;
        ModulesManager.getInstance().registerModule(DataImportModuleBase.DataImportRoleName, this);
    }

    public registerApis() { }
    public initialize() { }

    public abstract hook_merge_imported_datas_in_database(datas: ImportedData[], historic: DataImportHistoricVO): Promise<boolean>;

    // Méthode qui doit renvoyer la liste des api_types_ids qui sont concernés par ce post-traitement d'import.
    //  Permet d'informer immédiatement d'un changement de données au niveau client
    public abstract get_merged_api_type_ids(): string[];

    // Par défaut, pas de filtrage complémentaire
    public async validate_formatted_data(datas: ImportedData[], historic: DataImportHistoricVO, format: DataImportFormatVO): Promise<ImportedData[]> {
        return datas;
    }
}
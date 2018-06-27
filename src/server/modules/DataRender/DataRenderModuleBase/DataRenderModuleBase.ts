import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import IPostTraitementModule from '../../../../shared/modules/DataImport/interfaces/IPostTraitementModule';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import IImportData from '../../../../shared/modules/DataImport/interfaces/IImportData';
import IImportOptions from '../../../../shared/modules/DataImport/interfaces/IImportOptions';
import IRenderDataModule from '../../../../shared/modules/DataRender/interfaces/IRenderDataModule';
import IRenderedData from '../../../../shared/modules/DataRender/interfaces/IRenderedData';
import DataRenderingLogVO from '../../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import IRenderOptions from '../../../../shared/modules/DataRender/interfaces/IRenderOptions';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleServerBase from '../../ModuleServerBase';

export default abstract class DataRenderModuleBase extends ModuleServerBase implements IRenderDataModule, IModuleBase {

    public static ROLE_NAME: string = "DataRenderRoleName";

    protected constructor(public name: string) {
        super();
        this.name = name;
        ModulesManager.getInstance().registerModule(DataRenderModuleBase.ROLE_NAME, this);
    }

    public registerApis() { }
    public initialize() { }

    public abstract async hook_render_managed_data_in_database(timeSegments: TimeSegment[], log: DataRenderingLogVO, options: IRenderOptions): Promise<boolean>;
    public abstract async hook_configure_renderer();
}
import IRenderDataModule from '../../../../shared/modules/DataRender/interfaces/IRenderDataModule';
import IRenderedData from '../../../../shared/modules/DataRender/interfaces/IRenderedData';
import IRenderOptions from '../../../../shared/modules/DataRender/interfaces/IRenderOptions';
import DataRenderingLogVO from '../../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ModuleServerBase from '../../ModuleServerBase';

export default abstract class DataRenderModuleBase extends ModuleServerBase implements IRenderDataModule, IModuleBase {

    public static ROLE_NAME: string = "DataRenderRoleName";

    protected constructor(public name: string) {
        super(name);
        ModulesManager.getInstance().registerModule(DataRenderModuleBase.ROLE_NAME, this);
    }

    public registerApis() { }
    public initialize() { }

    public abstract async hook_render_managed_data_in_database(timeSegments: TimeSegment[], log: DataRenderingLogVO, options: IRenderOptions): Promise<boolean>;
    public abstract async hook_configure_renderer();

    abstract database: ModuleTable<IDistantVOBase & IRenderedData>;
    abstract data_timesegment_type: string;
}
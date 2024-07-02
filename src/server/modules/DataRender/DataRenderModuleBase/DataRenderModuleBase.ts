import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import IRenderDataModule from '../../../../shared/modules/DataRender/interfaces/IRenderDataModule';
import IRenderOptions from '../../../../shared/modules/DataRender/interfaces/IRenderOptions';
import DataRenderingLogVO from '../../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IModuleBase from '../../../../shared/modules/IModuleBase';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ModuleServerBase from '../../ModuleServerBase';

export default abstract class DataRenderModuleBase extends ModuleServerBase implements IRenderDataModule, IModuleBase {

    public static ROLE_NAME: string = "DataRenderRoleName";

    public abstract database: ModuleTableVO;
    public abstract data_timesegment_type: number;

    protected constructor(public name: string) {
        super(name);
        ModulesManager.getInstance().registerModule(DataRenderModuleBase.ROLE_NAME, this);
    }

    public registerApis() { }
    public initialize() { }

    public abstract hook_render_managed_data_in_database(timeSegments: TimeSegment[], log: DataRenderingLogVO, options: IRenderOptions): Promise<boolean>;
    public abstract hook_configure_renderer();
}
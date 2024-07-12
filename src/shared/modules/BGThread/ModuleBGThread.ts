import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import BGThreadVO from './vos/BGThreadVO';

export default class ModuleBGThread extends Module {

    public static MODULE_NAME: string = "BGThread";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleBGThread.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleBGThread.MODULE_NAME + ".BO_ACCESS";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleBGThread {
        if (!ModuleBGThread.instance) {
            ModuleBGThread.instance = new ModuleBGThread();
        }
        return ModuleBGThread.instance;
    }

    private static instance: ModuleBGThread = null;

    private constructor() {

        super("bgthread", ModuleBGThread.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        const label_field = ModuleTableFieldController.create_new(BGThreadVO.API_TYPE_ID, field_names<BGThreadVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(BGThreadVO.API_TYPE_ID, field_names<BGThreadVO>().last_up_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Dernière exécution', false).set_segmentation_type(TimeSegment.TYPE_SECOND)
        ];

        ModuleTableController.create_new(this.name, BGThreadVO, label_field, "BGThreads");
    }
}
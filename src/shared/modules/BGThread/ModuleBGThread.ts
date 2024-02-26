import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
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
        let label_field = ModuleTableFieldController.create_new(BGThreadVO.API_TYPE_ID, field_names<BGThreadVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(BGThreadVO.API_TYPE_ID, field_names<BGThreadVO>().last_up_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Dernière exécution', false).set_segmentation_type(TimeSegment.TYPE_SECOND)
        ];

        this.datatables.push(new ModuleTableVO(this, BGThreadVO.API_TYPE_ID, () => new BGThreadVO(), datatable_fields, label_field, "BGThreads"));
    }
}
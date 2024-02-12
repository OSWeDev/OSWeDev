import AccessPolicyTools from '../../tools/AccessPolicyTools';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
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
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('last_up_date', ModuleTableField.FIELD_TYPE_tstz, 'Dernière exécution', false).set_segmentation_type(TimeSegment.TYPE_SECOND)
        ];

        this.datatables.push(new ModuleTable(this, BGThreadVO.API_TYPE_ID, () => new BGThreadVO(), datatable_fields, label_field, "BGThreads"));
    }
}
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';

export default class ModuleSupervision extends Module {

    public static MODULE_NAME: string = "Supervision";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSupervision.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSupervision.MODULE_NAME + ".BO_ACCESS";

    public static getInstance(): ModuleSupervision {
        if (!ModuleSupervision.instance) {
            ModuleSupervision.instance = new ModuleSupervision();
        }
        return ModuleSupervision.instance;
    }

    private static instance: ModuleSupervision = null;

    private constructor() {

        super("supervision", ModuleSupervision.MODULE_NAME);
    }
}
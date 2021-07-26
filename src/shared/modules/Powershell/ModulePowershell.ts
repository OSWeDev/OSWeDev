import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';

export default class ModulePowershell extends Module {

    public static MODULE_NAME: string = 'Powershell';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModulePowershell.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModulePowershell.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModulePowershell.MODULE_NAME + '.FO_ACCESS';

    public static getInstance(): ModulePowershell {
        if (!ModulePowershell.instance) {
            ModulePowershell.instance = new ModulePowershell();
        }
        return ModulePowershell.instance;
    }

    private static instance: ModulePowershell = null;

    private constructor() {

        super("powershell", ModulePowershell.MODULE_NAME);
    }

    public registerApis() {
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}
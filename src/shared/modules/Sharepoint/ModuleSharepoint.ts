import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';

export default class ModuleSharepoint extends Module {

    public static MODULE_NAME: string = 'Sharepoint';

    public static PARAM_NAME_clientId: string = 'ModuleSharepoint.clientId';
    public static PARAM_NAME_clientSecret: string = 'ModuleSharepoint.clientSecret';
    public static PARAM_NAME_realm: string = 'ModuleSharepoint.realm';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSharepoint.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSharepoint.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSharepoint.MODULE_NAME + '.FO_ACCESS';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleSharepoint {
        if (!ModuleSharepoint.instance) {
            ModuleSharepoint.instance = new ModuleSharepoint();
        }
        return ModuleSharepoint.instance;
    }

    private static instance: ModuleSharepoint = null;

    private constructor() {

        super("sharepoint", ModuleSharepoint.MODULE_NAME);
    }

    public registerApis() {
    }

    public initialize() {
    }
}
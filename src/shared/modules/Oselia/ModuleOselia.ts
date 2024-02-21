import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';

export default class ModuleOselia extends Module {

    public static MODULE_NAME: string = 'Oselia';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleOselia.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.BO_ACCESS';

    /**
     * Droit d'accès aux discussions sur le front
     */
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_MESSAGE_FEEDBACK_ACCESS';
    public static POLICY_THREAD_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_FEEDBACK_ACCESS';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleOselia {
        if (!ModuleOselia.instance) {
            ModuleOselia.instance = new ModuleOselia();
        }
        return ModuleOselia.instance;
    }

    private static instance: ModuleOselia = null;

    private constructor() {

        super("oselia", ModuleOselia.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        // Les tables sont déclarées dans le module GPT pour des raisons d'inter-dépendance
    }
}
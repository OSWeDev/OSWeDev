import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';


export default class ModuleURL extends Module {

    public static MODULE_NAME: string = 'Url';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleURL.MODULE_NAME;

    private static instance: ModuleURL = null;

    private constructor() {

        super("url", ModuleURL.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleURL {
        if (!ModuleURL.instance) {
            ModuleURL.instance = new ModuleURL();
        }
        return ModuleURL.instance;
    }

    public initialize() {

        this.initialize_URLAliasVO();
        this.initialize_URLAliasCRUDConfVO();
    }

    private initialize_URLAliasVO() {
        l'alias est unique, l'initial osef
        TODO
    }

    private initialize_URLAliasCRUDConfVO() {
        TODO
    }
}
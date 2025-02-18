import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';

export default class ModulePerfReport extends Module {

    public static MODULE_NAME: string = "PerfReport";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModulePerfReport.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModulePerfReport.MODULE_NAME + ".POLICY_FO_ACCESS";

    private static instance: ModulePerfReport = null;

    private constructor() {

        super("perfreport", ModulePerfReport.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePerfReport {
        if (!ModulePerfReport.instance) {
            ModulePerfReport.instance = new ModulePerfReport();
        }
        return ModulePerfReport.instance;
    }


    public initialize(): void {
    }
}
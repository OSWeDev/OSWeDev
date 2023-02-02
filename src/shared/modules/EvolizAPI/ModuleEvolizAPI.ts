import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';

export default class ModuleEvolizAPI extends Module {

    public static EvolizAPI_PublicKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_PublicKey_API';
    public static EvolizAPI_SecretKey_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_SecretKey_API';
    public static EvolizAPI_AccessToken_API_PARAM_NAME: string = 'EvolizAPI.EvolizAPI_AccessToken_API';

    public static EvolizAPI_BaseURL: string = 'https://www.evoliz.io/';

    public static MODULE_NAME: string = 'EvolizAPI';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleEvolizAPI.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleEvolizAPI.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleEvolizAPI.MODULE_NAME + '.FO_ACCESS';

    public static getInstance(): ModuleEvolizAPI {
        if (!ModuleEvolizAPI.instance) {
            ModuleEvolizAPI.instance = new ModuleEvolizAPI();
        }
        return ModuleEvolizAPI.instance;
    }

    private static instance: ModuleEvolizAPI = null;

    private constructor() {

        super("evolizapi", ModuleEvolizAPI.MODULE_NAME);
    }

    public registerApis() {
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

}
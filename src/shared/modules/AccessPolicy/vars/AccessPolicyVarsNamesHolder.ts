
export default class AccessPolicyVarsNamesHolder {

    public static VarMinLoginCountController_VAR_NAME: string = 'VarMinLoginCountController';
    public static VarMinCSRFCountController_VAR_NAME: string = 'VarMinCSRFCountController';
    public static VarMinLogoutCountController_VAR_NAME: string = 'VarMinLogoutCountController';

    public static VarLastCSRFTSController_VAR_NAME: string = 'VarLastCSRFTSController';

    public static getInstance(): AccessPolicyVarsNamesHolder {
        if (!AccessPolicyVarsNamesHolder.instance) {
            AccessPolicyVarsNamesHolder.instance = new AccessPolicyVarsNamesHolder();
        }
        return AccessPolicyVarsNamesHolder.instance;
    }

    private static instance: AccessPolicyVarsNamesHolder = null;

    private constructor() { }
}
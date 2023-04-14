
export default class AccessPolicyVarsNamesHolder {

    public static VarDayXXXController_VAR_NAME: string = 'VarDayXXXController';

    public static getInstance(): AccessPolicyVarsNamesHolder {
        if (!AccessPolicyVarsNamesHolder.instance) {
            AccessPolicyVarsNamesHolder.instance = new AccessPolicyVarsNamesHolder();
        }
        return AccessPolicyVarsNamesHolder.instance;
    }

    private static instance: AccessPolicyVarsNamesHolder = null;

    private constructor() { }
}
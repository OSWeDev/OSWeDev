
export default class UserLogVarsNamesHolder {

    public static VarMinLoginCountController_VAR_NAME: string = 'VarMinLoginCountController';
    public static VarMinCSRFCountController_VAR_NAME: string = 'VarMinCSRFCountController';
    public static VarMinLogoutCountController_VAR_NAME: string = 'VarMinLogoutCountController';

    public static VarMonthCompareCSRFCountMAndMm2Controller_VAR_NAME: string = 'VarMonthCompareCSRFCountMAndMm2Controller';

    public static VarLastCSRFTSController_VAR_NAME: string = 'VarLastCSRFTSController';

    public static getInstance(): UserLogVarsNamesHolder {
        if (!UserLogVarsNamesHolder.instance) {
            UserLogVarsNamesHolder.instance = new UserLogVarsNamesHolder();
        }
        return UserLogVarsNamesHolder.instance;
    }

    private static instance: UserLogVarsNamesHolder = null;

    private constructor() { }
}
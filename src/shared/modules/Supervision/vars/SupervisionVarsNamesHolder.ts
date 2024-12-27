
export default class SupervisionVarsNamesHolder {

    public static VarNbSupervisedItemByProbeStateController_VAR_NAME: string = 'VarNbSupervisedItemByProbeStateController';

    private static instance: SupervisionVarsNamesHolder = null;

    private constructor() { }

    public static getInstance(): SupervisionVarsNamesHolder {
        if (!SupervisionVarsNamesHolder.instance) {
            SupervisionVarsNamesHolder.instance = new SupervisionVarsNamesHolder();
        }
        return SupervisionVarsNamesHolder.instance;
    }
}
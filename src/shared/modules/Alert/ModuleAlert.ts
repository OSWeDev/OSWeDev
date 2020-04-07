import Module from '../Module';

export default class ModuleAlert extends Module {

    public static MODULE_NAME: string = "Alert";

    public static getInstance(): ModuleAlert {
        if (!ModuleAlert.instance) {
            ModuleAlert.instance = new ModuleAlert();
        }
        return ModuleAlert.instance;
    }

    private static instance: ModuleAlert = null;

    private constructor() {

        super("alert", ModuleAlert.MODULE_NAME);
        this.forceActivationOnInstallation();
    }
}
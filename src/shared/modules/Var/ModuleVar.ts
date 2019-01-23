import Module from '../Module';

export default class ModuleVar extends Module {

    public static MODULE_NAME: string = 'Var';

    public static getInstance(): ModuleVar {
        if (!ModuleVar.instance) {
            ModuleVar.instance = new ModuleVar();
        }
        return ModuleVar.instance;
    }

    private static instance: ModuleVar = null;

    private constructor() {

        super("var", ModuleVar.MODULE_NAME);
        this.forceActivationOnInstallation();
    }
}
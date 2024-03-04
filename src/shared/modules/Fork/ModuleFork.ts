import Module from '../Module';

export default class ModuleFork extends Module {

    public static MODULE_NAME: string = "Fork";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleFork {
        if (!ModuleFork.instance) {
            ModuleFork.instance = new ModuleFork();
        }
        return ModuleFork.instance;
    }

    private static instance: ModuleFork = null;

    private constructor() {

        super("fork", ModuleFork.MODULE_NAME);
        this.forceActivationOnInstallation();
    }
}
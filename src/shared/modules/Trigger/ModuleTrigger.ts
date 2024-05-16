import Module from '../Module';

export default class ModuleTrigger extends Module {

    public static MODULE_NAME: string = 'Trigger';

    private static instance: ModuleTrigger = null;

    private constructor() {

        super("trigger", ModuleTrigger.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTrigger {
        if (!ModuleTrigger.instance) {
            ModuleTrigger.instance = new ModuleTrigger();
        }
        return ModuleTrigger.instance;
    }

    public initialize() {
    }
}
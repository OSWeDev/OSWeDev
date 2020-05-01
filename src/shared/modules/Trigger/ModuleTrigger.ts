import Module from '../Module';
import TriggerHook from './TriggerHook';

export default class ModuleTrigger extends Module {

    public static MODULE_NAME: string = 'Trigger';

    public static getInstance(): ModuleTrigger {
        if (!ModuleTrigger.instance) {
            ModuleTrigger.instance = new ModuleTrigger();
        }
        return ModuleTrigger.instance;
    }

    private static instance: ModuleTrigger = null;

    /**
     * Local thread cache -----
     */
    private triggerHooks: { [trigger_type_UID: string]: TriggerHook<any, any, any> } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() {

        super("trigger", ModuleTrigger.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerTriggerHook(hook: TriggerHook<any, any, any>) {
        this.triggerHooks[hook.trigger_type_UID] = hook;
    }

    public getTriggerHook(trigger_type_UID: string) {
        return this.triggerHooks[trigger_type_UID];
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}
import Module from '../Module';
import TriggerHook from './TriggerHook';

export default class ModuleTrigger extends Module {

    public static getInstance(): ModuleTrigger {
        if (!ModuleTrigger.instance) {
            ModuleTrigger.instance = new ModuleTrigger();
        }
        return ModuleTrigger.instance;
    }

    private static instance: ModuleTrigger = null;

    private triggerHooks: { [trigger_type_UID: string]: TriggerHook<any, any, any> } = {};

    private constructor() {

        super("trigger", "TRIGGER");
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
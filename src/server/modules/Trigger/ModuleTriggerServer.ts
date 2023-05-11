import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ModuleServerBase from '../ModuleServerBase';
import TriggerHook from './TriggerHook';

export default class ModuleTriggerServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleTriggerServer.instance) {
            ModuleTriggerServer.instance = new ModuleTriggerServer();
        }
        return ModuleTriggerServer.instance;
    }

    private static instance: ModuleTriggerServer = null;

    /**
     * Local thread cache -----
     */
    private triggerHooks: { [trigger_type_UID: string]: TriggerHook<any, any, any> } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() {
        super(ModuleTrigger.getInstance().name);
    }

    public async configure() {
    }

    public registerTriggerHook(hook: TriggerHook<any, any, any>) {
        this.triggerHooks[hook.trigger_type_UID] = hook;
    }

    public getTriggerHook(trigger_type_UID: string) {
        return this.triggerHooks[trigger_type_UID];
    }
}
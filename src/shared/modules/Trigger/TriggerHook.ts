export default abstract class TriggerHook<Conditions, Params, Out> {

    public static NO_CONDITION_UID: string = "___NOCONDITION";

    /**
     * Local thread cache -----
     */
    protected registered_handlers: { [conditionUID: string]: [(params: Params) => Promise<Out>] } = {};
    /**
     * ----- Local thread cache
     */

    constructor(public trigger_type_UID: string) {
    }

    public abstract getConditionUID_from_Conditions(conditions: Conditions): string;

    public registerHandler(conditions: Conditions, handler: (params: Params) => Promise<Out>) {
        let conditionUID: string = conditions ? this.getConditionUID_from_Conditions(conditions) : TriggerHook.NO_CONDITION_UID;

        if (!this.registered_handlers[conditionUID]) {
            this.registered_handlers[conditionUID] = [] as any;
        }

        this.registered_handlers[conditionUID].push(handler);
    }

    public async trigger(conditions: Conditions, params: Params): Promise<Out[]> {
        let noconditionHandlers: [(params: Params) => Promise<Out>] = this.registered_handlers[TriggerHook.NO_CONDITION_UID];
        let conditionUID: string = this.getConditionUID_from_Conditions(conditions);
        let conditionalHandlers: [(params: Params) => Promise<Out>] = conditionUID ? this.registered_handlers[conditionUID] : null;

        let res: Out[] = [];

        if (noconditionHandlers && (noconditionHandlers.length > 0)) {

            for (let i in noconditionHandlers) {
                let noconditionHandler = noconditionHandlers[i];
                res.push(await noconditionHandler(params));
            }
        }
        if (conditionalHandlers && (conditionalHandlers.length > 0)) {

            for (let i in conditionalHandlers) {
                let conditionalHandler = conditionalHandlers[i];
                res.push(await conditionalHandler(params));
            }
        }

        return res;
    }
}
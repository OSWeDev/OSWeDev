import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../../shared/modules/Stats/StatsController";

export default abstract class TriggerHook<Conditions, Params, Out> {

    public static NO_CONDITION_UID: string = "___NOCONDITION";

    /**
     * Local thread cache -----
     */
    protected registered_handlers: { [conditionUID: string]: [(params: Params, exec_as_server?: boolean) => Promise<Out>] } = {};
    /**
     * ----- Local thread cache
     */

    constructor(public trigger_type_UID: string) {
    }

    public has_trigger(conditions: Conditions): boolean {
        const conditionUID: string = this.getConditionUID_from_Conditions(conditions);

        return !!(conditionUID ? this.registered_handlers[conditionUID] : null);
    }

    public abstract getConditionUID_from_Conditions(conditions: Conditions): string;

    public registerHandler(conditions: Conditions, handler_bind_this: any, handler: (params: Params, exec_as_server?: boolean) => Promise<Out> | Out) {
        const conditionUID: string = conditions ? this.getConditionUID_from_Conditions(conditions) : TriggerHook.NO_CONDITION_UID;

        if (!this.registered_handlers[conditionUID]) {
            this.registered_handlers[conditionUID] = [] as any;
        }

        this.registered_handlers[conditionUID].push(handler.bind(handler_bind_this));
    }

    public async trigger(conditions: Conditions, params: Params, exec_as_server: boolean = false): Promise<Out[]> {
        const noconditionHandlers: [(params: Params, exec_as_server?: boolean) => Promise<Out>] = this.registered_handlers[TriggerHook.NO_CONDITION_UID];
        const conditionUID: string = this.getConditionUID_from_Conditions(conditions);
        const conditionalHandlers: [(params: Params, exec_as_server?: boolean) => Promise<Out>] = conditionUID ? this.registered_handlers[conditionUID] : null;

        const time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('TriggerHook', this.trigger_type_UID, conditionUID);

        const res: Out[] = [];

        if (noconditionHandlers && (noconditionHandlers.length > 0)) {

            for (const i in noconditionHandlers) {
                const noconditionHandler = noconditionHandlers[i];
                res.push(await noconditionHandler(params, exec_as_server));
            }
        }
        if (conditionalHandlers && (conditionalHandlers.length > 0)) {

            for (const i in conditionalHandlers) {
                const conditionalHandler = conditionalHandlers[i];
                res.push(await conditionalHandler(params, exec_as_server));
            }
        }

        const time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('TriggerHook', this.trigger_type_UID, conditionUID, time_out - time_in);

        return res;
    }
}
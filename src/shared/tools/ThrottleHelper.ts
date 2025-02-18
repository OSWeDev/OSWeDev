import { ThrottleOptions } from '../annotations/Throttle';
import EventsController from '../modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from '../modules/Eventify/vos/EventifyEventListenerConfVO';
import EventifyEventListenerInstanceVO from '../modules/Eventify/vos/EventifyEventListenerInstanceVO';
import ConsoleHandler from './ConsoleHandler';
import EnvHandler from './EnvHandler';

export default class ThrottleHelper {

    public static UID: number = 0;

    public static declare_throttle_without_args(
        name: string, // Obligatoire pour permettre de nommer correctement les evenements et suivre les perfs proprement
        func: () => void | Promise<void>,
        wait_ms: number,
        leading: boolean = true,
    ) {

        // Refonte, on passe par le système des évènements
        const UID = ThrottleHelper.get_next_UID();
        const event_name = 'Throttle.' + name + '.' + UID;
        const listener = EventifyEventListenerInstanceVO.new_listener(
            event_name,
            func,
        );
        listener.throttled = true;
        listener.cooldown_ms = wait_ms;
        // On debounce leading si on est en leading false, sachant que par défaut le leading est true
        listener.debounce_leading = !leading;
        listener.param_type = EventifyEventListenerConfVO.PARAM_TYPE_NONE;
        listener.is_bgthread = false;
        listener.unlimited_calls = true;
        EventsController.register_event_listener(listener);
        return () => EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name));
    }


    public static declare_throttle_with_mappable_args(
        name: string, // Obligatoire pour permettre de nommer correctement les evenements et suivre les perfs proprement
        func: (mappable_args: { [map_elt_id: string]: unknown }) => void | Promise<void>,
        wait_ms: number,
        leading: boolean = true,
    ) {

        // Refonte, on passe par le système des évènements
        const UID = ThrottleHelper.get_next_UID();
        const event_name = 'Throttle.' + name + '.' + UID;
        const listener = EventifyEventListenerInstanceVO.new_listener(
            event_name,
            async (event: EventifyEventInstanceVO, l: EventifyEventListenerInstanceVO) => {
                await func(l.current_params_map as { [map_elt_id: string]: unknown });
            },
        );
        listener.throttled = true;
        listener.cooldown_ms = wait_ms;
        // On debounce leading si on est en leading false, sachant que par défaut le leading est true
        listener.debounce_leading = !leading;
        listener.param_type = EventifyEventListenerConfVO.PARAM_TYPE_MAP;
        listener.is_bgthread = false;
        listener.unlimited_calls = true;
        EventsController.register_event_listener(listener);
        return (mappable_args: { [map_elt_id: string]: unknown }) => EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name, mappable_args));
    }

    public static declare_throttle_with_stackable_args(
        name: string, // Obligatoire pour permettre de nommer correctement les evenements et suivre les perfs proprement
        func: (stackable_args: unknown[]) => void | Promise<void>,
        wait_ms: number,
        leading: boolean = true,
    ) {

        // Refonte, on passe par le système des évènements
        const UID = ThrottleHelper.get_next_UID();
        const event_name = 'Throttle.' + name + '.' + UID;
        const listener = EventifyEventListenerInstanceVO.new_listener(
            event_name,
            async (event: EventifyEventInstanceVO, l: EventifyEventListenerInstanceVO) => {
                await func(l.current_params_stack as unknown[]);
            },
        );
        listener.throttled = true;
        listener.cooldown_ms = wait_ms;
        // On debounce leading si on est en leading false, sachant que par défaut le leading est true
        listener.debounce_leading = !leading;
        listener.param_type = EventifyEventListenerConfVO.PARAM_TYPE_STACK;
        listener.is_bgthread = false;
        listener.unlimited_calls = true;
        EventsController.register_event_listener(listener);
        return (stackable_args?: unknown | unknown[]) => EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name, stackable_args));
    }

    public static get_next_UID() {

        const new_UID = ThrottleHelper.UID++;
        if (EnvHandler.debug_throttle_uid) {
            ConsoleHandler.log('ThrottleHelper:get_next_UID:ThrottleHelper.UID++:' + new_UID);
        }

        return new_UID;
    }
}
import EventifyEventInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import EventifyEventConfVO from "./vos/EventifyEventConfVO";

export default class EventsController {

    public static registered_events_conf_by_name: { [event_conf_name: string]: EventifyEventConfVO } = {};
    public static registered_listeners: { [event_conf_name: string]: { [listener_conf_name: string]: EventifyEventListenerInstanceVO } } = {};

    /**
     * Hook initialisé au début du serveur pour pouvoir mettre un flag Context
     */
    public static hook_stack_incompatible: <T extends Array<unknown>, U>(callback: (...params: T) => U | Promise<U>, this_arg: unknown, reason_context_incompatible: string, ...params: T) => Promise<U> = null;


    /**
     * Méthode qui gère l'impact de l'évènement sur les listeners
     * @param event
     */
    public static emit_event(event: EventifyEventInstanceVO): void {

        if (!EventsController.registered_listeners[event.name]) {
            return;
        }

        const listeners = EventsController.registered_listeners[event.name];

        if (!listeners) {
            return;
        }

        const listner_names = Object.keys(listeners);

        if ((!listner_names) || (!listner_names.length)) {
            return;
        }
        for (const listner_name of listner_names) {
            const listener: EventifyEventListenerInstanceVO = listeners[listner_name];

            // Si le nombre d'appels est déjà atteint, on devrait l'avoir supprimé avant, mais pas grave on le fait ici
            if ((!listener.unlimited_calls) && (listener.remaining_calls <= 0)) {
                delete listeners[listner_name];
                ConsoleHandler.warn('Listener ' + listner_name + ' for event ' + event.name + ' has no more calls left and not deleted before (should have been)');
                continue;
            }

            // Si le listener est pas throttled, on le lance
            if (!listener.throttled) {

                if (!listener.unlimited_calls) {
                    listener.remaining_calls--;
                    if (listener.remaining_calls <= 0) {
                        delete EventsController.registered_listeners[event.name][listener.name];
                    }
                }

                EventsController.call_listener(listener, event);
                continue;
            }

            /**
             * Sur un throttled, on doit gérer le cooldown depuis le dernier appel
             *  Si on est en cooldown, on ne fait rien, mais on doit pouvoir indiquer qu'un cb doit être lancé dès que le cooldown est fini.
             *  Si on est pas en cooldown, on lance le cb
             */
            if ((!listener.cb_is_running) && (!listener.cb_is_cooling_down)) {

                if (!listener.unlimited_calls) {
                    listener.remaining_calls--;
                    if (listener.remaining_calls <= 0) {
                        delete EventsController.registered_listeners[event.name][listener.name];
                    }
                }

                EventsController.call_listener(listener, event);
                continue;
            }

            /**
             * Si l'event est un run as soon as possible, on doit lancer le listener dès que possible
             */
            if (listener.run_as_soon_as_possible_event_conf_id && event.event_conf_id &&
                (listener.run_as_soon_as_possible_event_conf_id == event.event_conf_id)) {

                listener.run_as_soon_as_possible = true;
                if (listener.cb_is_cooling_down) {

                    if (!listener.cooling_down_timeout) {
                        ConsoleHandler.error('Error in EventsController.emit_event for listener ' + listener.name + ' and event ' + event.name + ' : listener.cb_is_cooling_down is true but no cooling_down_timeout');
                    }
                    clearTimeout(listener.cooling_down_timeout);
                    listener.cb_is_cooling_down = false;

                    if (!listener.unlimited_calls) {
                        listener.remaining_calls--;
                        if (listener.remaining_calls <= 0) {
                            delete EventsController.registered_listeners[event.name][listener.name];
                        }
                    }

                    EventsController.call_listener(listener, event);
                    continue;
                }
            }

            listener.throttle_triggered_event_during_cb = true;
            listener.last_triggered_event_during_cb = event;
        }
    }

    public static register_event_conf(event_conf: EventifyEventConfVO): void {
        EventsController.registered_events_conf_by_name[event_conf.name] = event_conf;
    }

    public static register_event_listener(event_listener: EventifyEventListenerInstanceVO): void {
        if (!EventsController.registered_listeners[event_listener.event_conf_name]) {
            EventsController.registered_listeners[event_listener.event_conf_name] = {};
        }

        EventsController.registered_listeners[event_listener.event_conf_name][event_listener.name] = event_listener;
    }

    /**
     * Méthode de simplification pour écouter un évènement côté shared sans avoir à passer par les DAOs (ce qui n'empêche pas d'avoir une conf DAO par ailleurs, mais on ne link pas ici)
     * One shot
     * @param event_name
     * @param cb
     */
    public static on_next_event(event_name: string, cb: (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown): void {
        const listener: EventifyEventListenerInstanceVO = EventifyEventListenerInstanceVO.new_listener(event_name, cb);
        listener.remaining_calls = 1;
        listener.unlimited_calls = false;
        EventsController.register_event_listener(listener);
    }

    /**
     * Méthode de simplification pour await le prochain déclenchement d'un event via une promise
     * @param event_name
     */
    public static await_next_event(event_name: string): Promise<unknown> {

        let resolve_promise = null;
        const waiting_for_event_promise = new Promise((resolve, reject) => {
            resolve_promise = resolve;
        });

        EventsController.on_next_event(event_name, resolve_promise);
        return waiting_for_event_promise;
    }

    /**
     * Méthode de simplification pour écouter un évènement côté shared sans avoir à passer par les DAOs (ce qui n'empêche pas d'avoir une conf DAO par ailleurs, mais on ne link pas ici)
     * A chaque fois, en illimité, throttled, avec cooldown
     * @param event_name
     * @param cb
     */
    public static on_every_event_throttle_cb(
        event_name: string,
        cb: (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown,
        cooldown_ms: number = 0,
        debounce_leading = false,
    ): void {
        const listener: EventifyEventListenerInstanceVO = EventifyEventListenerInstanceVO.new_listener(event_name, cb);
        listener.remaining_calls = 0;
        listener.unlimited_calls = true;
        listener.throttled = true;
        listener.cooldown_ms = cooldown_ms;
        listener.debounce_leading = debounce_leading;
        EventsController.register_event_listener(listener);
    }

    private static async call_listener(listener: EventifyEventListenerInstanceVO, event: EventifyEventInstanceVO): Promise<void> {

        try {

            if (listener.throttled && listener.debounce_leading && (!listener.run_as_soon_as_possible)) {

                // Si on debounce le leading, on doit immédiatement faire le await du cooldown, tout en prenant le sémaphore du run

                listener.cb_is_cooling_down = true;
                listener.cooling_down_timeout = await ThreadHandler.sleep(listener.cooldown_ms, 'EventsController.call_listener.cooldown_ms');
                listener.cb_is_cooling_down = false;
            }
            listener.run_as_soon_as_possible = false;

            do {

                if (listener.throttle_triggered_event_during_cb) {
                    listener.throttle_triggered_event_during_cb = false;
                    event = listener.last_triggered_event_during_cb;
                    listener.last_triggered_event_during_cb = null;
                }

                listener.cb_is_running = true;

                try {
                    if (EventsController.hook_stack_incompatible) {
                        await EventsController.hook_stack_incompatible(listener.cb, listener, 'EventsController.call_listener', event, listener);
                    } else {
                        await listener.cb(event, listener);
                    }
                } catch (error) {
                    ConsoleHandler.error('Error in EventsController.call_listener for listener ' + listener.name + ' and event ' + event.name + ' : ' + error);
                }

                listener.cb_is_running = false;

                if (listener.run_as_soon_as_possible) {
                    // Si on a reçu une demande de run ASAP pendant le cb, on relance le cb ASAP
                    listener.run_as_soon_as_possible = false;
                    listener.throttle_triggered_event_during_cb = true;
                    listener.last_triggered_event_during_cb = listener.last_triggered_event_during_cb ? listener.last_triggered_event_during_cb : event;
                    continue;
                }

                if (listener.cooldown_ms > 0) {
                    listener.cb_is_cooling_down = true;
                    listener.cooling_down_timeout = await ThreadHandler.sleep(listener.cooldown_ms, 'EventsController.call_listener.cooldown_ms');
                    listener.cb_is_cooling_down = false;
                }

                // Si on a un listener de type bgthread, on boucle
                if (listener.is_bgthread) {
                    listener.throttle_triggered_event_during_cb = true;
                    listener.last_triggered_event_during_cb = listener.last_triggered_event_during_cb ? listener.last_triggered_event_during_cb : event;
                }

            } while (listener.throttle_triggered_event_during_cb);
        } catch (error) {
            ConsoleHandler.error('Error in EventsController.call_listener.while for listener ' + listener.name + ' and event ' + event.name + ' : ' + error);
        }
    }
}
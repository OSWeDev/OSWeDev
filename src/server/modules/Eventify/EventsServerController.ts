import EventifyEventInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerConfVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ThreadHandler from "../../../shared/tools/ThreadHandler";

export class EventsServerController {

    private static registered_listeners: { [event_conf_name: string]: { [listener_conf_name: string]: EventifyEventListenerInstanceVO } } = {};

    /**
     * Méthode qui gère l'impact de l'évènement sur les listeners
     * @param event
     */
    public static emit_event(event: EventifyEventInstanceVO): void {

        if (!EventsServerController.registered_listeners[event.name]) {
            return;
        }

        const listeners = EventsServerController.registered_listeners[event.name];

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
                EventsServerController.call_listener(listener, event);
                continue;
            }

            /**
             * Sur un throttled, on doit gérer le cooldown depuis le dernier appel
             *  Si on est en cooldown, on ne fait rien, mais on doit pouvoir indiquer qu'un cb doit être lancé dès que le cooldown est fini.
             *  Si on est pas en cooldown, on lance le cb
             */
            if ((!listener.cb_is_running) && (!listener.cb_is_cooling_down)) {
                EventsServerController.call_listener(listener, event);
                continue;
            }

            /**
             * Si l'event est un run as soon as possible, on doit lancer le listener dès que possible
             */
            if (listener.run_as_soon_as_possible_event_conf_id == event.event_conf_id) {

                if (listener.cb_is_cooling_down) {

                    if (!listener.cooling_down_timeout) {
                        ConsoleHandler.error('Error in EventsServerController.emit_event for listener ' + listener.name + ' and event ' + event.name + ' : listener.cb_is_cooling_down is true but no cooling_down_timeout');
                    }
                    clearTimeout(listener.cooling_down_timeout);
                    listener.cb_is_cooling_down = false;
                    EventsServerController.call_listener(listener, event);
                    continue;
                }
                listener.run_as_soon_as_possible = true;
            }

            listener.throttle_triggered_event_during_cb = true;
            listener.last_triggered_event_during_cb = event;
        }
    }

    public static register_event_listener(event_listener: EventifyEventListenerInstanceVO): void {
        if (!EventsServerController.registered_listeners[event_listener.event_conf_name]) {
            EventsServerController.registered_listeners[event_listener.event_conf_name] = {};
        }

        EventsServerController.registered_listeners[event_listener.event_conf_name][event_listener.name] = event_listener;
    }

    private static async call_listener(listener: EventifyEventListenerInstanceVO, event: EventifyEventInstanceVO): Promise<void> {

        if (!listener.unlimited_calls) {
            listener.remaining_calls--;
            if (listener.remaining_calls <= 0) {
                delete EventsServerController.registered_listeners[event.name][listener.name];
            }
        }

        try {
            do {

                if (listener.throttle_triggered_event_during_cb) {
                    listener.throttle_triggered_event_during_cb = false;
                    event = listener.last_triggered_event_during_cb;
                    listener.last_triggered_event_during_cb = null;
                }

                listener.cb_is_running = true;

                try {
                    await listener.cb();
                } catch (error) {
                    ConsoleHandler.error('Error in EventsServerController.call_listener for listener ' + listener.name + ' and event ' + event.name + ' : ' + error);
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
                    listener.cooling_down_timeout = await ThreadHandler.sleep(listener.cooldown_ms, 'EventsServerController.call_listener.cooldown_ms');
                    listener.cb_is_cooling_down = false;
                }

                // Si on a un listener de type bgthread, on boucle
                if (listener.is_bgthread) {
                    listener.throttle_triggered_event_during_cb = true;
                    listener.last_triggered_event_during_cb = listener.last_triggered_event_during_cb ? listener.last_triggered_event_during_cb : event;
                }

            } while (listener.throttle_triggered_event_during_cb);
        } catch (error) {
            ConsoleHandler.error('Error in EventsServerController.call_listener.while for listener ' + listener.name + ' and event ' + event.name + ' : ' + error);
        }
    }
}
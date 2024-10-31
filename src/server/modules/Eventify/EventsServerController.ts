import EventifyEventListenerConfVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";

export class EventsServerController {

    private static registered_listeners: { [event_conf_name: string]: { [listener_conf_name: string]: EventifyEventListenerInstanceVO } } = {};

    /**
     * Méthode qui gère l'impact de l'évènement sur les listeners
     * @param event
     */
    public static emit_event(event: EventifyEventListenerInstanceVO): void {

        if (!EventsServerController.registered_listeners[event.event_conf_name]) {
            return;
        }

        const listeners = EventsServerController.registered_listeners[event.event_conf_name];

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
                ConsoleHandler.warn('Listener ' + listner_name + ' for event ' + event.event_conf_name + ' has no more calls left and not deleted before (should have been)');
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

            listener.throttle_triggered_event_during_cb = true;
        }
    }

    public static register_event_listener(event_listener: EventifyEventListenerInstanceVO): void {
        if (!EventsServerController.registered_listeners[event_listener.event_conf_name]) {
            EventsServerController.registered_listeners[event_listener.event_conf_name] = {};
        }

        EventsServerController.registered_listeners[event_listener.event_conf_name][event_listener.name] = event_listener;
    }

    private static call_listener(listener: EventifyEventListenerInstanceVO, event: EventifyEventListenerInstanceVO): void {

        listener.remaining_calls--;
        if (listener.remaining_calls <= 0) {
            delete EventsServerController.registered_listeners[event.event_conf_name][listener.name];
        }

        listener.cb();
    }
}
import { isArray } from "lodash";
import ConfigurationService from "../../../server/env/ConfigurationService";
import EventifyEventInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import Dates from "../FormatDatesNombres/Dates/Dates";
import { StatThisMapKeys } from "../Stats/annotations/StatThisMapKeys";
import StatsController from "../Stats/StatsController";
import EventifyEventConfVO from "./vos/EventifyEventConfVO";
import EventifyEventListenerConfVO from "./vos/EventifyEventListenerConfVO";
import EventifyPerfReportVO from "./vos/perfs/EventifyPerfReportVO";

export default class EventsController {

    /**
     * Hook initialisé au début du serveur pour pouvoir mettre un flag Context
     */
    public static hook_stack_incompatible: <T extends Array<unknown>, U>(callback: (...params: T) => U | Promise<U>, this_arg: unknown, reason_context_incompatible: string, ...params: T) => Promise<U> = null;

    /**
     * Pour activer le log des emissions d'events et call de listeners liés à ces noms d'events
     */
    public static log_events_names: { [event_name: string]: boolean } = {};

    /**
     * Pour la gestion des perf reports
     */
    public static current_perf_report: EventifyPerfReportVO = null;

    /**
     * On stocke la date de début du listener pour pas log en boucle le même run
     */
    private static last_logged_duration_listener: { [listener_name: string]: number } = {};
    private static last_stated_duration_listener: { [listener_name: string]: number } = {};

    @StatThisMapKeys('EventsController')
    public static registered_events_conf_by_name: { [event_conf_name: string]: EventifyEventConfVO } = {};
    @StatThisMapKeys('EventsController', null, 1)
    public static registered_listeners: { [event_conf_name: string]: { [listener_conf_name: string]: EventifyEventListenerInstanceVO } } = {};

    @StatThisMapKeys('EventsController', null, 1, true)
    public static semaphored_await_next_promises: { [full_semaphore_name: string]: Array<Promise<unknown>> } = {};


    public static init_events_controller(): void {
        if (StatsController.ACTIVATED || ConfigurationService.node_configuration.debug_slow_event_listeners) {
            // Si on a des stats ou des logs à faire, on active l'intervale pour checker les listeners lents
            setInterval(() => {
                if (ConfigurationService.node_configuration.debug_slow_event_listeners) {
                    this.log_slow_listeners();
                }
                if (StatsController.ACTIVATED) {
                    this.stats_listeners();
                }
            }, 10000);
        }
    }

    /**
     * Méthode qui gère l'impact de l'évènement sur les listeners
     * @param event
     */
    public static emit_event(event: EventifyEventInstanceVO): void {

        if (EventsController.log_events_names[event.name]) {
            ConsoleHandler.log('Emitting event "' + event.name + '" - ' + (event.param ? 'with param : ' + JSON.stringify(event.param) : 'without param'));
        }

        // Pas de listeners enregistrés pour cet event, on ignore
        if (!EventsController.registered_listeners[event.name]) {
            return;
        }

        const listeners = EventsController.registered_listeners[event.name];
        const listner_names = Object.keys(listeners);

        if ((!listner_names) || (!listner_names.length)) {
            return;
        }
        for (const listner_name of listner_names) {
            const listener: EventifyEventListenerInstanceVO = listeners[listner_name];

            // Gestion du perf report
            if (EventsController.current_perf_report) {
                if (!EventsController.current_perf_report.perf_datas[listner_name]) {
                    EventsController.current_perf_report.perf_datas[listner_name] = {
                        event_name: event.name,
                        listener_name: listener.name,
                        calls: [],
                        cooldowns: [],
                        events: [],
                    };
                }

                EventsController.current_perf_report.perf_datas[listner_name].events.push(event.emission_date_ms);
            }

            if (EventsController.log_events_names[event.name]) {
                ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Logging listener current state pre-event :');
                listener.log();
            }

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

                        if (EventsController.log_events_names[event.name]) {
                            ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Not unlimited and is last remaining call - unregistering listener');
                        }

                        delete EventsController.registered_listeners[event.name][listener.name];
                    }
                }

                if (EventsController.log_events_names[event.name]) {
                    ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Not throttled - calling listener');
                }

                EventsController.call_listener(listener, event);
                continue;
            }

            // Si le listener est throttled, on doit stocker les params pour le prochain appel
            if (listener.param_type == EventifyEventListenerConfVO.PARAM_TYPE_STACK) {
                const stack = event.param ? (isArray(event.param) ? event.param : [event.param]) : [];
                if (!listener.next_params_stack) {
                    listener.next_params_stack = stack;
                } else {
                    listener.next_params_stack = listener.next_params_stack.concat(stack);
                }
            } else if (listener.param_type == EventifyEventListenerConfVO.PARAM_TYPE_MAP) {
                if (!listener.next_params_map) {
                    listener.next_params_map = event.param as { [param_id: string | number]: unknown };
                } else {
                    listener.next_params_map = Object.assign(listener.next_params_map, event.param);
                }
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

                        if (EventsController.log_events_names[event.name]) {
                            ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Not unlimited and is last remaining call - unregistering listener');
                        }

                        delete EventsController.registered_listeners[event.name][listener.name];
                    }
                }

                if (EventsController.log_events_names[event.name]) {
                    ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Not running & Not coolingdown - calling listener');
                }

                EventsController.call_listener(listener, event);
                continue;
            }

            /**
             * Si l'event est un run as soon as possible, on doit lancer le listener dès que possible
             */
            if (listener.run_as_soon_as_possible_event_conf_id && event.event_conf_id &&
                (listener.run_as_soon_as_possible_event_conf_id == event.event_conf_id)) {

                if (EventsController.log_events_names[event.name]) {
                    ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - RUN AS SOON AS POSSIBLE');
                }

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

                            if (EventsController.log_events_names[event.name]) {
                                ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Not unlimited and is last remaining call - unregistering listener');
                            }

                            delete EventsController.registered_listeners[event.name][listener.name];
                        }
                    }

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - Is coolingdown But RUN ASAP - calling listener');
                    }

                    EventsController.call_listener(listener, event);
                    continue;
                }
            }

            listener.throttle_triggered_event_during_cb = true;
            listener.last_triggered_event_during_cb = event;

            if (EventsController.log_events_names[event.name]) {
                ConsoleHandler.log('Emitting event "' + event.name + '" - Listener "' + listener.name + '" - not calling listener, waiting for auto rerun with throttle_triggered_event_during_cb=true');
            }
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

        if (EventsController.log_events_names[event_listener.event_conf_name]) {
            ConsoleHandler.log('register_event_listener "' + event_listener.event_conf_name + '" - Listener "' + event_listener.name + '" - logging listener');
            event_listener.log();
        }
    }

    /**
     * Méthode de simplification pour écouter un évènement côté shared sans avoir à passer par les DAOs (ce qui n'empêche pas d'avoir une conf DAO par ailleurs, mais on ne link pas ici)
     * One shot
     * @param event_name
     * @param cb
     */
    public static on_next_event(event_name: string, cb: (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown): void {

        if (EventsController.log_events_names[event_name]) {
            ConsoleHandler.log('on_next_event "' + event_name + '"');
        }

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

        if (EventsController.log_events_names[event_name]) {
            ConsoleHandler.log('await_next_event "' + event_name + '"');
        }

        let resolve_promise = null;
        const waiting_for_event_promise = new Promise((resolve, reject) => {
            resolve_promise = resolve;
        });

        EventsController.on_next_event(event_name, resolve_promise);
        return waiting_for_event_promise;
    }

    /**
     * On await next, mais on sémaphore la promise pour éviter des résolutions multiples pour un seul event
     * En gros si on fait 4 await next, on aura besoin de 4 events pour résoudre les 4 promises
     * @param event_name
     * @param semaphore_name
     */
    public static async await_next_event_semaphored(event_name: string, semaphore_name: string): Promise<unknown> {

        if (EventsController.log_events_names[event_name]) {
            ConsoleHandler.log('await_next_event_semaphored "' + event_name + '"');
        }

        const full_semaphore_name = event_name + '___' + semaphore_name;
        if (!EventsController.semaphored_await_next_promises[full_semaphore_name]) {
            EventsController.semaphored_await_next_promises[full_semaphore_name] = [];
        }

        // On déclare la nouvelle promise dans la map
        let resolve_promise = null;
        const waiting_for_event_promise = new Promise((resolve, reject) => {

            resolve_promise = () => {
                // On supprime la promise de la map
                EventsController.semaphored_await_next_promises[full_semaphore_name].shift();

                if (EventsController.semaphored_await_next_promises[full_semaphore_name].length == 0) {
                    delete EventsController.semaphored_await_next_promises[full_semaphore_name];
                }

                resolve(null);
            };
        });
        EventsController.semaphored_await_next_promises[full_semaphore_name].push(waiting_for_event_promise);
        // On attend la promise précédente dans la map
        if (EventsController.semaphored_await_next_promises[full_semaphore_name].length > 1) {
            await EventsController.semaphored_await_next_promises[full_semaphore_name][EventsController.semaphored_await_next_promises[full_semaphore_name].length - 2];

            if (EventsController.log_events_names[event_name]) {
                ConsoleHandler.log('await_next_event_semaphored "' + event_name + '" - Previous await_next_event_semaphored triggered - waiting for next event');
            }

        }

        // On attend le prochain event
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

        if (EventsController.log_events_names[event_name]) {
            ConsoleHandler.log('on_every_event_throttle_cb "' + event_name + '"');
        }

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

            if (EventsController.log_events_names[event.name]) {
                ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - logging listener call_listener IN');
                listener.log();
            }

            if (listener.throttled && listener.debounce_leading && (!listener.run_as_soon_as_possible)) {

                // Si on debounce le leading, on doit immédiatement faire le await du cooldown, tout en prenant le sémaphore du run

                if (EventsController.log_events_names[event.name]) {
                    ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - Debounce leading IN');
                }

                const pre_cb_date = Dates.now_ms();
                listener.cb_is_cooling_down = true;
                listener.cooling_down_timeout = await ThreadHandler.sleep(listener.cooldown_ms, 'EventsController.call_listener.cooldown_ms');
                listener.cb_is_cooling_down = false;

                // Gestion du perf report
                if (EventsController.current_perf_report) {
                    if (!EventsController.current_perf_report.perf_datas[listener.name]) {
                        EventsController.current_perf_report.perf_datas[listener.name] = {
                            event_name: event.name,
                            listener_name: listener.name,
                            calls: [],
                            cooldowns: [],
                            events: [],
                        };
                    }

                    EventsController.current_perf_report.perf_datas[listener.name].cooldowns.push({
                        start: pre_cb_date,
                        end: Dates.now_ms(),
                    });
                }


                if (EventsController.log_events_names[event.name]) {
                    ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - Debounce leading OUT');
                }
            }
            listener.run_as_soon_as_possible = false;

            do {

                if (listener.throttle_triggered_event_during_cb) {

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - throttle_triggered_event_during_cb');
                        listener.log();
                    }

                    listener.throttle_triggered_event_during_cb = false;
                    event = listener.last_triggered_event_during_cb;
                    listener.last_triggered_event_during_cb = null;
                }

                listener.cb_is_running = true;

                // On prépare les params du call
                if (listener.throttled && (listener.param_type == EventifyEventListenerConfVO.PARAM_TYPE_STACK)) {
                    listener.current_params_stack = listener.next_params_stack;
                    listener.next_params_stack = null;
                } else if (listener.throttled && (listener.param_type == EventifyEventListenerConfVO.PARAM_TYPE_MAP)) {
                    listener.current_params_map = listener.next_params_map;
                    listener.next_params_map = null;
                }

                try {

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - logging listener pre-call');
                        listener.log();
                    }

                    listener.last_cb_run_start_date_ms = Dates.now_ms();
                    if (EventsController.hook_stack_incompatible) {
                        await EventsController.hook_stack_incompatible(listener.cb, listener, 'EventsController.call_listener', event, listener);
                    } else {
                        await listener.cb(event, listener);
                    }
                    listener.last_cb_run_end_date_ms = Dates.now_ms();

                    // Gestion du perf report
                    if (EventsController.current_perf_report) {
                        if (!EventsController.current_perf_report.perf_datas[listener.name]) {
                            EventsController.current_perf_report.perf_datas[listener.name] = {
                                event_name: event.name,
                                listener_name: listener.name,
                                calls: [],
                                cooldowns: [],
                                events: [],
                            };
                        }

                        EventsController.current_perf_report.perf_datas[listener.name].calls.push({
                            start: listener.last_cb_run_start_date_ms,
                            end: listener.last_cb_run_end_date_ms,
                        });
                    }

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - logging listener post-call');
                        listener.log();
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

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - RUN ASAP');
                    }

                    continue;
                }

                if (listener.cooldown_ms > 0) {

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - Cooldown IN');
                    }

                    const date_pre_cd = Dates.now_ms();
                    listener.cb_is_cooling_down = true;
                    listener.cooling_down_timeout = await ThreadHandler.sleep(listener.cooldown_ms, 'EventsController.call_listener.cooldown_ms');
                    listener.cb_is_cooling_down = false;

                    // Gestion du perf report
                    if (EventsController.current_perf_report) {
                        if (!EventsController.current_perf_report.perf_datas[listener.name]) {
                            EventsController.current_perf_report.perf_datas[listener.name] = {
                                event_name: event.name,
                                listener_name: listener.name,
                                calls: [],
                                cooldowns: [],
                                events: [],
                            };
                        }

                        EventsController.current_perf_report.perf_datas[listener.name].cooldowns.push({
                            start: date_pre_cd,
                            end: Dates.now_ms(),
                        });
                    }

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - Cooldown OUT');
                    }
                }

                // Si on a un listener de type bgthread, on boucle
                if (listener.is_bgthread) {
                    listener.throttle_triggered_event_during_cb = true;
                    listener.last_triggered_event_during_cb = listener.last_triggered_event_during_cb ? listener.last_triggered_event_during_cb : event;

                    if (EventsController.log_events_names[event.name]) {
                        ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - Is bgthread - looping');
                    }
                }

            } while (listener.throttle_triggered_event_during_cb);
        } catch (error) {
            ConsoleHandler.error('Error in EventsController.call_listener.while for listener ' + listener.name + ' and event ' + event.name + ' : ' + error);
            listener.cb_is_running = false;
            listener.cb_is_cooling_down = false;
            listener.run_as_soon_as_possible = false;
            listener.throttle_triggered_event_during_cb = false;
        }

        if (EventsController.log_events_names[event.name]) {
            ConsoleHandler.log('call_listener "' + event.name + '" - Listener "' + listener.name + '" - logging listener call_listener OUT');
            listener.log();
        }
    }

    private static log_slow_listeners() {
        for (const i in EventsController.registered_listeners) {
            const listeners = EventsController.registered_listeners[i];

            for (const j in listeners) {
                const listener = listeners[j];

                if (listener.cb_is_running) {
                    if ((Dates.now_ms() - listener.last_cb_run_start_date_ms) > ConfigurationService.node_configuration.debug_slow_event_listeners_ms_limit) {
                        ConsoleHandler.warn('Slow listener : ' + listener.name + ' for event ' + listener.event_conf_name + ' : ' + (Dates.now_ms() - listener.last_cb_run_start_date_ms) + 'ms (running, started at ' + listener.last_cb_run_start_date_ms + ')');
                    }
                } else {
                    if (listener.last_cb_run_start_date_ms && listener.last_cb_run_end_date_ms) {
                        if (EventsController.last_logged_duration_listener[listener.name] != listener.last_cb_run_start_date_ms) {
                            EventsController.last_logged_duration_listener[listener.name] = listener.last_cb_run_start_date_ms;
                            if ((listener.last_cb_run_end_date_ms - listener.last_cb_run_start_date_ms) > ConfigurationService.node_configuration.debug_slow_event_listeners_ms_limit) {
                                ConsoleHandler.warn('Slow listener : ' + listener.name + ' for event ' + listener.event_conf_name + ' : ' + (listener.last_cb_run_end_date_ms - listener.last_cb_run_start_date_ms) + 'ms (ended, started at ' + listener.last_cb_run_start_date_ms + ')');
                            }
                        }
                    }
                }
            }
        }
    }

    private static stats_listeners() {

        let nb_running = 0;
        let nb_waiting_for_rerun = 0;
        let nb_coolingdown = 0;
        let nb_slow_listeners_picked = 0; // Pas réellement le nombre de slow listeneres, mais un indicateur qui peut être utilisé pour les stats
        for (const i in EventsController.registered_listeners) {
            const listeners = EventsController.registered_listeners[i];

            for (const j in listeners) {
                const listener = listeners[j];

                if (listener.cb_is_cooling_down) {
                    nb_coolingdown++;
                }
                if (listener.cb_is_running) {
                    nb_running++;
                    if ((Dates.now_ms() - listener.last_cb_run_start_date_ms) > ConfigurationService.node_configuration.debug_slow_event_listeners_ms_limit) {
                        nb_slow_listeners_picked++;
                    }

                    if (listener.throttle_triggered_event_during_cb) {
                        nb_waiting_for_rerun++;
                    }
                } else {
                    if (listener.last_cb_run_start_date_ms && listener.last_cb_run_end_date_ms) {
                        if (EventsController.last_stated_duration_listener[listener.name] != listener.last_cb_run_start_date_ms) {
                            EventsController.last_stated_duration_listener[listener.name] = listener.last_cb_run_start_date_ms;
                            if ((listener.last_cb_run_end_date_ms - listener.last_cb_run_start_date_ms) > ConfigurationService.node_configuration.debug_slow_event_listeners_ms_limit) {
                                nb_slow_listeners_picked++;
                            }
                        }
                    }
                }
            }
        }

        StatsController.register_stat_QUANTITE('EventsController', 'stats_listeners', 'nb_running', nb_running);
        StatsController.register_stat_QUANTITE('EventsController', 'stats_listeners', 'nb_waiting_for_rerun', nb_waiting_for_rerun);
        StatsController.register_stat_QUANTITE('EventsController', 'stats_listeners', 'nb_coolingdown', nb_coolingdown);
        StatsController.register_stat_QUANTITE('EventsController', 'stats_listeners', 'nb_slow_listeners_picked', nb_slow_listeners_picked);
    }
}
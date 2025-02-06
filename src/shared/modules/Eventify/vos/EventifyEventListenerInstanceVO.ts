import ConsoleHandler from '../../../tools/ConsoleHandler';
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';
import ModulesManager from '../../ModulesManager';
import EventsController from '../EventsController';
import EventifyEventConfVO from './EventifyEventConfVO';
import EventifyEventInstanceVO from './EventifyEventInstanceVO';
import EventifyEventListenerConfVO from './EventifyEventListenerConfVO';

export default class EventifyEventListenerInstanceVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "eventify_event_listener_instance";
    public static UID: number = 0;

    public id: number;
    public _type: string = EventifyEventListenerInstanceVO.API_TYPE_ID;

    /**
     * La conf dont est issue l'instance (si elle est issue d'une conf)
     */
    public listener_conf_id: number;

    /**
     * Nom, pour le retrouver facilement
     */
    public name: string;

    /**
     * UID de l'instance
     */
    public instance_uid: string;

    /**
     * ID de la conf d'évènement écoutée
     */
    public event_conf_id: number;

    /**
     * Nom de la conf d'évènement écoutée
     */
    public event_conf_name: string;

    /**
     * Appels illimités
     */
    public unlimited_calls: boolean;

    /**
     * Nb d'appels restants avant destruction si pas illimité
     */
    public remaining_calls: number;

    /**
     * Temps de cooldown entre chaque appel - ms
     *  Appliqué entre la fin de l'appel et le début du prochain
     */
    public cooldown_ms: number;

    /**
     * Soit les appels sont lancés à chaque fois que l'event est déclenché, soit on throttle les appels qui qui sont fait tant qu'on
     *  a des évènements (et qu'on a pas atteint le max_calls), mais avec un ratio != 1 entre les events et les appels.
     */
    public throttled: boolean;

    /**
     * Si on est throttled, on veut savoir si un event a été trigger durant le callback
     */
    public throttle_triggered_event_during_cb: boolean;

    /**
     * On peut vouloir lancer le callback dès que possible, même si on est en cooldown => marqueur de la demande
     */
    public run_as_soon_as_possible: boolean;

    /**
     * On peut vouloir lancer le callback dès que possible, même si on est en cooldown => évènement qui a cet effet
     */
    public run_as_soon_as_possible_event_conf_id: number;

    /**
     * Si on est sur un type bgthread, qui run en permanence
     */
    public is_bgthread: boolean;

    /**
     * Le dernier évènement qui a été trigger durant le callback
     */
    public last_triggered_event_during_cb: EventifyEventInstanceVO;

    /**
     * Dans le cadre d'un throttling, est-ce qu'on appel le cb dès le premier event, ou on applique le cooldown d'abord
     *  A priori par défaut false
     * Celà dit, si on a un cooldown de 0, ça revient au même
     */
    public debounce_leading: boolean;

    /**
     * Module qui contient le callback
     */
    public cb_module_name: string;

    /**
     * Nom de la fonction de callback
     */
    public cb_function_name: string;

    /**
     * On veut savoir si le cb est en cours d'exécution
     */
    public cb_is_running: boolean;

    /**
     * On veut savoir si le cb est en cours de cooldown
     * On fait le cooldown via un sleep en fin de run, et on recheck après si on a une demande de rerun entre temps
     */
    public cb_is_cooling_down: boolean;

    /**
     * On a besoin du timeout pour pouvoir le clear si on a une demande de run ASAP entre temps
     */
    public cooling_down_timeout: NodeJS.Timeout;

    /**
     * On a besoin de la date de fin du dernier appel pour gérer le throttling en ms
     */
    public last_cb_run_end_date_ms: number;

    /**
     * Date de début du dernier appel pour du log et debug principalement
     */
    public last_cb_run_start_date_ms: number;

    /**
     * Dans le cas où l'évènement fourni un paramètre, quel mode de paramétrage on utilise (EventifyEventListenerConfVO.PARAM_TYPE_*):
     *  - STACKABLE : on stack les paramètres
     *  - MAPPABLE : on map les paramètres
     *  - NONE : on ne prend pas en compte les paramètres
     */
    public param_type: number;

    /**
     * Dans le callback, on a toujours le dernier event instancié avant le callback + le listener
     *  et comme on a qu'un seul appel à la fois, on peut dans le listener instancié stocker les params de cet appel
     * Donc on stocke en mode map ou stack, pour l'appel en cours et pour le prochain
     */
    public current_params_stack: unknown[];

    /**
     * Dans le callback, on a toujours le dernier event instancié avant le callback + le listener
     *  et comme on a qu'un seul appel à la fois, on peut dans le listener instancié stocker les params de cet appel
     * Donc on stocke en mode map ou stack, pour l'appel en cours et pour le prochain
     */
    public current_params_map: { [param_id: string | number]: unknown };

    /**
     * Dans le callback, on a toujours le dernier event instancié avant le callback + le listener
     *  et comme on a qu'un seul appel à la fois, on peut dans le listener instancié stocker les params de cet appel
     * Donc on stocke en mode map ou stack, pour l'appel en cours et pour le prochain
     */
    public next_params_stack: unknown[];

    /**
     * Dans le callback, on a toujours le dernier event instancié avant le callback + le listener
     *  et comme on a qu'un seul appel à la fois, on peut dans le listener instancié stocker les params de cet appel
     * Donc on stocke en mode map ou stack, pour l'appel en cours et pour le prochain
     */
    public next_params_map: { [param_id: string | number]: unknown };

    /**
     * Nom du template oselia à instancier à chaque event
     */
    public oselia_run_template_name: string;

    /**
     * Clé de cache pour le param reçu
     * @default "PARAM"
     */
    public oselia_run_param_cache_key: string;

    /**
     * Lier l'oselia_run à l'event
     * @default true
     */
    public oselia_run_link_to_event: boolean;

    /**
     * Lier l'oselia_run au listener
     * @default true
     */
    public oselia_run_link_to_listener: boolean;

    /**
     * Lier le param à l'oselia_run, si possible (si on a pas de champs défini et qu'on n'en trouve pas, ce n'est pas considéré comme une erreur)
     * @default true
     */
    public oselia_run_linked_to_param: boolean;

    /**
     * Nom du champ du param qui contient l'id de l'oselia_run dans le param (si oselia_run_linked_to_param est true)
     * @default null mais on chargera automatiquement le champ du param._type qui est lié au type oselia_run
     */
    public oselia_run_linked_to_param_field_name: string;

    private _cb: (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown;

    get cb(): (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown {

        return this.initial_getter_cb();
    }

    public static instantiate(conf: EventifyEventListenerConfVO): EventifyEventListenerInstanceVO {
        const res: EventifyEventListenerInstanceVO = new EventifyEventListenerInstanceVO();

        res.name = conf.name;
        res.instance_uid = EventifyEventListenerInstanceVO.get_uid(conf.name);
        res.event_conf_id = conf.id;
        res.event_conf_name = conf.name;
        res.unlimited_calls = !conf.max_calls;
        res.remaining_calls = conf.max_calls;
        res.cooldown_ms = conf.cooldown_ms;
        res.throttled = conf.throttled;
        res.throttle_triggered_event_during_cb = false;
        res.cb_module_name = conf.cb_module_name;
        res.debounce_leading = conf.debounce_leading;
        res.cb_function_name = conf.cb_function_name;
        res.cb_is_running = false;
        res.param_type = conf.param_type;
        res.cb_is_cooling_down = false;
        res.last_cb_run_start_date_ms = 0;
        res.last_cb_run_end_date_ms = 0;
        res.run_as_soon_as_possible = false;
        res.run_as_soon_as_possible_event_conf_id = conf.run_as_soon_as_possible_event_conf_id;
        res.oselia_run_link_to_event = conf.oselia_run_link_to_event;
        res.oselia_run_link_to_listener = conf.oselia_run_link_to_listener;
        res.oselia_run_linked_to_param = conf.oselia_run_linked_to_param;
        res.oselia_run_linked_to_param_field_name = conf.oselia_run_linked_to_param_field_name;
        res.oselia_run_param_cache_key = conf.oselia_run_param_cache_key;
        res.oselia_run_template_name = conf.oselia_run_template_name;
        res.is_bgthread = conf.is_bgthread;
        res.listener_conf_id = conf.id;
        return res;
    }

    /**
     * On ne peut avoir qu'un seul listener par nom de listener. Dans ce contexte, on veut pas perdre d'autres listeners déjà définis, donc on les renomme avec l'UID, pas uniquement le nom de l'event
     * @param event_name
     * @param cb
     * @returns
     */
    public static new_listener(event_name: string, cb: (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown): EventifyEventListenerInstanceVO {
        const res: EventifyEventListenerInstanceVO = new EventifyEventListenerInstanceVO();

        res.instance_uid = EventifyEventListenerInstanceVO.get_uid(event_name);
        res.name = res.instance_uid;

        const event_conf = EventsController.registered_events_conf_by_name[event_name];
        res.event_conf_id = event_conf ? event_conf.id : null;
        res.event_conf_name = event_name;

        res.throttle_triggered_event_during_cb = false;
        res.cb_is_running = false;
        res.cb_is_cooling_down = false;
        res.last_cb_run_start_date_ms = 0;
        res.last_cb_run_end_date_ms = 0;
        res.debounce_leading = false;
        res.param_type = EventifyEventListenerConfVO.PARAM_TYPE_NONE;
        res.run_as_soon_as_possible = false;
        res._cb = cb;
        return res;
    }

    public static get_uid(name: string): string {
        return name + '_' + EventifyEventListenerInstanceVO.UID++;
    }

    /**
     * On affiche l'état actuel du listener. On s'intéresse en particulier à savoir la date de dernier appel, l'état actuel (en attent, en cours, ...)
     */
    public log() {

        const now_ms: number = Dates.now_ms();
        let log = '=== Listener "' + this.name + '" ===\n';
        log += '  - Event name : ' + this.event_conf_name + '\n';
        log += '  - Event conf id : ' + this.event_conf_id + '\n';
        log += '  - Listener conf id : ' + this.listener_conf_id + '\n';
        log += '  - Unlimited calls : ' + this.unlimited_calls + '\n';
        log += '  - Remaining calls : ' + this.remaining_calls + '\n';
        log += '  - Cooldown ms : ' + this.cooldown_ms + '\n';
        log += '  - Throttled : ' + this.throttled + '\n';
        log += '  - Debounce leading : ' + this.debounce_leading + '\n';
        log += '  - Throttle triggered event during cb : ' + this.throttle_triggered_event_during_cb + '\n';
        log += '  - Run as soon as possible : ' + this.run_as_soon_as_possible + '\n';
        log += '  - Is bgthread : ' + this.is_bgthread + '\n';
        log += '  - Is running : ' + this.cb_is_running + '\n';
        log += '  - Is cooling down : ' + this.cb_is_cooling_down + '\n';
        log += '  - Last cb run start date : ' + (now_ms - this.last_cb_run_start_date_ms) + 'ms ago\n';
        log += '  - Last cb run end date : ' + (now_ms - this.last_cb_run_end_date_ms) + 'ms ago\n';

        ConsoleHandler.log(log);
    }

    private initial_getter_cb(): (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) => Promise<unknown> | unknown {

        if (this._cb == null) {
            try {
                const m = ModulesManager.getModuleByNameAndRole(this.cb_module_name, "SERVER_MODULE_ROLE_NAME");
                this._cb = m[this.cb_function_name].bind(m);
            } catch (error) {
                ConsoleHandler.error('Error while getting cb for EventifyEventListenerInstanceVO ' + this.id + ' : ' + error);
                throw error;
            }
        }

        return this._cb;
    }

}
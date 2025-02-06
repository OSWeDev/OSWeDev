import { reflect } from '../../../tools/ObjectHandler';
import IDistantVOBase from '../../IDistantVOBase';
import ModuleOselia from '../../Oselia/ModuleOselia';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';
import EventifyEventConfVO from './EventifyEventConfVO';
import EventifyEventListenerInstanceVO from './EventifyEventListenerInstanceVO';

export default class EventifyEventListenerConfVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "eventify_event_listener_conf";

    public static PARAM_TYPE_LABELS: string[] = [
        "EventifyEventListenerConfVO.PARAM_TYPE_NONE",
        "EventifyEventListenerConfVO.PARAM_TYPE_STACK",
        "EventifyEventListenerConfVO.PARAM_TYPE_MAP"
    ];
    public static PARAM_TYPE_NONE: number = 0;
    public static PARAM_TYPE_STACK: number = 1;
    public static PARAM_TYPE_MAP: number = 2;

    public id: number;
    public _type: string = EventifyEventListenerConfVO.API_TYPE_ID;

    /**
     * Nom, pour le retrouver facilement
     */
    public name: string;

    /**
     * ID de la conf d'évènement écoutée
     */
    public event_conf_id: number;

    /**
     * Nom de la conf d'évènement écoutée
     */
    public event_conf_name: string;

    /**
     * Nb max d'appels suite déclenchement des events
     *  On peut avoir 1000 events et 2 appels si le cb met beaucoup de temps à redevenir dispo et qu'on est en mode "queue"
     *  0 pour illimité
     */
    public max_calls: number;

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
     * On peut vouloir lancer le callback dès que possible, même si on est en cooldown => évènement qui a cet effet
     */
    public run_as_soon_as_possible_event_conf_id: number;

    /**
     * Si on est sur un type bgthread, qui run en permanence
     */
    public is_bgthread: boolean;

    /**
     * Dans le cadre d'un throttling, est-ce qu'on appel le cb dès le premier event, ou on applique le cooldown d'abord
     *  A priori par défaut false
     * Celà dit, si on a un cooldown de 0, ça revient au même
     */
    public debounce_leading: boolean;

    /**
     * Dans le cas où l'évènement fourni un paramètre, quel mode de paramétrage on utilise (EventifyEventListenerConfVO.PARAM_TYPE_*):
     *  - STACKABLE : on stack les paramètres
     *  - MAPPABLE : on map les paramètres
     *  - NONE : on ne prend pas en compte les paramètres
     */
    public param_type: number;

    /**
     * On ajoute une option d'instanciation d'Osélia Run directement en sortie de l'event
     *  - on met en cache le param reçu (on throttle cette méthode, donc on fera une instance par élément de la liste de params) dans la clé oselia_run_param_cache_key
     *  - quand on a instancié l'oselia_run, si l'option oselia_run_link_to_event (true by default) est activée,
     *      on lie l'oselia_run à l'event (et donc on insère l'event en base aussi à cette occasion - et la conf si elle n'existe pas)
     *  - quand on a instancié l'oselia_run, si l'option oselia_run_link_to_listener (true by default) est activée,
     *      on lie l'oselia_run au listener (et donc on insère le listener en base aussi à cette occasion - et la conf si elle n'existe pas)
     *  - quand on a instancié l'oselia_run, si l'option oselia_run_linked_to_param (true by default) est activée,
     *      on lie le param à l'oselia_run, soit en utilisant le champs renseigné dans oselia_run_linked_to_param_field_name, soit en utilisant le champs du param._type qui est lié au type oselia_run
     */

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
     * Lier le param à l'oselia_run
     * @default true
     */
    public oselia_run_linked_to_param: boolean;

    /**
     * Nom du champ du param qui contient l'id de l'oselia_run dans le param (si oselia_run_linked_to_param est true)
     * @default null mais on chargera automatiquement le champ du param._type qui est lié au type oselia_run
     */
    public oselia_run_linked_to_param_field_name: string;

    // /**
    //  * Dans le cadre d'un throttling, est-ce qu'on appel le cb dès le premier event, ou on applique le cooldown d'abord
    //  *  A priori par défaut false
    //  * Celà dit, si on a un cooldown de 0, ça revient au même
    //  */
    // public throttle_first_call: boolean;

    // /**
    //  * Dans le cadre d'un throttling, est-ce qu'on appel le cb après le dernier event si celui-ci a eu lieu pendant le dernier cb
    //  *  A priori par défaut true
    //  */
    // public throttle_last_call: boolean;

    /**
     * Module qui contient le callback
     */
    public cb_module_name: string;

    /**
     * Nom de la fonction de callback
     */
    public cb_function_name: string;



    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;

    public static from_instance(instance: EventifyEventListenerInstanceVO): EventifyEventListenerConfVO {
        const res: EventifyEventListenerConfVO = new EventifyEventListenerConfVO();

        res.name = instance.name;
        res.cb_function_name = instance.cb_function_name;
        res.event_conf_id = instance.event_conf_id;
        res.event_conf_name = instance.event_conf_name;
        res.max_calls = instance.unlimited_calls ? 0 : (instance.remaining_calls + 1); // Pas dingue ça mais j'ai pas mieux
        res.cooldown_ms = instance.cooldown_ms;
        res.throttled = instance.throttled;
        res.run_as_soon_as_possible_event_conf_id = instance.run_as_soon_as_possible_event_conf_id;
        res.is_bgthread = instance.is_bgthread;
        res.debounce_leading = instance.debounce_leading;
        res.param_type = instance.param_type;
        res.oselia_run_template_name = instance.oselia_run_template_name;
        res.oselia_run_param_cache_key = instance.oselia_run_param_cache_key;
        res.oselia_run_link_to_event = instance.oselia_run_link_to_event;
        res.oselia_run_link_to_listener = instance.oselia_run_link_to_listener;
        res.oselia_run_linked_to_param = instance.oselia_run_linked_to_param;
        res.oselia_run_linked_to_param_field_name = instance.oselia_run_linked_to_param_field_name;
        res.cb_module_name = instance.cb_module_name;
        res.cb_function_name = instance.cb_function_name;

        return res;
    }

    /**
     * On génère une conf de listener pour l'event passé en paramètre
     * On se mais en throttle, stack param par défaut
     * Le cooldown est en pj
     * @param event
     * @param oselia_run_template_name
     * @returns
     */
    public static get_new_listener_conf_for_oselia_run_template(
        event: EventifyEventConfVO,
        oselia_run_template_name: string,
        cooldown_ms: number = 1000, // on laisse une seconde entre chaque appel par défaut, on devrait pas être sur des comportements temps réel sur osélia
        cache_param_name: string = "PARAM",
        oselia_run_linked_to_param_field_name: string = null,
    ): EventifyEventListenerConfVO {
        const res: EventifyEventListenerConfVO = new EventifyEventListenerConfVO();

        res.cb_module_name = ModuleOselia.getInstance().name;
        res.cb_function_name = reflect<ModuleOselia>().instantiate_oselia_run_from_event;
        res.cooldown_ms = cooldown_ms;
        res.debounce_leading = false;
        res.event_conf_id = event.id;
        res.event_conf_name = event.name;
        res.is_bgthread = false;
        res.max_calls = 0;
        res.name = "on event '" + event.name + "' instantiate oselia_run '" + oselia_run_template_name + "'";
        res.param_type = EventifyEventListenerConfVO.PARAM_TYPE_STACK;
        res.oselia_run_link_to_event = true;
        res.oselia_run_link_to_listener = true;
        res.oselia_run_linked_to_param = true;
        res.oselia_run_template_name = oselia_run_template_name;
        res.oselia_run_param_cache_key = cache_param_name;
        res.oselia_run_linked_to_param_field_name = oselia_run_linked_to_param_field_name;
        res.throttled = true;

        return res;
    }
}
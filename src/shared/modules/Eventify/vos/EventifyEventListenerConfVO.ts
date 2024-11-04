import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class EventifyEventListenerConfVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "eventify_event_listener_conf";

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
}
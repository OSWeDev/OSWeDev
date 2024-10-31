import ModuleServerBase from '../../../../server/modules/ModuleServerBase';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import IDistantVOBase from '../../IDistantVOBase';
import ModulesManager from '../../ModulesManager';

export default class EventifyEventListenerInstanceVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "eventify_event_listener_instance";
    public static UID: number = 0;

    public id: number;
    public _type: string = EventifyEventListenerInstanceVO.API_TYPE_ID;

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

    // /**
    //  * Dans le cadre d'un throttling, est-ce qu'on appel le cb dès le premier event, ou on applique le cooldown d'abord
    //  *  A priori par défaut false
    //  * Celà dit, si on a un cooldown de 0, ça revient au même
    //  */
    // public throttle_first_call: boolean;

    // /**
    //  * Dans le cadre d'un throttling, est-ce qu'on appel le cb après le dernier event si celui-ci a eu lieu pendant le dernier cb (ou dans le cooldown après le dernier cb)
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
     * On a besoin de la date de fin du dernier appel pour gérer le throttling en ms
     */
    public last_cb_run_end_date_ms: number;

    private _cb: () => Promise<any>;

    get cb(): () => Promise<any> {

        return this.initial_getter_cb();
    }

    public static get_uid(name: string): string {
        return name + '_' + EventifyEventListenerInstanceVO.UID++;
    }

    private initial_getter_cb(): () => Promise<any> {

        if (this._cb == null) {
            try {
                const m = ModulesManager.getModuleByNameAndRole(this.cb_module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME);
                this._cb = m[this.cb_function_name].bind(m);
            } catch (error) {
                ConsoleHandler.error('Error while getting cb for EventifyEventListenerInstanceVO ' + this.id + ' : ' + error);
                throw error;
            }
        }

        return this._cb;
    }

}
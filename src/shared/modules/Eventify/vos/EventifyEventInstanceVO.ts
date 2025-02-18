import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';
import EventifyEventConfVO from './EventifyEventConfVO';

export default class EventifyEventInstanceVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "eventify_event_instance";
    public static UID: number = 0;

    public id: number;
    public _type: string = EventifyEventInstanceVO.API_TYPE_ID;

    /**
     * Nom unique de l'évènement, permettant de s'y référer
     */
    public name: string;

    /**
     * UID de l'instance
     */
    public instance_uid: string;

    public event_conf_id: number;

    /**
     * Date d'émission de l'évènement (en ms)
     */
    public emission_date_ms: number;

    /**
     * Le paramètre de l'évènement - un objet, ou un type primitif
     */
    public param: unknown;

    public static instantiate(event_conf: EventifyEventConfVO, param: unknown = null): EventifyEventInstanceVO {
        const res: EventifyEventInstanceVO = new EventifyEventInstanceVO();

        res.event_conf_id = event_conf.id;
        res.name = event_conf.name;
        res.instance_uid = event_conf.name + '_' + (EventifyEventInstanceVO.UID++);
        res.emission_date_ms = Dates.now_ms();
        res.param = param;
        return res;
    }

    public static new_event(event_name: string, param: unknown = null): EventifyEventInstanceVO {
        const res: EventifyEventInstanceVO = new EventifyEventInstanceVO();

        res.event_conf_id = null;
        res.name = event_name;
        res.instance_uid = event_name + '_' + (EventifyEventInstanceVO.UID++);
        res.emission_date_ms = Dates.now_ms();
        res.param = param;
        return res;
    }
}
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

    public static instantiate(event_conf: EventifyEventConfVO) {
        const res: EventifyEventInstanceVO = new EventifyEventInstanceVO();

        res.event_conf_id = event_conf.id;
        res.name = event_conf.name;
        res.instance_uid = event_conf.name + '_' + (EventifyEventInstanceVO.UID++);
        return res;
    }
}
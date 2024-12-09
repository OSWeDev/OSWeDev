import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class EventifyEventConfVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "eventify_event_conf";

    public id: number;
    public _type: string = EventifyEventConfVO.API_TYPE_ID;

    /**
     * Nom unique de l'évènement, permettant de s'y référer
     */
    public name: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
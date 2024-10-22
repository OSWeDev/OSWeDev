import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class EventifyActionGroupVO implements IDistantVOBase {//, IVersionedVO
    public static API_TYPE_ID: string = "eventify_action_group";

    public id: number;
    public _type: string = EventifyActionGroupVO.API_TYPE_ID;

    public name: string;
    public description: string;

    public group_current_state: number;

    // Est-ce que l'action est versioned ? on veut surtout versioned le template, mais l'instantiation de l'action, on s'en fout non ?
    // public parent_id: number;
    // public trashed: boolean;
    // public version_num: number;
    // public version_author_id: number;
    // public version_timestamp: number;
    // public version_edit_author_id: number;
    // public version_edit_timestamp: number;
}
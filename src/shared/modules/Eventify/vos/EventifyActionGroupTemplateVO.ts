import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class EventifyActionGroupTemplateVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "eventify_action_group_template";

    public id: number;
    public _type: string = EventifyActionGroupTemplateVO.API_TYPE_ID;

    public name: string;
    public description: string;

    // Est-ce que le splitter c'est pas plutôt une action à laquelle soit on impose un splitt, soit on propose la possibilité de splitter sans forcer, et qui se transforme alors en groupe, et crée des actions ?
    // public use_oselia_splitter: boolean;
    // public oselia_splitter_assistant_id: number;
    // public oselia_splitter_prompt_id: number;
    // public oselia_splitter_prompt_parameters: string;
    // public oselia_splitter_prompt_content: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
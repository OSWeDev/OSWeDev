import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class ChatModalUserVO implements IDistantVOBase, IVersionedVO {

    public static API_TYPE_ID: string = "chat_modal_usr";

    public id: number;
    public _type: string = ChatModalUserVO.API_TYPE_ID;

    public name: string;
    public user_id: number;

    public avatar_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
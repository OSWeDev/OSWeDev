import IDistantVOBase from '../../IDistantVOBase';

export default class ChatModalMessageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "chat_modal_msg";

    public id: number;
    public _type: string = ChatModalMessageVO.API_TYPE_ID;

    public thread_id: number;

    public content: string;
    public user_id: number;

    public creation_date_sec: number;
}
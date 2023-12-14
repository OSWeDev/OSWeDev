import IDistantVOBase from '../../IDistantVOBase';

export default class ChatModalMessageFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "chat_modal_msg_file";

    public id: number;
    public _type: string = ChatModalMessageFileVO.API_TYPE_ID;

    public message_id: number;
    public file_id: number;
    public file_url: string;
}
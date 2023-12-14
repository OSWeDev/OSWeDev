import IDistantVOBase from '../../IDistantVOBase';

export default class ChatModalMessageImageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "chat_modal_msg_img";

    public id: number;
    public _type: string = ChatModalMessageImageVO.API_TYPE_ID;

    public message_id: number;
    public image_id: number;
    public image_url: string;
}
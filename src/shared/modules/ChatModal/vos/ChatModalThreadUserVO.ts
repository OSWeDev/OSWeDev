import IDistantVOBase from '../../IDistantVOBase';

export default class ChatModalThreadUserVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "chat_modal_thrd_usr";

    public id: number;
    public _type: string = ChatModalThreadUserVO.API_TYPE_ID;

    public thread_id: number;
    public user_id: number;
}
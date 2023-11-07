import IDistantVOBase from '../../IDistantVOBase';

export default class ChatModalMessageReplyOptionVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "chat_modal_msg_rpl_opt";

    public id: number;
    public _type: string = ChatModalMessageReplyOptionVO.API_TYPE_ID;

    public message_id: number;

    public translatable_code_text: string;

    public callback_module_name: string;
    public callback_api_name: string;

    /**
     * Un JSON libre paramétré par le système qui génère cette option, et qu'on retrouvera dans le callback
     */
    public params: string;
}
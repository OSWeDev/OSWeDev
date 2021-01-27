import IForkMessage from '../interfaces/IForkMessage';

export default class BGThreadProcessTaskForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "BGThreadProcessTask";

    public message_type: string = BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE;

    /**
     * @param bgthread le nom du bgthread ciblé
     * @param message_content UID de la task
     * @param message_content_params Params (tableau)
     */
    public constructor(public bgthread: string, public message_content: string, public message_content_params: any, public callback_id: string = null) { }
}
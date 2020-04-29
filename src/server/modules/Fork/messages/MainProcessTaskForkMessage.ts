import IForkMessage from '../interfaces/IForkMessage';

export default class MainProcessTaskForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "MainProcessTask";

    public message_type: string = MainProcessTaskForkMessage.FORK_MESSAGE_TYPE;

    /**
     * @param message_content UID de la task
     * @param message_content_params Params (tableau)
     */
    public constructor(public message_content: string, public message_content_params: any) { }
}
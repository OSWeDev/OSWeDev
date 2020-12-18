import IForkMessage from '../interfaces/IForkMessage';

export default class PingForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "Ping";

    public message_type: string = PingForkMessage.FORK_MESSAGE_TYPE;
    public message_content: any = null;

    public constructor() { }
}
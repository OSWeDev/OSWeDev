import IForkMessage from '../interfaces/IForkMessage';

export default class BroadcastWrapperForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "BroadcastWrapper";

    public message_type: string = BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: IForkMessage) { }
}
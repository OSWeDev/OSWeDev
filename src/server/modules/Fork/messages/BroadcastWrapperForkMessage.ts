import { threadId } from 'worker_threads';
import IForkMessage from '../interfaces/IForkMessage';

export default class BroadcastWrapperForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "BroadcastWrapper";

    public message_type: string = BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE;

    public ignore_sender: boolean = false;
    public sender_uid: number = null;

    public constructor(public message_content: IForkMessage) { }

    public except_self(): BroadcastWrapperForkMessage {
        this.ignore_sender = true;
        this.sender_uid = threadId;
        return this;
    }
}
import { threadId } from 'worker_threads';
import IForkMessage from '../interfaces/IForkMessage';

export default class AliveForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "Alive";

    public message_type: string = AliveForkMessage.FORK_MESSAGE_TYPE;
    public message_content: any = threadId;

    public constructor() { }
}
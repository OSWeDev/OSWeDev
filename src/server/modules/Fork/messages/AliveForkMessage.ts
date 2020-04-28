import IForkMessage from '../interfaces/IForkMessage';
import ForkedProcessWrapperBase from '../ForkedProcessWrapperBase';

export default class AliveForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "Alive";

    public message_type: string = AliveForkMessage.FORK_MESSAGE_TYPE;
    public message_content: any = ForkedProcessWrapperBase.getInstance().process_UID;

    public constructor() { }
}
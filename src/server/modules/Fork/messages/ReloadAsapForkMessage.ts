import ForkedProcessWrapperBase from '../ForkedProcessWrapperBase';
import IForkMessage from '../interfaces/IForkMessage';

export default class ReloadAsapForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "RELOAD_ASAP";

    public message_type: string = ReloadAsapForkMessage.FORK_MESSAGE_TYPE;
    public message_content: any = ForkedProcessWrapperBase.getInstance().process_UID;

    /**
     * Reload asap le forked_target.uid si coupé qui est dans le message
     */
    public constructor() { }
}
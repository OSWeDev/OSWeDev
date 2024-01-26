import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class UnRegisterIORoomsThreadMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "UNREGISTER_IO_ROOMS";

    public message_type: string = UnRegisterIORoomsThreadMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: string[]) { }
}
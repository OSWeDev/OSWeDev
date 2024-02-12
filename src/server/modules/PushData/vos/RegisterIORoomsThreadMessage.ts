import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class RegisterIORoomsThreadMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "REGISTER_IO_ROOMS";

    public message_type: string = RegisterIORoomsThreadMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: string[]) { }
}
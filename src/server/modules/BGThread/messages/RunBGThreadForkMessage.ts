import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class RunBGThreadForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "RUN_BGTHREAD";

    public message_type: string = RunBGThreadForkMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: string) { }
}
import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class RunCronForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "RUN_CRON";

    public message_type: string = RunCronForkMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: string) { }
}
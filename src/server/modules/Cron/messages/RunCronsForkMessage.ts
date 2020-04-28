import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class RunCronsForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "RUN_CRONS";

    public message_type: string = RunCronsForkMessage.FORK_MESSAGE_TYPE;
    public message_content: any = null;

    public constructor() { }
}
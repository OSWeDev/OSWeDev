import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class UpdatePerfConfsForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "UpdatePerfConfs";

    public message_type: string = UpdatePerfConfsForkMessage.FORK_MESSAGE_TYPE;
    public message_content: any = null;

    public constructor() { }
}
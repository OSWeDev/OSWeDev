import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class ServerAnonymizationReloadConfMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "RELOAD_ANONYMIZATION_CONF";

    public message_type: string = ServerAnonymizationReloadConfMessage.FORK_MESSAGE_TYPE;
    public message_content: any = null;

    public constructor() { }
}
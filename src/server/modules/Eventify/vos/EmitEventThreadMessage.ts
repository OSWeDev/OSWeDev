import EventifyEventInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class EmitEventThreadMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "EMIT_EVENT";

    public message_type: string = EmitEventThreadMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: EventifyEventInstanceVO) { }
}
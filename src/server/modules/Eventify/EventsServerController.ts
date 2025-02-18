import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import ForkMessageController from '../Fork/ForkMessageController';
import EmitEventThreadMessage from './vos/EmitEventThreadMessage';

export default class EventsServerController {

    /**
     * On envoie l'event à tous les threads pour qu'ils le gèrent localement
     * @param event
     */
    public static async broadcast_event(event: EventifyEventInstanceVO) {
        return ForkMessageController.broadcast(new EmitEventThreadMessage(event));
    }

    public static emit_event_thread_messsage_handler(message: EmitEventThreadMessage) {
        EventsController.emit_event(message.message_content);
    }
}
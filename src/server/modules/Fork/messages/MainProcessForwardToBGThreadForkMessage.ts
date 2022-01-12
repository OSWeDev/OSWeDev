import IForkMessage from '../interfaces/IForkMessage';

export default class MainProcessForwardToBGThreadForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "MainProcessForwardToBGThread";

    public message_type: string = MainProcessForwardToBGThreadForkMessage.FORK_MESSAGE_TYPE;

    /**
     * @param message_content UID de la task
     * @param message_content_params Params (tableau)
     * @param callback_id permet de récupérer le résultat de l'éxécution via un message retour
     */
    public constructor(public bgthread: string, public message_content: string, public message_content_params: any, public callback_id: string = null) { }
}
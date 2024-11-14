import IForkMessage from '../interfaces/IForkMessage';

export default class MainProcessTaskForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "MainProcessTask";

    public message_type: string = MainProcessTaskForkMessage.FORK_MESSAGE_TYPE;

    /**
     * @param message_content UID de la task
     * @param message_content_params Params (tableau)
     * @param callback_id permet de récupérer le résultat de l'éxécution via un message retour
     */
    public constructor(
        public message_content: string,
        public message_content_params: any,

        public stack_context: { [key: string]: string | boolean | number }, // Pour maintenir le contexte actif dans l'autre thread

        public callback_forked_uid: number = null,
        public callback_id: string = null
    ) { }
}
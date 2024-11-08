import IForkMessage from '../interfaces/IForkMessage';

export default class TaskResultForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "TaskResult";

    public message_type: string = TaskResultForkMessage.FORK_MESSAGE_TYPE;

    /**
     * @param callback_id permet de récupérer le résultat de l'éxécution via un message retour
     * @param message_content
     * @param forked_uid permet de savoir à qui renvoyer le message. null pour le main thread
     */
    public constructor(public message_content: any, public callback_forked_uid: number, public callback_id: string, public throw_error: string = null) { }
}
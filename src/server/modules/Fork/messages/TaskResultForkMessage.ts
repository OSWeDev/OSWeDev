import IForkMessage from '../interfaces/IForkMessage';

export default class TaskResultForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "TaskResult";

    public message_type: string = TaskResultForkMessage.FORK_MESSAGE_TYPE;

    /**
     * @param callback_id permet de récupérer le résultat de l'éxécution via un message retour
     */
    public constructor(public message_content: any, public callback_id: string) { }
}
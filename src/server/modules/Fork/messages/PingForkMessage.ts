import IForkMessage from '../interfaces/IForkMessage';

export default class PingForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "Ping";

    public message_type: string = PingForkMessage.FORK_MESSAGE_TYPE;

    /**
     * On envoie l'id du thread par le ping et on attend qu'il nous le renvoie
     *  Si on a une erreur dans l'envoi des msgs et que le dernier ping est plus de 30 secondes, on sait qu'on doit redémarrer le thread
     * @param message_content l'id du thread ciblé par le ping
     */
    public constructor(public message_content: any) { }
}
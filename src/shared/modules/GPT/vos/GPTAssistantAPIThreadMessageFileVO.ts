
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIThreadMessageFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_message_file";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID;

    public thread_message_id: number;
    public file_id: number;

    // Si on a choisi de modifier un message par exemple, on l'archive, ce qui signifie que dans la synchro avec openai, on supprime le message côté openai, et la liaison avec nous
    public archived: boolean;
}

import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIThreadVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread";

    public id: number;
    public _type: string = GPTAssistantAPIThreadVO.API_TYPE_ID;

    public user_id: number;

    public gpt_thread_id: string;
    public current_default_assistant_id: number;

    /**
     * Un run est en cours sur ce thread
     */
    public oselia_is_running: boolean;

    /**
     * L'assistant qui est en train de répondre
     */
    public current_oselia_assistant_id: number;

    /**
     * Le prompt auquel l'assistant est en train de répondre
     */
    public current_oselia_prompt_id: number;
}
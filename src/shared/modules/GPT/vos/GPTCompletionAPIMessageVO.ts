
import { ChatCompletionMessageParam, ChatCompletionRole } from 'openai/resources';
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTCompletionAPIMessageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_completion_msg";

    public static GPTMSG_ROLE_TYPE_LABELS: string[] = [
        'system',
        'user',
        'assistant',
        'function',
        'tool'
    ];
    public static GPTMSG_ROLE_TYPE_SYSTEM: number = 0;
    public static GPTMSG_ROLE_TYPE_USER: number = 1;
    public static GPTMSG_ROLE_TYPE_ASSISTANT: number = 2;
    public static GPTMSG_ROLE_TYPE_FUNCTION: number = 3;
    public static GPTMSG_ROLE_TYPE_TOOL: number = 4;

    public static createNew(
        role_type: number,
        user_id: number,
        content: string): GPTCompletionAPIMessageVO {

        let res: GPTCompletionAPIMessageVO = new GPTCompletionAPIMessageVO();

        res.role_type = role_type;
        res.user_id = user_id;
        res.content = content;
        res.date = Dates.now();

        return res;
    }

    public id: number;
    public _type: string = GPTCompletionAPIMessageVO.API_TYPE_ID;


    public role_type: number;
    public user_id: number;
    public content: string;

    public conversation_id: number;

    public date: number;

    public to_GPT_ChatCompletionMessageParam(): ChatCompletionMessageParam {

        let res: ChatCompletionMessageParam = {
            content: this.content,
            role: GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_LABELS[this.role_type] as ChatCompletionRole,
        } as ChatCompletionMessageParam;

        return res;
    }
}
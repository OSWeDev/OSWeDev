
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTMessageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_msg";

    public static GPTMSG_ROLE_TYPE_LABELS: string[] = [
        'gpt_msg.GPTMSG_ROLE_TYPE_SYSTEM',
        'gpt_msg.GPTMSG_ROLE_TYPE_USER',
        'gpt_msg.GPTMSG_ROLE_TYPE_ASSISTANT'
    ];

    public static GPTMSG_ROLE_TYPE_SYSTEM: number = 0;
    public static GPTMSG_ROLE_TYPE_USER: number = 1;
    public static GPTMSG_ROLE_TYPE_ASSISTANT: number = 2;

    public static createNew(
        role_type: number,
        user_id: number,
        content: string): GPTMessageVO {

        let res: GPTMessageVO = new GPTMessageVO();

        res.role_type = role_type;
        res.user_id = user_id;
        res.content = content;
        res.date = Dates.now();

        return res;
    }

    public id: number;
    public _type: string = GPTMessageVO.API_TYPE_ID;


    public role_type: number;
    public user_id: number;
    public content: string;

    public date: number;
}

import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';
import AbstractVO from '../../VO/abstract/AbstractVO';

export default class BardMessageVO extends AbstractVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "bard_msg";

    public static BARD_MSG_ROLE_TYPE_LABELS: string[] = [
        'bard_msg.BARD_MSG_ROLE_TYPE_SYSTEM',
        'bard_msg.BARD_MSG_ROLE_TYPE_USER',
        'bard_msg.BARD_MSG_ROLE_TYPE_ASSISTANT'
    ];

    public static BARD_MSG_ROLE_TYPE_SYSTEM: number = 0;
    public static BARD_MSG_ROLE_TYPE_USER: number = 1;
    public static BARD_MSG_ROLE_TYPE_ASSISTANT: number = 2;

    public static createNew(
        role_type: number,
        user_id: number,
        content: string
    ): BardMessageVO {

        let res: BardMessageVO = new BardMessageVO();

        res.role_type = role_type;
        res.user_id = user_id;
        res.content = content;
        res.date = Dates.now();

        return res;
    }

    public id: number;
    public _type: string = BardMessageVO.API_TYPE_ID;


    public role_type: number;
    public user_id: number;
    public conversation_id: number;
    public content: string;

    public date: number;
}
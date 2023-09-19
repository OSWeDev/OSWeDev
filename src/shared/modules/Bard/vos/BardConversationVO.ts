
import IDistantVOBase from '../../IDistantVOBase';
import AbstractVO from '../../VO/abstract/AbstractVO';
import GPTMessageVO from './BardMessageVO';

export default class BardConversationVO extends AbstractVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "bard_conversation";

    public id: number;
    public _type: string = BardConversationVO.API_TYPE_ID;


    public messages: GPTMessageVO[];
}
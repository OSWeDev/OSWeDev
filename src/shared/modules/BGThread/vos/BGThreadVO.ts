
import IDistantVOBase from '../../IDistantVOBase';
import INamedVO from '../../../interfaces/INamedVO';

export default class BGThreadVO implements IDistantVOBase, INamedVO {
    public static API_TYPE_ID: string = "bgthread";

    public id: number;
    public _type: string = BGThreadVO.API_TYPE_ID;

    public name: string;
    public last_up_date: Moment;
}
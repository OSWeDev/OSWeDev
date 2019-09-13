import { Moment } from 'moment';
import INamedVO from '../../../interfaces/INamedVO';
import IDistantVOBase from '../../IDistantVOBase';

export default class ParamVO implements IDistantVOBase, INamedVO {
    public static API_TYPE_ID: string = "param";

    public id: number;
    public _type: string = ParamVO.API_TYPE_ID;

    public name: string;
    public value: string;
    public last_up_date: Moment;
}
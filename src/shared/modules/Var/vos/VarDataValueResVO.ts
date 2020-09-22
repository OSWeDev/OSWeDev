import { Moment } from 'moment';

export default class VarDataValueResVO {
    public static API_TYPE_ID: string = "vdvr";

    public id: number;

    public _type: string = VarDataValueResVO.API_TYPE_ID;
    public index: string;

    public value: number;
    public value_type: number;
    public value_ts: Moment;

    public constructor() { }
}
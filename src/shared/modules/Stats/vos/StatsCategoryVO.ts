
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsCategoryVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_category";

    public id: number;
    public _type: string = StatsCategoryVO.API_TYPE_ID;

    public name: string;
}
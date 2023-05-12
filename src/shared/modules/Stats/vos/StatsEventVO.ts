
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsEventVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_event";

    public id: number;
    public _type: string = StatsEventVO.API_TYPE_ID;

    public name: string;
    public sub_category_id: number;
}
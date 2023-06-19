
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsSubCategoryVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_subcategory";

    public id: number;
    public _type: string = StatsSubCategoryVO.API_TYPE_ID;

    public name: string;
    public category_id: number;
}
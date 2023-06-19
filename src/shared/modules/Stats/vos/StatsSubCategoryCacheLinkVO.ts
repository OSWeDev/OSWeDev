
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsSubCategoryCacheLinkVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_subcategory_cache_link";

    public id: number;
    public _type: string = StatsSubCategoryCacheLinkVO.API_TYPE_ID;

    public name: string;
    public category_name: string;
}
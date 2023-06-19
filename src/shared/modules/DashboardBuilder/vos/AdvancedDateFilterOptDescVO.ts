import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import TSRange from "../../DataRender/vos/TSRange";
import IDistantVOBase from "../../IDistantVOBase";

export default class AdvancedDateFilterOptDescVO implements IDistantVOBase, IWeightedItem {

    public static API_TYPE_ID: string = "adfod_desc";

    public static SEARCH_TYPE_LAST: number = 1;
    public static SEARCH_TYPE_CALENDAR: number = 2;
    public static SEARCH_TYPE_CUSTOM: number = 3;
    public static SEARCH_TYPE_YTD: number = 4;
    public static SEARCH_TYPE_LABELS: { [id: number]: string } = {
        [AdvancedDateFilterOptDescVO.SEARCH_TYPE_LAST]: "adfd_desc.search_type.last",
        [AdvancedDateFilterOptDescVO.SEARCH_TYPE_CALENDAR]: "adfd_desc.search_type.calendar",
        [AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM]: "adfd_desc.search_type.custom",
        [AdvancedDateFilterOptDescVO.SEARCH_TYPE_YTD]: "adfd_desc.search_type.ytd",
    };

    public id: number;
    public _type: string = AdvancedDateFilterOptDescVO.API_TYPE_ID;

    public weight: number;

    public name: string;
    public value: number;
    public ts_range: TSRange;
    public search_type: number;
    public segmentation_type: number;
}
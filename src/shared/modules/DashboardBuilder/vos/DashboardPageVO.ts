import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import IDashboardPageVO from "../interfaces/IDashboardPageVO";

export default class DashboardPageVO implements IDashboardPageVO, IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_page";

    public _type: string = DashboardPageVO.API_TYPE_ID;

    public id: number;

    public dashboard_id: number;

    public weight: number;

    public hide_navigation: boolean;

    public group_filters: boolean;
    public collapse_filters: boolean;

    public group_filters_title: string;
    public title: string;
    public description: string;
}
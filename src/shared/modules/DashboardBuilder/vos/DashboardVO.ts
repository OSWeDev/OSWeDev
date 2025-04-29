import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";

export default class DashboardVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard";

    public _type: string = DashboardVO.API_TYPE_ID;

    public id: number;

    public cycle_tables: string[];
    public cycle_fields: { [voType: string]: string[] };
    public cycle_links: { [voType: string]: string[] };
    public has_cycle: boolean;

    public weight: number;

    public is_cms_compatible: boolean;

    public title: string;
    public description: string;
}
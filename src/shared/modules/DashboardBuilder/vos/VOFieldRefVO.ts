import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";

export default class VOFieldRefVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "vo_field_ref";

    public id: number;
    public _type: string = VOFieldRefVO.API_TYPE_ID;

    get translatable_name_code_text(): string {
        return DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.id;
    }

    public api_type_id: string;
    public field_id: string;

    public weight: number;
}
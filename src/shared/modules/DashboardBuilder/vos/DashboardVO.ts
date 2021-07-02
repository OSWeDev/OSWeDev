import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import DashboardBuilderController from "../DashboardBuilderController";

export default class DashboardVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard";

    public id: number;
    public _type: string = DashboardVO.API_TYPE_ID;

    get translatable_name_code_text(): string {
        return DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + this.id;
    }
}
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import IDistantVOBase from "../../IDistantVOBase";
import DashboardBuilderController from "../DashboardBuilderController";

export default class TableColumnDescVO implements IDistantVOBase, IWeightedItem {

    public static API_TYPE_ID: string = "table_column_desc";

    public static TYPE_LABELS: string[] = [
        "table_column_desc.type.crud_actions",
        "table_column_desc.type.vo_field_ref",
        "table_column_desc.type.var_ref",
        "table_column_desc.type.select_box",
    ];
    public static TYPE_crud_actions: number = 0;
    public static TYPE_vo_field_ref: number = 1;
    public static TYPE_var_ref: number = 2;
    public static TYPE_select_box: number = 3;

    public id: number;
    public _type: string = TableColumnDescVO.API_TYPE_ID;

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }
        return DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.id;
    }

    public page_widget_id: number;

    public type: number;

    /**
     * Si TYPE_vo_field_ref
     */
    public api_type_id: string;
    public field_id: string;

    /**
     * Si TYPE_var_ref
     */
    public var_id: number;

    /**
     * Si TYPE_vo_field_ref || TYPE_var_ref
     */
    public filter_type: string;
    public filter_additional_params: string;

    public weight: number;
}
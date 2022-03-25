import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import IDistantVOBase from "../../IDistantVOBase";
import ModuleTableField from "../../ModuleTableField";
import VOsTypesManager from "../../VOsTypesManager";
import DashboardBuilderController from "../DashboardBuilderController";

export default class TableColumnDescVO implements IDistantVOBase, IWeightedItem {

    public static API_TYPE_ID: string = "table_column_desc";

    public static TYPE_LABELS: string[] = [
        "table_column_desc.type.crud_actions",
        "table_column_desc.type.vo_field_ref",
        "table_column_desc.type.var_ref",
        "table_column_desc.type.select_box",
        "table_column_desc.type.component",
    ];
    public static TYPE_crud_actions: number = 0;
    public static TYPE_vo_field_ref: number = 1;
    public static TYPE_var_ref: number = 2;
    public static TYPE_select_box: number = 3;
    public static TYPE_component: number = 4;

    get translatable_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        if (!this.type) {
            return null;
        }

        return DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.page_widget_id + '.' + this.type + '.' +
            ((this.type == TableColumnDescVO.TYPE_crud_actions) ? '_' :
                ((this.type == TableColumnDescVO.TYPE_vo_field_ref) ? this.api_type_id + '.' + this.field_id :
                    ((this.type == TableColumnDescVO.TYPE_var_ref) ? this.var_id :
                        ((this.type == TableColumnDescVO.TYPE_select_box) ? '_' : this.component_name
                        )
                    )
                )
            );
    }

    public id: number;
    public _type: string = TableColumnDescVO.API_TYPE_ID;

    public page_widget_id: number;

    public type: number;

    public column_width: number;

    /**
     * On filtre par un droit d'accès (le nom du droit en l'occurrence)
     */
    public filter_by_access: string;

    /**
     * Pour la mise en forme des enum
     */
    public enum_bg_colors: { [value: number]: string };
    public enum_fg_colors: { [value: number]: string };

    /**
     * Si TYPE_vo_field_ref
     */
    public api_type_id: string;
    public field_id: string;

    get datatable_field_uid() {
        return (this.type == TableColumnDescVO.TYPE_crud_actions) ? '__crud_actions' : this.api_type_id + '___' + this.field_id;
    }

    /**
     * Si TYPE_component
     */
    public component_name: string;

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

    public readonly: boolean;

    /**
     * Permet de cacher des colonnes dans les exports, par exemple les colonnes logAs sur la base des utilisateurs
     */
    public exportable: boolean;

    /**
     * Permet de cacher des colonnes dans les tableaux (pour exporter des colonnes cachées par exemple)
     */
    public hide_from_table: boolean;

    get is_enum(): boolean {
        if ((!this) || (!this.api_type_id) || (!this.field_id)) {
            return false;
        }

        if (this.type != TableColumnDescVO.TYPE_vo_field_ref) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.api_type_id].getFieldFromId(this.field_id);
        if (!field) {
            return false;
        }

        return (field.field_type == ModuleTableField.FIELD_TYPE_enum);
    }
}
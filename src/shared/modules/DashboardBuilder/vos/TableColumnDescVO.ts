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
        "table_column_desc.type.header",
    ];
    public static TYPE_crud_actions: number = 0;
    public static TYPE_vo_field_ref: number = 1;
    public static TYPE_var_ref: number = 2;
    public static TYPE_select_box: number = 3;
    public static TYPE_component: number = 4;
    public static TYPE_header: number = 5;

    public static SORT_asc: number = 0;
    public static SORT_desc: number = 1;


    public id: number;
    public _type: string = TableColumnDescVO.API_TYPE_ID;

    public type: number;

    public column_width: number;
    public default_sort_field: number;

    /**
     * Paramétrage permettant de rendre visible une colonne uniquement si l'un des filtres est actif
     */
    public show_if_any_filter_active: number[];

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
        switch (this.type) {
            case TableColumnDescVO.TYPE_crud_actions:
                return 'crud_actions';
            case TableColumnDescVO.TYPE_vo_field_ref:
                return this.api_type_id + '___' + this.field_id;
            case TableColumnDescVO.TYPE_var_ref:
                return this.var_id + '___' + this.var_unicity_id;
            case TableColumnDescVO.TYPE_select_box:
                return 'select_box';
            case TableColumnDescVO.TYPE_component:
                return this.component_name;
            case TableColumnDescVO.TYPE_header:
                return this.header_name;
        }
    }
    /**
     * Si TYPE_header
     */
    public header_name: string;
    public children: TableColumnDescVO[] = [];
    /**
     * Si TYPE_component
     */
    public component_name: string;

    /**
     * Si TYPE_var_ref
     */
    public var_id: number;
    /**
     * A initialiser à Dates.now() pour que la colonne soit unique (et qu'on puisse avoir plusieurs fois le même var_id)
     */
    public var_unicity_id: number;

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

    /**
     * Permet le filtrage sur la valeur de cette colonne
     */
    public can_filter_by: boolean;

    /**
     * Permet de figer la colonne (tjrs visible)
     */
    public is_sticky: boolean;

    public bg_color_header: string;
    public font_color_header: string;

    public many_to_many_aggregate: boolean;
    public is_nullable: boolean;
    public show_tooltip: boolean;
    public disabled_many_to_one_link: boolean;

    /**
     * Filtrage des champs ts et (hour)
     */
    public filter_custom_field_filters: { [field_id: string]: string };

    get is_enum(): boolean {
        if ((!this) || (!this.api_type_id) || (!this.field_id)) {
            return false;
        }

        if (this.type != TableColumnDescVO.TYPE_vo_field_ref) {
            return false;
        }

        let field = VOsTypesManager.moduleTables_by_voType[this.api_type_id].getFieldFromId(this.field_id);
        if (!field) {
            return false;
        }

        return (field.field_type == ModuleTableField.FIELD_TYPE_enum);
    }

    public get_translatable_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        if (!this.type) {
            return null;
        }

        let res: string = DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget_id + '.' + this.type + '.';

        if (this.type == TableColumnDescVO.TYPE_crud_actions) {
            res += "_";
        }

        if (this.type == TableColumnDescVO.TYPE_vo_field_ref) {
            res += this.api_type_id + '.' + this.field_id;
        }

        if (this.type == TableColumnDescVO.TYPE_var_ref) {
            res += this.var_id + '.' + this.var_unicity_id;
        }

        if (this.type == TableColumnDescVO.TYPE_select_box) {
            res += "_";
        }

        if (this.type == TableColumnDescVO.TYPE_component) {
            res += this.component_name;
        }

        if (this.type == TableColumnDescVO.TYPE_header) {
            res += this.header_name;
        }

        return res;
    }
}
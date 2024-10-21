import ModuleTableFieldVO from "../../DAO/vos/ModuleTableFieldVO";
import VarConfVO from "../../Var/vos/VarConfVO";
import ContextQueryInjectionCheckHandler from "../ContextQueryInjectionCheckHandler";
import ContextQueryFieldVO from "./ContextQueryFieldVO";
import SortByVO from "./SortByVO";

export default class ParameterizedQueryWrapperField {

    // nom de la table
    public api_type_id: string;

    // nom du field ciblé
    public field_id: string;

    public aggregator: number;

    // nom de la colonne après récupération de la base
    public row_col_alias: string;

    public operator: number;

    public operator_fields: ParameterizedQueryWrapperField[];

    public static_value: string;

    public static FROM_ContextQueryFieldVO(context_field: ContextQueryFieldVO): ParameterizedQueryWrapperField {
        const res = new ParameterizedQueryWrapperField();
        res.api_type_id = context_field.api_type_id;
        res.field_id = context_field.field_name;
        res.aggregator = context_field.aggregator;
        res.row_col_alias = context_field.alias ?? context_field.field_name;
        res.operator = context_field.operator;
        res.operator_fields = context_field.operator_fields ? context_field.operator_fields.map((field: ContextQueryFieldVO) => ParameterizedQueryWrapperField.FROM_ContextQueryFieldVO(field)) : null;
        res.static_value = ContextQueryInjectionCheckHandler.assert_api_type_id_format(context_field.static_value);

        return res;
    }

    public static FROM_ModuleTableFieldVO(field: ModuleTableFieldVO): ParameterizedQueryWrapperField {
        const res = new ParameterizedQueryWrapperField();
        res.api_type_id = field.module_table_vo_type;
        res.field_id = field.field_name;
        res.aggregator = null;
        res.row_col_alias = field.field_name;
        res.operator = null;
        res.operator_fields = null;
        res.static_value = null;

        return res;
    }

    public static get_id_field(vo_type: string): ParameterizedQueryWrapperField {
        const res = new ParameterizedQueryWrapperField();
        res.api_type_id = vo_type;
        res.field_id = 'id';
        res.aggregator = null;
        res.row_col_alias = 'id';
        res.operator = null;
        res.operator_fields = null;
        res.static_value = null;

        return res;
    }

    public static FROM_SortByVO(sort_by: SortByVO, sort_alias: string): ParameterizedQueryWrapperField {
        const res = new ParameterizedQueryWrapperField();
        res.api_type_id = sort_by.vo_type;
        res.field_id = sort_by.field_name;
        res.aggregator = (sort_by.sort_asc ? VarConfVO.MIN_AGGREGATOR : VarConfVO.MAX_AGGREGATOR);
        res.row_col_alias = sort_alias;
        res.operator = null;
        res.operator_fields = null;
        res.static_value = null;

        return res;
    }
}
/* istanbul ignore file : nothing to test in this VO */

import IDistantVOBase from '../../IDistantVOBase';

/**
 * Configuration for expression-based automatic variables
 * This allows defining variables using expressions like "sum(table.field)" instead of manual configuration
 */
export default class VarConfExpressionVO implements IDistantVOBase {

    /**
     * Type de variable d'expression - fonctions d'agrégation
     */
    public static EXPRESSION_TYPE_SUM: number = 0;
    public static EXPRESSION_TYPE_COUNT: number = 1;
    public static EXPRESSION_TYPE_AVG: number = 2;
    public static EXPRESSION_TYPE_MIN: number = 3;
    public static EXPRESSION_TYPE_MAX: number = 4;

    /**
     * Type de variable d'expression - opérations arithmétiques
     */
    public static EXPRESSION_TYPE_ADD: number = 10;
    public static EXPRESSION_TYPE_SUBTRACT: number = 11;
    public static EXPRESSION_TYPE_MULTIPLY: number = 12;
    public static EXPRESSION_TYPE_DIVIDE: number = 13;

    /**
     * Type de variable d'expression - référence simple
     */
    public static EXPRESSION_TYPE_FIELD_REF: number = 20;
    public static EXPRESSION_TYPE_VAR_REF: number = 21;

    public static EXPRESSION_TYPE_LABELS: { [id: number]: string } = {
        [VarConfExpressionVO.EXPRESSION_TYPE_SUM]: 'var_conf_expression.type.sum',
        [VarConfExpressionVO.EXPRESSION_TYPE_COUNT]: 'var_conf_expression.type.count',
        [VarConfExpressionVO.EXPRESSION_TYPE_AVG]: 'var_conf_expression.type.avg',
        [VarConfExpressionVO.EXPRESSION_TYPE_MIN]: 'var_conf_expression.type.min',
        [VarConfExpressionVO.EXPRESSION_TYPE_MAX]: 'var_conf_expression.type.max',
        [VarConfExpressionVO.EXPRESSION_TYPE_ADD]: 'var_conf_expression.type.add',
        [VarConfExpressionVO.EXPRESSION_TYPE_SUBTRACT]: 'var_conf_expression.type.subtract',
        [VarConfExpressionVO.EXPRESSION_TYPE_MULTIPLY]: 'var_conf_expression.type.multiply',
        [VarConfExpressionVO.EXPRESSION_TYPE_DIVIDE]: 'var_conf_expression.type.divide',
        [VarConfExpressionVO.EXPRESSION_TYPE_FIELD_REF]: 'var_conf_expression.type.field_ref',
        [VarConfExpressionVO.EXPRESSION_TYPE_VAR_REF]: 'var_conf_expression.type.var_ref',
    };

    public static API_TYPE_ID: string = "var_conf_expression";

    public id: number;
    public _type: string = VarConfExpressionVO.API_TYPE_ID;

    /**
     * L'expression originale en texte (ex: "sum(lignefactu.ca)", "var_a + var_b")
     */
    public expression_text: string;

    /**
     * Type d'expression parsée
     */
    public expression_type: number;

    /**
     * Pour les références de champs : nom de la table
     */
    public target_table: string;

    /**
     * Pour les références de champs : nom du champ
     */
    public target_field: string;

    /**
     * Pour les références de variables : nom ou id de la variable
     */
    public target_var_name: string;
    public target_var_id: number;

    /**
     * Pour les opérations binaires : références vers les sous-expressions
     */
    public left_expression_id: number;
    public right_expression_id: number;

    /**
     * Champs de filtrage automatiquement détectés depuis l'expression
     */
    public auto_filter_fields: string[];

    /**
     * Tables impliquées dans le calcul (pour l'invalidation automatique)
     */
    public involved_tables: string[];
}
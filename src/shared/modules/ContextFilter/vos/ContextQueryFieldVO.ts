import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import ConsoleHandler from "../../../tools/ConsoleHandler";
import VarConfVO from "../../Var/vos/VarConfVO";
import ContextQueryInjectionCheckHandler from "../ContextQueryInjectionCheckHandler";

export default class ContextQueryFieldVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query_field";

    public static FIELD_MODIFIER_NONE: number = 0;
    public static FIELD_MODIFIER_NULL_IF_NAN: number = 1;
    public static FIELD_MODIFIER_LOWER: number = 2;
    public static FIELD_MODIFIER_NULL_IF_NO_COLUMN: number = 3;
    public static FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID: number = 4; // Case when using union we should keep api_type_id for each VO
    public static FIELD_MODIFIER_DISTINCT: number = 5;
    public static FIELD_MODIFIER_LABELS: string[] = [
        'ContextQueryFieldVO.FIELD_MODIFIER_NONE',
        'ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NAN',
        'ContextQueryFieldVO.FIELD_MODIFIER_LOWER',
        'ContextQueryFieldVO.FIELD_MODIFIER_NULL_IF_NO_COLUMN',
        'ContextQueryFieldVO.FIELD_MODIFIER_FIELD_AS_EXPLICIT_API_TYPE_ID',
        'ContextQueryFieldVO.FIELD_MODIFIER_DISTINCT'
    ];

    public static FIELD_OPERATOR_NONE: number = 0;
    public static FIELD_OPERATOR_CONCAT: number = 1;
    public static FIELD_OPERATOR_COALESCE: number = 2;
    public static FIELD_OPERATOR_NULLIF: number = 3;
    public static FIELD_OPERATOR_LABELS: string[] = [
        'ContextQueryFieldVO.FIELD_OPERATOR_NONE',
        'ContextQueryFieldVO.FIELD_OPERATOR_CONCAT',
        'ContextQueryFieldVO.FIELD_OPERATOR_COALESCE',
        'ContextQueryFieldVO.FIELD_OPERATOR_NULLIF'
    ];

    public id: number;
    public _type: string = ContextQueryFieldVO.API_TYPE_ID;

    /**
     * api_type_id du type ciblé
     */
    public api_type_id: string;

    /**
     * field_name du champs ciblé. Si le field est null, on considère que c'est un champs calculé défini par ailleurs et on affiche directement l'alias sans filtre
     */
    public field_name: string;

    /**
     * Alias optionnel pour retrouver le champs dans les résultats de la requête
     */
    public alias: string;

    /**
     * Fonction d'aggrégation appliquée à ce champs: cf MainAggregateOperatorsHandlers.XXX_AGGREGATE
     */
    public aggregator: number;

    /**
     * Fonction modificatrice du champs, exemple NULL_IF(field_name, NaN) pour faire des SUM sur des champs qui peuvent être NaN au lieu de null
     */
    public modifier: number;

    /**
     * Force cast if needed
     */
    public cast_with: string;

    /**
     * Pour l'ajout d'opérateurs, de type CONCAT(field_a, '_', field_b), ou COALESCE(field_a, field_b, field_c), etc
     */
    public operator: number;
    public operator_fields: ContextQueryFieldVO[];

    public static_value: string;

    public constructor(
        api_type_id: string = null,
        field_name: string = null,
        alias: string = null,
        aggregator: number = VarConfVO.NO_AGGREGATOR,
        modifier: number = ContextQueryFieldVO.FIELD_MODIFIER_NONE,
        cast_with: string = null
    ) {
        this.api_type_id = api_type_id;
        this.field_name = field_name;
        this.alias = alias;
        this.aggregator = aggregator;
        this.modifier = modifier;
        this.cast_with = cast_with;
    }

    /**
     * Fonction NULLIF de postgresql
     * (a == b) ? null : a
     * @param fields
     */
    public static nullif(...fields: ContextQueryFieldVO[]): ContextQueryFieldVO {
        const res: ContextQueryFieldVO = new ContextQueryFieldVO(
            null,
            null,
            null,
            VarConfVO.NO_AGGREGATOR,
            ContextQueryFieldVO.FIELD_MODIFIER_NONE
        );

        res.operator = ContextQueryFieldVO.FIELD_OPERATOR_NULLIF;

        let alias = '';

        for (const i in fields) {
            const field = fields[i];

            if (!!field.field_name) {
                ContextQueryInjectionCheckHandler.assert_api_type_id_format(field.field_name);
                alias = ((alias == '') ? '' : '_') + field.field_name;
            } else {
                ContextQueryInjectionCheckHandler.assert_api_type_id_format(field.static_value);
                alias = ((alias == '') ? '' : '_') + field.static_value;
            }
        }
        res.alias = alias;

        res.operator_fields = fields;

        return res;
    }

    /**
     * Fonction COALESCE de postgresql
     * (a == null) ? ((b == null) ? c : b) : a
     * @param fields
     */
    public static coalesce(...fields: ContextQueryFieldVO[]): ContextQueryFieldVO {
        const res: ContextQueryFieldVO = new ContextQueryFieldVO(
            null,
            null,
            null,
            VarConfVO.NO_AGGREGATOR,
            ContextQueryFieldVO.FIELD_MODIFIER_NONE
        );

        res.operator = ContextQueryFieldVO.FIELD_OPERATOR_COALESCE;

        let alias = '';

        for (const i in fields) {
            const field = fields[i];

            if (!!field.field_name) {
                ContextQueryInjectionCheckHandler.assert_api_type_id_format(field.field_name);
                alias = ((alias == '') ? '' : '_') + field.field_name;
            } else {
                ContextQueryInjectionCheckHandler.assert_api_type_id_format(field.static_value);
                alias = ((alias == '') ? '' : '_') + field.static_value;
            }
        }
        res.alias = alias;

        res.operator_fields = fields;

        return res;
    }

    /**
     * Fonction CONCAT de postgresql
     * a || b || c || ...
     * @param fields
     */
    public static concat(...fields: ContextQueryFieldVO[]): ContextQueryFieldVO {
        const res: ContextQueryFieldVO = new ContextQueryFieldVO(
            null,
            null,
            null,
            VarConfVO.NO_AGGREGATOR,
            ContextQueryFieldVO.FIELD_MODIFIER_NONE
        );

        res.operator = ContextQueryFieldVO.FIELD_OPERATOR_CONCAT;

        let alias = '';

        for (const i in fields) {
            const field = fields[i];

            if (!!field.field_name) {
                ContextQueryInjectionCheckHandler.assert_api_type_id_format(field.field_name);
                alias = ((alias == '') ? '' : '_') + field.field_name;
            } else {
                ContextQueryInjectionCheckHandler.assert_api_type_id_format(field.static_value);
                alias = ((alias == '') ? '' : '_') + field.static_value;
            }
        }
        res.alias = alias;

        res.operator_fields = fields;

        return res;
    }

    public set_static_value(static_value: string): ContextQueryFieldVO {
        this.static_value = static_value;
        return this;
    }

    public set_aggregator(aggregator: number): ContextQueryFieldVO {
        this.aggregator = aggregator;
        return this;
    }

    public set_modifier(modifier: number): ContextQueryFieldVO {
        this.modifier = modifier;
        return this;
    }

    public set_alias(alias: string): ContextQueryFieldVO {
        this.alias = alias;
        return this;
    }

    public log(is_error: boolean = false) {
        let log_func = ConsoleHandler.log;

        if (is_error) {
            log_func = ConsoleHandler.error;
        }

        log_func('ContextQueryFieldVO - api_type_id:' + this.api_type_id);
        log_func('                    - field_name: ' + this.field_name);
        log_func('                    - alias:' + this.alias);
        log_func('                    - aggregator:' + this.aggregator);
        log_func('                    - modifier:' + this.modifier);
    }
}
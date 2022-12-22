import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import VarConfVO from "../../Var/vos/VarConfVO";

export default class ContextQueryFieldVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query_field";

    public static FIELD_MODIFIER_NONE: number = 0;
    public static FIELD_MODIFIER_NULL_IF_NAN: number = 1;
    public static FIELD_MODIFIER_LOWER: number = 2;

    public id: number;
    public _type: string = ContextQueryFieldVO.API_TYPE_ID;

    /**
     * api_type_id du type ciblé
     */
    public api_type_id: string;

    /**
     * field_id du champs ciblé
     */
    public field_id: string;

    /**
     * Alias optionnel pour retrouver le champs dans les résultats de la requête
     */
    public alias: string;

    /**
     * Fonction d'aggrégation appliquée à ce champs: cf MainAggregateOperatorsHandlers.XXX_AGGREGATE
     */
    public aggregator: number;

    /**
     * Fonction modificatrice du champs, exemple NULL_IF(field_id, NaN) pour faire des SUM sur des champs qui peuvent être NaN au lieu de null
     */
    public modifier: number;

    public constructor(
        api_type_id: string = null,
        field_id: string = null,
        alias: string = null,
        aggregator: number = VarConfVO.NO_AGGREGATOR,
        modifier: number = ContextQueryFieldVO.FIELD_MODIFIER_NONE
    ) {
        this.api_type_id = api_type_id;
        this.field_id = field_id;
        this.alias = alias;
        this.aggregator = aggregator;
        this.modifier = modifier;
    }
}
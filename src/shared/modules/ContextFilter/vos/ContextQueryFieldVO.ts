import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class ContextQueryFieldVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query_field";

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

    public constructor(
        api_type_id: string,
        field_id: string,
        alias: string,
    ) {
        this.api_type_id = api_type_id;
        this.field_id = field_id;
        this.alias = alias;
    }
}
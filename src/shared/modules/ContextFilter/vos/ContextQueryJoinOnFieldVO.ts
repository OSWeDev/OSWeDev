import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import ConsoleHandler from "../../../tools/ConsoleHandler";

export default class ContextQueryJoinOnFieldVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query_join_on_field";

    /**
     *
     * @param joined_table_alias
     * @param joined_table_field_alias Le nom du field dans la sub doit forcément être l'alias à ce stade, donc il faut aliaser aussi dans la sub
     * @param initial_context_query_api_type_id
     * @param initial_context_query_field_id_or_alias
     * @returns 
     */
    public static createNew(
        joined_table_alias: string,
        joined_table_field_alias: string,
        initial_context_query_api_type_id: string,
        initial_context_query_field_id_or_alias: string
    ): ContextQueryJoinOnFieldVO {

        const res: ContextQueryJoinOnFieldVO = new ContextQueryJoinOnFieldVO();

        res.joined_table_alias = joined_table_alias;
        res.joined_table_field_alias = joined_table_field_alias;
        res.initial_context_query_api_type_id = initial_context_query_api_type_id;
        res.initial_context_query_field_id_or_alias = initial_context_query_field_id_or_alias;

        return res;
    }

    public id: number;
    public _type: string = ContextQueryJoinOnFieldVO.API_TYPE_ID;

    public joined_table_alias: string;
    /**
     * Peut être un id de field ou un alias mais sera directement le nom du champ dans le select
     */
    public joined_table_field_alias: string;

    public initial_context_query_api_type_id: string;
    /**
     * Peut être un id de field ou un alias mais sera directement le nom du champ dans le select
     */
    public initial_context_query_field_id_or_alias: string;

    public constructor() { }

    public log(is_error: boolean = false) {
        let log_func = ConsoleHandler.log;

        if (is_error) {
            log_func = ConsoleHandler.error;
        }

        log_func('ContextQueryJoinOnFieldVO - joined_table_alias:' + this.joined_table_alias);
        log_func('                          - joined_table_field_id_or_alias: ' + this.joined_table_field_alias);
        log_func('                          - initial_context_query_api_type_id:' + this.initial_context_query_api_type_id);
        log_func('                          - initial_context_query_field_id_or_alias:' + this.initial_context_query_field_id_or_alias);
    }
}
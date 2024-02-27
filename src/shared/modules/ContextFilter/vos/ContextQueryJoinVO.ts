import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import ConsoleHandler from "../../../tools/ConsoleHandler";
import ContextQueryJoinOnFieldVO from "./ContextQueryJoinOnFieldVO";
import ContextQueryVO from "./ContextQueryVO";

/**
 * Utilisé pour définir un join entre 2 context query
 */
export default class ContextQueryJoinVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_query_join";

    public static JOIN_TYPE_LABELS: string[] = [
        'context_query_join.join_type.left_join'
    ];
    public static JOIN_TYPE_LEFT_JOIN: number = 0;

    public static createNew(
        joined_context_query: ContextQueryVO,
        joined_table_alias: string,
        join_on_fields: ContextQueryJoinOnFieldVO[],
        join_type: number = ContextQueryJoinVO.JOIN_TYPE_LEFT_JOIN): ContextQueryJoinVO {

        const res: ContextQueryJoinVO = new ContextQueryJoinVO();

        res.joined_context_query = joined_context_query;
        res.joined_table_alias = joined_table_alias;
        res.join_on_fields = join_on_fields;
        res.join_type = join_type;

        return res;
    }

    public id: number;
    public _type: string = ContextQueryJoinVO.API_TYPE_ID;

    public joined_context_query: ContextQueryVO;
    public joined_table_alias: string;
    public join_on_fields: ContextQueryJoinOnFieldVO[];
    public join_type: number;

    public constructor() { }

    public join_on_field(joined_table_field_id_or_alias: string, initial_context_query_api_type_id: string, initial_context_query_field_id_or_alias: string): ContextQueryJoinVO {

        const join_on_field = ContextQueryJoinOnFieldVO.createNew(
            this.joined_table_alias,
            joined_table_field_id_or_alias,
            initial_context_query_api_type_id,
            initial_context_query_field_id_or_alias
        );

        if (!this.join_on_fields) {
            this.join_on_fields = [];
        }

        this.join_on_fields.push(join_on_field);

        return this;
    }

    public log(is_error: boolean = false) {
        let log_func = ConsoleHandler.log;

        if (is_error) {
            log_func = ConsoleHandler.error;
        }

        log_func('ContextQueryJoinVO    - joined_table_alias:' + this.joined_table_alias);
        log_func('                      - join_type: ' + ContextQueryJoinVO.JOIN_TYPE_LABELS[this.join_type]);
        log_func('                      - joined_context_query:');
        this.joined_context_query.log(is_error);
        log_func('                      - join_on_fields: ');
        this.join_on_fields.forEach((join_on_field) => {
            join_on_field.log(is_error);
        });
    }
}
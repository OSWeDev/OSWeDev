import pgPromise = require("pg-promise");
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";

export default class ThrottledSelectQueryParam {

    public static ThrottledSelectQueryParam_index: number = 1;

    public index: number = null;
    public semaphore: boolean = false;

    public parameterized_full_query: string;

    public constructor(
        public cbs: Array<(...any) => void>,
        public context_query: ContextQueryVO,
        query_: string,
        values: any) {
        this.parameterized_full_query = pgPromise.as.format(query_, values);
        this.index = ThrottledSelectQueryParam.ThrottledSelectQueryParam_index++;
    }
}
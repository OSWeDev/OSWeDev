import pgPromise from 'pg-promise';
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ParameterizedQueryWrapperField from "../../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField";

export default class ThrottledSelectQueryParam {

    public static ThrottledSelectQueryParam_index: number = 1;

    public index: number = null;
    public semaphore: boolean = false;

    public parameterized_full_query: string;

    public constructor(
        public cbs: Array<(...any) => void>,
        public context_query: ContextQueryVO,
        public parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[],
        query_: string,
        values: any) {
        this.parameterized_full_query = (values && values.length) ? pgPromise.as.format(query_, values) : query_;
        this.index = ThrottledSelectQueryParam.ThrottledSelectQueryParam_index++;
    }
}
import ContextQueryVO from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";

export default class ThrottledSelectQueryParam {

    public static ThrottledSelectQueryParam_index: number = 1;

    public index: number = null;
    public semaphore: boolean = false;

    public constructor(
        public cbs: Array<(value: number) => void>,
        public context_query: ContextQueryVO,
        public query_: string,
        public values: any) {
        this.index = ThrottledSelectQueryParam.ThrottledSelectQueryParam_index++;
    }
}
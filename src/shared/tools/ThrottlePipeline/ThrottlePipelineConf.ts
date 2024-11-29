
export default class ThrottlePipelineConf<ParamType, ResultType> {

    public constructor(
        public UID: number,
        public pipeline_name: string,
        public func: (params: { [index: number | string]: ParamType }) => { [index: number | string]: ResultType } | Promise<{ [index: number | string]: ResultType }>,
        public wait_ms: number,
        public pipeline_size: number,
        public max_stack_size: number,
    ) { }
}
export default class ParameterizedWhereCondition {
    public constructor(
        public where_condition: string,
        public parameters: any[] = null
    ) { }
}
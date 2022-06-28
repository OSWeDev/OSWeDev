
export default class ParameterizedQueryWrapper {
    public constructor(
        public query: string,
        public params: any[]
    ) { }

    public set_query(query: string): ParameterizedQueryWrapper {
        this.query = query;
        return this;
    }
}
export default class APIDAOParamVOs<T> {

    public static async translateSelectAllParams<T>(
        API_TYPE_ID: string,
        query: string = null,
        queryParams: any[] = null,
        depends_on_api_type_ids: string[] = null): Promise<APIDAOParamVOs<T>> {

        return new APIDAOParamVOs<T>(API_TYPE_ID, query, queryParams, depends_on_api_type_ids);
    }

    public static async translateGetVosParams<T>(API_TYPE_ID: string): Promise<APIDAOParamVOs<T>> {

        return new APIDAOParamVOs<T>(API_TYPE_ID);
    }

    constructor(
        public API_TYPE_ID: string,
        public query: string = null,
        public queryParams: any[] = null,
        public depends_on_api_type_ids: string[] = null) {
    }
}
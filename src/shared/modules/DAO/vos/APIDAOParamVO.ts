export default class APIDAOParamVO<T> {

    public static async translateSelectOneParams<T>(
        API_TYPE_ID: string,
        query: string = null,
        queryParams: any[] = null,
        depends_on_api_type_ids: string[] = null): Promise<APIDAOParamVO<T>> {

        return new APIDAOParamVO<T>(API_TYPE_ID, null, query, queryParams, depends_on_api_type_ids);
    }

    public static async translateGetVoByIdParams<T>(
        API_TYPE_ID: string,
        id: number): Promise<APIDAOParamVO<T>> {

        return new APIDAOParamVO<T>(API_TYPE_ID, id);
    }

    constructor(
        public API_TYPE_ID: string,
        public id: number = null,
        public query: string = null,
        public queryParams: any[] = null,
        public depends_on_api_type_ids: string[] = null) {

    }
}
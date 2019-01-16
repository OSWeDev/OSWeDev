export default class APIDAONamedParamVO {

    public static URL: string = ':api_type_id/:name';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        name: string): Promise<APIDAONamedParamVO> {

        return new APIDAONamedParamVO(API_TYPE_ID, name);
    }

    public static async translateToURL(param: APIDAONamedParamVO): Promise<string> {

        return param ? param.API_TYPE_ID + '/' + param.name : '';
    }
    public static async translateFromREQ(req): Promise<APIDAONamedParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new APIDAONamedParamVO(req.params.api_type_id, req.params.name);
    }

    public constructor(
        public API_TYPE_ID: string,
        public name: string) {
    }
}
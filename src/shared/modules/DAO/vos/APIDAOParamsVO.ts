export default class APIDAOParamsVO {

    public static URL: string = ':api_type_id/:ids';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        ids: number[]): Promise<APIDAOParamsVO> {

        return new APIDAOParamsVO(API_TYPE_ID, ids);
    }

    public static async translateToURL(param: APIDAOParamsVO): Promise<string> {

        return param ? param.API_TYPE_ID + '/' + param.ids.join('_') : '';
    }
    public static async translateFromREQ(req): Promise<APIDAOParamsVO> {

        if (!(req && req.params)) {
            return null;
        }
        let ids = req.params.ids.split('_');
        for (let i in ids) {
            ids[i] = parseInt(ids[i]);
        }
        return new APIDAOParamsVO(req.params.api_type_id, ids);
    }

    public constructor(
        public API_TYPE_ID: string,
        public ids: number[]) {
    }
}
export default class APIDAORefFieldParamsVO {

    public static URL: string = ':api_type_id/:field_name/:ids';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        field_name: string,
        ids: number[]): Promise<APIDAORefFieldParamsVO> {

        return new APIDAORefFieldParamsVO(API_TYPE_ID, field_name, ids);
    }

    public static async translateToURL(param: APIDAORefFieldParamsVO): Promise<string> {

        return param ? param.API_TYPE_ID + '/' + param.field_name + '/' + param.ids.join('_') : '';
    }
    public static async translateFromREQ(req): Promise<APIDAORefFieldParamsVO> {

        if (!(req && req.params)) {
            return null;
        }
        let ids = req.params.ids.split('_');
        for (let i in ids) {
            ids[i] = parseInt(ids[i]);
        }
        return new APIDAORefFieldParamsVO(req.params.api_type_id, req.params.field_name, ids);
    }

    public constructor(
        public API_TYPE_ID: string,
        public field_name: string,
        public ids: number[]) {
    }
}
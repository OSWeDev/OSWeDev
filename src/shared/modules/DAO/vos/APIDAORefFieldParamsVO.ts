export default class APIDAORefFieldParamsVO {

    public static URL: string = ':api_type_id/:field_name/:has_null/:ids';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        field_name: string,
        ids: number[]): Promise<APIDAORefFieldParamsVO> {

        return new APIDAORefFieldParamsVO(API_TYPE_ID, field_name, ids);
    }

    public static async translateToURL(param: APIDAORefFieldParamsVO): Promise<string> {

        if (!param) {
            return '';
        }

        let has_null: boolean = false;
        for (let i in param.ids) {
            if (param.ids[i] == null) {
                has_null = true;
                break;
            }
        }

        let temp = param.ids.filter((v) => v != null);
        let request = param.API_TYPE_ID + '/' + param.field_name + '/' + (has_null ? "true" : "false") + '/' + temp.join('_');

        return request;
    }
    public static async translateFromREQ(req): Promise<APIDAORefFieldParamsVO> {

        if (!(req && req.params)) {
            return null;
        }
        let has_null = (!!req.params.has_null) ? req.params.has_null == 'true' : false;
        let ids: any[] = req.params.ids ? req.params.ids.split('_') : null;
        for (let i in ids) {
            ids[i] = parseInt(ids[i]);
        }
        if (has_null) {
            if (!!ids) {
                ids.unshift([null]);
            } else {
                ids = [null];
            }
        }
        return new APIDAORefFieldParamsVO(req.params.api_type_id, req.params.field_name, ids);
    }

    public constructor(
        public API_TYPE_ID: string,
        public field_name: string,
        public ids: number[]) {
    }
}
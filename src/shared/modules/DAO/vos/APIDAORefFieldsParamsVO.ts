export default class APIDAORefFieldsParamsVO {

    public static URL: string = ':api_type_id/:field_name1/:ids1/:field_name2/:ids2/:field_name3/:ids3';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string,
        ids2: number[],
        field_name3: string,
        ids3: number[]): Promise<APIDAORefFieldsParamsVO> {

        return new APIDAORefFieldsParamsVO(API_TYPE_ID, field_name1, ids1, field_name2, ids2, field_name3, ids3);
    }

    public static async translateToURL(param: APIDAORefFieldsParamsVO): Promise<string> {

        return param ? param.API_TYPE_ID
            + '/' + param.field_name1 + '/' + param.ids1.join('_')
            + '/' + (param.field_name2 ? param.field_name2 : '') + '/' + (param.field_name2 ? param.ids2.join('_') : '')
            + '/' + (param.field_name3 ? param.field_name3 : '') + '/' + (param.field_name3 ? param.ids3.join('_') : '') : '';
    }
    public static async translateFromREQ(req): Promise<APIDAORefFieldsParamsVO> {

        if (!(req && req.params)) {
            return null;
        }

        if ((req.params.field_name1 == null) || (req.params.field_name1 == 'null') || (req.params.field_name1 == '')) {
            return null;
        }

        let field_name1: string = req.params.field_name1;
        let ids1 = req.params.ids1.split('_');
        for (let i in ids1) {
            ids1[i] = parseInt(ids1[i]);
        }

        let field_name2: string = ((req.params.field_name2 != null) && (req.params.field_name2 != 'null') && (req.params.field_name2 != '')) ? req.params.field_name2 : null;
        let ids2 = null;
        if (field_name2) {
            ids2 = req.params.ids2.split('_');
            for (let i in ids2) {
                ids2[i] = parseInt(ids2[i]);
            }
        }

        let field_name3: string = ((req.params.field_name3 != null) && (req.params.field_name3 != 'null') && (req.params.field_name3 != '')) ? req.params.field_name3 : null;
        let ids3 = null;
        if (field_name3) {
            ids3 = req.params.ids3.split('_');
            for (let i in ids3) {
                ids3[i] = parseInt(ids3[i]);
            }
        }

        return new APIDAORefFieldsParamsVO(req.params.api_type_id, req.params.field_name1, ids1, req.params.field_name2, ids2, req.params.field_name3, ids3);
    }

    public constructor(
        public API_TYPE_ID: string,
        public field_name1: string,
        public ids1: number[],
        public field_name2: string,
        public ids2: number[],
        public field_name3: string,
        public ids3: number[]) {
    }
}
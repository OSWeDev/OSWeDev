export default class APIDAORefFieldsAndFieldsStringParamsVO {

    public static URL: string = ':api_type_id/:field_name1/:ids1/:field_name2/:values2/:field_name3/:values3';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string,
        values2: string[],
        field_name3: string,
        values3: string[]): Promise<APIDAORefFieldsAndFieldsStringParamsVO> {

        return new APIDAORefFieldsAndFieldsStringParamsVO(API_TYPE_ID, field_name1, ids1, field_name2, values2, field_name3, values3);
    }

    public static async translateToURL(param: APIDAORefFieldsAndFieldsStringParamsVO): Promise<string> {

        return param ? param.API_TYPE_ID
            + '/' + (param.field_name1 ? param.field_name1 : '_') + '/' + ((param.ids1 && param.field_name1) ? param.ids1.join('_') : '_')
            + '/' + (param.field_name2 ? param.field_name2 : '_') + '/' + ((param.values2 && param.field_name2) ? param.values2.join('_') : '_')
            + '/' + (param.field_name3 ? param.field_name3 : '_') + '/' + ((param.values3 && param.field_name3) ? param.values3.join('_') : '_') : '';
    }
    public static async translateFromREQ(req): Promise<APIDAORefFieldsAndFieldsStringParamsVO> {

        if (!(req && req.params)) {
            return null;
        }

        // if ((req.params.field_name1 == null) || (req.params.field_name1 == 'null') || (req.params.field_name1 == '')) {
        //     return null;
        // }

        let field_name1: string = ((req.params.field_name1 != null) && (req.params.field_name1 != 'null') && (req.params.field_name1 != '') && (req.params.field_name1 != '_')) ? req.params.field_name1 : null;
        let ids1 = null;
        if (field_name1) {
            ids1 = req.params.ids1.split('_');
            for (let i in ids1) {
                ids1[i] = parseInt(ids1[i]);
            }
        }

        let field_name2: string = ((req.params.field_name2 != null) && (req.params.field_name2 != 'null') && (req.params.field_name2 != '') && (req.params.field_name2 != '_')) ? req.params.field_name2 : null;
        let values2 = null;
        if (field_name2) {
            values2 = req.params.values2.split('_');
            for (let i in values2) {
                values2[i] = values2[i];
            }
        }

        let field_name3: string = ((req.params.field_name3 != null) && (req.params.field_name3 != 'null') && (req.params.field_name3 != '') && (req.params.field_name3 != '_')) ? req.params.field_name3 : null;
        let values3 = null;
        if (field_name3) {
            values3 = req.params.values3.split('_');
            for (let i in values3) {
                values3[i] = values3[i];
            }
        }

        return new APIDAORefFieldsAndFieldsStringParamsVO(req.params.api_type_id, field_name1, ids1, field_name2, values2, field_name3, values3);
    }

    public constructor(
        public API_TYPE_ID: string,
        public field_name1: string,
        public ids1: number[],
        public field_name2: string,
        public values2: string[],
        public field_name3: string,
        public values3: string[]) {
    }
}
import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAORefFieldsParamsVO implements IAPIParamTranslator<APIDAORefFieldsParamsVO> {

    public static URL: string = ':api_type_id/:field_name1/:ids1/:field_name2/:ids2/:field_name3/:ids3';

    public static fromParams(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string,
        ids2: number[],
        field_name3: string,
        ids3: number[]): APIDAORefFieldsParamsVO {

        return new APIDAORefFieldsParamsVO(API_TYPE_ID, field_name1, ids1, field_name2, ids2, field_name3, ids3);
    }


    public static fromREQ(req): APIDAORefFieldsParamsVO {

        if (!(req && req.params)) {
            return null;
        }

        if ((req.params.field_name1 == null) || (req.params.field_name1 == 'null') || (req.params.field_name1 == '')) {
            return null;
        }

        let field_name1: string = ((req.params.field_name1 != null) && (req.params.field_name1 != 'null') && (req.params.field_name1 != '') && (req.params.field_name1 != '_')) ? req.params.field_name1 : null;
        let ids1 = null;
        if (field_name1) {
            ids1 = req.params.ids1.split('_');
            for (let i in ids1) {
                ids1[i] = parseInt(ids1[i]);
            }
        }

        let field_name2: string = ((req.params.field_name2 != null) && (req.params.field_name2 != 'null') && (req.params.field_name2 != '') && (req.params.field_name2 != '_')) ? req.params.field_name2 : null;
        let ids2 = null;
        if (field_name2) {
            ids2 = req.params.ids2.split('_');
            for (let i in ids2) {
                ids2[i] = parseInt(ids2[i]);
            }
        }

        let field_name3: string = ((req.params.field_name3 != null) && (req.params.field_name3 != 'null') && (req.params.field_name3 != '') && (req.params.field_name3 != '_')) ? req.params.field_name3 : null;
        let ids3 = null;
        if (field_name3) {
            ids3 = req.params.ids3.split('_');
            for (let i in ids3) {
                ids3[i] = parseInt(ids3[i]);
            }
        }

        return new APIDAORefFieldsParamsVO(req.params.api_type_id, field_name1, ids1, field_name2, ids2, field_name3, ids3);
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

    public getAPIParams(): any[] {
        return [
            this.API_TYPE_ID,
            this.field_name1,
            this.ids1,
            this.field_name2,
            this.ids2,
            this.field_name3,
            this.ids3
        ];
    }

    public translateToURL(): string {

        return this.API_TYPE_ID
            + '/' + (this.field_name1 ? this.field_name1 : '_') + '/' + ((this.ids1 && this.field_name1) ? this.ids1.join('_') : '_')
            + '/' + (this.field_name2 ? this.field_name2 : '_') + '/' + (this.field_name2 ? this.ids2.join('_') : '_')
            + '/' + (this.field_name3 ? this.field_name3 : '_') + '/' + (this.field_name3 ? this.ids3.join('_') : '_');
    }
}

export const APIDAORefFieldsParamsVOStatic: IAPIParamTranslatorStatic<APIDAORefFieldsParamsVO> = APIDAORefFieldsParamsVO;
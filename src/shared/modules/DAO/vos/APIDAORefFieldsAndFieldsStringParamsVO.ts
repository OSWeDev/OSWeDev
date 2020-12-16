import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAORefFieldsAndFieldsStringParamsVO implements IAPIParamTranslator<APIDAORefFieldsAndFieldsStringParamsVO> {

    public static URL: string = ':api_type_id/:field_name1/:ids1/:field_name2/:values2/:field_name3/:values3';

    public static fromParams(
        API_TYPE_ID: string,
        field_name1: string,
        ids1: number[],
        field_name2: string = null,
        values2: string[] = null,
        field_name3: string = null,
        values3: string[] = null): APIDAORefFieldsAndFieldsStringParamsVO {

        return new APIDAORefFieldsAndFieldsStringParamsVO(API_TYPE_ID, field_name1, ids1, field_name2, values2, field_name3, values3);
    }

    public static fromREQ(req): APIDAORefFieldsAndFieldsStringParamsVO {

        if (!(req && req.params)) {
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
        public field_name2: string = null,
        public values2: string[] = null,
        public field_name3: string = null,
        public values3: string[] = null) {
    }

    public getAPIParams(): any[] {
        return [
            this.API_TYPE_ID,
            this.field_name1,
            this.ids1,
            this.field_name2,
            this.values2,
            this.field_name3,
            this.values3
        ];
    }

    public translateToURL(): string {

        return this.API_TYPE_ID
            + '/' + (this.field_name1 ? this.field_name1 : '_') + '/' + ((this.ids1 && this.field_name1) ? this.ids1.join('_') : '_')
            + '/' + (this.field_name2 ? this.field_name2 : '_') + '/' + ((this.values2 && this.field_name2) ? this.values2.join('_') : '_')
            + '/' + (this.field_name3 ? this.field_name3 : '_') + '/' + ((this.values3 && this.field_name3) ? this.values3.join('_') : '_');
    }
}

export const APIDAORefFieldsAndFieldsStringParamsVOStatic: IAPIParamTranslatorStatic<APIDAORefFieldsAndFieldsStringParamsVO> = APIDAORefFieldsAndFieldsStringParamsVO;
/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAORefFieldParamsVO implements IAPIParamTranslator<APIDAORefFieldParamsVO> {

    public static URL: string = ':api_type_id/:field_name/:has_null/:ids';

    public static fromParams(API_TYPE_ID: string, field_name: string, ids: number[]): APIDAORefFieldParamsVO {

        return new APIDAORefFieldParamsVO(API_TYPE_ID, field_name, ids);
    }

    public static fromREQ(req): APIDAORefFieldParamsVO {

        if (!(req && req.params)) {
            return null;
        }
        const has_null = (req.params.has_null) ? req.params.has_null == 'true' : false;
        let ids: any[] = req.params.ids ? req.params.ids.split('_') : null;
        for (const i in ids) {
            ids[i] = parseInt(ids[i]);
        }
        if (has_null) {
            if (ids) {
                ids.unshift([null]);
            } else {
                ids = [null];
            }
        }
        return new APIDAORefFieldParamsVO(req.params.api_type_id, req.params.field_name, ids);
    }

    public static getAPIParams(param: APIDAORefFieldParamsVO): any[] {
        return [param.API_TYPE_ID, param.field_name, param.ids];
    }

    public constructor(
        public API_TYPE_ID: string,
        public field_name: string,
        public ids: number[]) {
    }

    public translateToURL(): string {

        let has_null: boolean = false;
        for (const i in this.ids) {
            if (this.ids[i] == null) {
                has_null = true;
                break;
            }
        }

        const temp = this.ids.filter((v) => v != null);
        const request = this.API_TYPE_ID + '/' + this.field_name + '/' + (has_null ? "true" : "false") + '/' + temp.join('_');

        return request;
    }
}

export const APIDAORefFieldParamsVOStatic: IAPIParamTranslatorStatic<APIDAORefFieldParamsVO> = APIDAORefFieldParamsVO;
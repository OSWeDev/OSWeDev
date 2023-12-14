/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAOParamsVO implements IAPIParamTranslator<APIDAOParamsVO> {

    public static URL: string = ':api_type_id/:ids';

    public static fromREQ(req): APIDAOParamsVO {

        if (!(req && req.params)) {
            return null;
        }
        let ids = req.params.ids.split('_');
        for (let i in ids) {
            ids[i] = parseInt(ids[i]);
        }
        return new APIDAOParamsVO(req.params.api_type_id, ids);
    }

    public static fromParams(API_TYPE_ID: string, ids: number[]): APIDAOParamsVO {
        return new APIDAOParamsVO(API_TYPE_ID, ids);
    }

    public static getAPIParams(param: APIDAOParamsVO): any[] {
        return [param.API_TYPE_ID, param.ids];
    }

    public constructor(
        public API_TYPE_ID: string,
        public ids: number[]) {
    }

    public translateToURL(): string {

        return this.API_TYPE_ID + '/' + this.ids.join('_');
    }
}

export const APIDAOParamsVOStatic: IAPIParamTranslatorStatic<APIDAOParamsVO> = APIDAOParamsVO;
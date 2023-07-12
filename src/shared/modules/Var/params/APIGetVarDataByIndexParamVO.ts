/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIGetVarDataByIndexParamVO implements IAPIParamTranslator<APIGetVarDataByIndexParamVO> {

    public static URL: string = ':api_type_id/:index';

    public static fromREQ(req): APIGetVarDataByIndexParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new APIGetVarDataByIndexParamVO(req.params.api_type_id, req.params.index);
    }

    public static fromParams(api_type_id: string, index: string): APIGetVarDataByIndexParamVO {
        return new APIGetVarDataByIndexParamVO(api_type_id, index);
    }

    public static getAPIParams(param: APIGetVarDataByIndexParamVO): any[] {
        return [param.api_type_id, param.index];
    }

    public constructor(
        public api_type_id: string,
        public index: string) {
    }

    public translateToURL(): string {

        return this.api_type_id + '/' + this.index;
    }
}

export const APIGetVarDataByIndexParamVOStatic: IAPIParamTranslatorStatic<APIGetVarDataByIndexParamVO> = APIGetVarDataByIndexParamVO;
/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';

export default class APIStringAndVOParamVO implements IAPIParamTranslator<APIStringAndVOParamVO> {

    public static fromParams(
        text: string,
        vo: IDistantVOBase) {

        return new APIStringAndVOParamVO(text, vo);
    }

    public static getAPIParams(param: APIStringAndVOParamVO): any[] {
        return [param.text, param.vo];
    }

    public constructor(
        public text: string,
        public vo: IDistantVOBase) {
    }
}

export const APIStringAndVOParamVOStatic: IAPIParamTranslatorStatic<APIStringAndVOParamVO> = APIStringAndVOParamVO;
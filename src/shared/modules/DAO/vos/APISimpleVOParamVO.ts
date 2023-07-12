/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOParamVO implements IAPIParamTranslator<APISimpleVOParamVO> {

    public static fromParams(
        vo: IDistantVOBase): APISimpleVOParamVO {

        return new APISimpleVOParamVO(vo);
    }

    public static getAPIParams(param: APISimpleVOParamVO): any[] {
        return [param.vo];
    }

    public constructor(
        public vo: IDistantVOBase) { }
}

export const APISimpleVOParamVOStatic: IAPIParamTranslatorStatic<APISimpleVOParamVO> = APISimpleVOParamVO;
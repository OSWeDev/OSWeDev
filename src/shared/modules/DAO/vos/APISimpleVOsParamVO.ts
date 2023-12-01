/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOsParamVO implements IAPIParamTranslator<APISimpleVOsParamVO> {

    public static fromParams(
        vos: IDistantVOBase[]): APISimpleVOsParamVO {

        return new APISimpleVOsParamVO(vos);
    }

    public static getAPIParams(param: APISimpleVOsParamVO): any[] {
        return [param.vos];
    }

    public constructor(
        public vos: IDistantVOBase[]) { }
}

export const APISimpleVOsParamVOStatic: IAPIParamTranslatorStatic<APISimpleVOsParamVO> = APISimpleVOsParamVO;
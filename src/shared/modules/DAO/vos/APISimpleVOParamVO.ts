import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOParamVO implements IAPIParamTranslator<APISimpleVOParamVO> {

    public static fromParams(
        vo: IDistantVOBase): APISimpleVOParamVO {

        return new APISimpleVOParamVO(vo);
    }

    public constructor(
        public vo: IDistantVOBase) { }

    public getAPIParams(): any[] {
        return [this.vo];
    }
}

export const APISimpleVOParamVOStatic: IAPIParamTranslatorStatic<APISimpleVOParamVO> = APISimpleVOParamVO;
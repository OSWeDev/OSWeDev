import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';

export default class APISimpleVOsParamVO implements IAPIParamTranslator<APISimpleVOsParamVO> {

    public static fromParams(
        vos: IDistantVOBase[]): APISimpleVOsParamVO {

        return new APISimpleVOsParamVO(vos);
    }

    public constructor(
        public vos: IDistantVOBase[]) { }

    public getAPIParams(): any[] {
        return [this.vos];
    }
}

export const APISimpleVOsParamVOStatic: IAPIParamTranslatorStatic<APISimpleVOsParamVO> = APISimpleVOsParamVO;
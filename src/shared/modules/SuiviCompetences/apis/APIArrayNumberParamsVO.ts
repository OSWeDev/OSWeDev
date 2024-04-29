import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import NumRange from "../../DataRender/vos/NumRange";

export default class APIArrayNumberParamsVO implements IAPIParamTranslator<APIArrayNumberParamsVO> {

    public static fromParams(
        nums: NumRange[],
    ): APIArrayNumberParamsVO {

        return new APIArrayNumberParamsVO(nums);
    }

    public static getAPIParams(param: APIArrayNumberParamsVO): any[] {
        return [param.nums];
    }

    public constructor(
        public nums: NumRange[],
    ) { }
}

export const APIArrayNumberParamsVOStatic: IAPIParamTranslatorStatic<APIArrayNumberParamsVO> = APIArrayNumberParamsVO;
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class MFAGenerateCodeParamVO implements IAPIParamTranslator<MFAGenerateCodeParamVO> {

    public constructor(
        public userId: number,
        public method: string
    ) { }

    public static fromParams(userId: number, method: string): MFAGenerateCodeParamVO {
        return new MFAGenerateCodeParamVO(userId, method);
    }

    public static getAPIParams(param: MFAGenerateCodeParamVO): (string | number)[] {
        return [param.userId, param.method];
    }
}

export const MFAGenerateCodeParamVOStatic: IAPIParamTranslatorStatic<MFAGenerateCodeParamVO> = MFAGenerateCodeParamVO;

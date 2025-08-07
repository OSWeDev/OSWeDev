import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class MFAVerifyCodeParamVO implements IAPIParamTranslator<MFAVerifyCodeParamVO> {

    public constructor(
        public userId: number,
        public code: string,
        public method: string
    ) { }

    public static fromParams(userId: number, code: string, method: string): MFAVerifyCodeParamVO {
        return new MFAVerifyCodeParamVO(userId, code, method);
    }

    public static getAPIParams(param: MFAVerifyCodeParamVO): (string | number)[] {
        return [param.userId, param.code, param.method];
    }
}

export const MFAVerifyCodeParamVOStatic: IAPIParamTranslatorStatic<MFAVerifyCodeParamVO> = MFAVerifyCodeParamVO;

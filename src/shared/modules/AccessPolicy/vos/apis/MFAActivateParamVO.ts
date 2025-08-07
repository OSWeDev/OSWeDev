import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class MFAActivateParamVO implements IAPIParamTranslator<MFAActivateParamVO> {

    public constructor(
        public userId: number,
        public verificationCode: string
    ) { }

    public static fromParams(userId: number, verificationCode: string): MFAActivateParamVO {
        return new MFAActivateParamVO(userId, verificationCode);
    }

    public static getAPIParams(param: MFAActivateParamVO): (string | number)[] {
        return [param.userId, param.verificationCode];
    }
}

export const MFAActivateParamVOStatic: IAPIParamTranslatorStatic<MFAActivateParamVO> = MFAActivateParamVO;

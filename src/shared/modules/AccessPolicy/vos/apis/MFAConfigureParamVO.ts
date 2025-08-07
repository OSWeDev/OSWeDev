import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class MFAConfigureParamVO implements IAPIParamTranslator<MFAConfigureParamVO> {

    public constructor(
        public userId: number,
        public method: string,
        public phoneNumber?: string
    ) { }

    public static fromParams(userId: number, method: string, phoneNumber?: string): MFAConfigureParamVO {
        return new MFAConfigureParamVO(userId, method, phoneNumber);
    }

    public static getAPIParams(param: MFAConfigureParamVO): (string | number)[] {
        return [param.userId, param.method, param.phoneNumber];
    }
}

export const MFAConfigureParamVOStatic: IAPIParamTranslatorStatic<MFAConfigureParamVO> = MFAConfigureParamVO;

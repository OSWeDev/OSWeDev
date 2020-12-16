import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class ResetPwdParamVO implements IAPIParamTranslator<ResetPwdParamVO>{

    public static fromParams(
        email: string,
        challenge: string,
        new_pwd1: string): ResetPwdParamVO {

        return new ResetPwdParamVO(email, challenge, new_pwd1);
    }

    public constructor(
        public email: string,
        public challenge: string,
        public new_pwd1: string) {
    }

    public getAPIParams(): any[] {
        return [this.email, this.challenge, this.new_pwd1];
    }
}

export const ResetPwdParamVOStatic: IAPIParamTranslatorStatic<ResetPwdParamVO> = ResetPwdParamVO;
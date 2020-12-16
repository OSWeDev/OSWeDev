import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class ResetPwdUIDParamVO implements IAPIParamTranslator<ResetPwdUIDParamVO>{

    public static fromParams(
        uid: number,
        challenge: string,
        new_pwd1: string): ResetPwdUIDParamVO {

        return new ResetPwdUIDParamVO(uid, challenge, new_pwd1);
    }

    public constructor(
        public uid: number,
        public challenge: string,
        public new_pwd1: string) {
    }

    public getAPIParams(): any[] {
        return [this.uid, this.challenge, this.new_pwd1];
    }
}

export const ResetPwdUIDParamVOStatic: IAPIParamTranslatorStatic<ResetPwdUIDParamVO> = ResetPwdUIDParamVO;
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class LoginParamVO implements IAPIParamTranslator<LoginParamVO> {

    public static fromParams(email: string, password: string, redirect_to: string): LoginParamVO {

        return new LoginParamVO(email, password, redirect_to);
    }

    public constructor(
        public email: string,
        public password: string,
        public redirect_to: string) {
    }

    public getAPIParams(): any[] {
        return [this.email, this.password, this.redirect_to];
    }
}

export const LoginParamVOStatic: IAPIParamTranslatorStatic<LoginParamVO> = LoginParamVO;
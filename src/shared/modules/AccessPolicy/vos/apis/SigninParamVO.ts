import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class SigninParamVO implements IAPIParamTranslator<SigninParamVO> {

    public static fromParams(nom: string, email: string, password: string, redirect_to: string): SigninParamVO {

        return new SigninParamVO(nom, email, password, redirect_to);
    }

    public static getAPIParams(param: SigninParamVO): any[] {
        return [param.nom, param.email, param.password, param.redirect_to];
    }

    public constructor(
        public nom: string,
        public email: string,
        public password: string,
        public redirect_to: string) {
    }
}

export const SigninParamVOStatic: IAPIParamTranslatorStatic<SigninParamVO> = SigninParamVO;
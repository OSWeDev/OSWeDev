/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class LoginMFAParamVO implements IAPIParamTranslator<LoginMFAParamVO> {

    public constructor(
        public user_id: number,
        public mfa_code: string,
        public redirect_to: string,
        public sso: boolean) {
    }

    public static fromParams(user_id: number, mfa_code: string, redirect_to: string, sso: boolean): LoginMFAParamVO {

        return new LoginMFAParamVO(user_id, mfa_code, redirect_to, sso);
    }

    public static getAPIParams(param: LoginMFAParamVO): any[] {
        return [param.user_id, param.mfa_code, param.redirect_to, param.sso];
    }
}

export const LoginMFAParamVOStatic: IAPIParamTranslatorStatic<LoginMFAParamVO> = LoginMFAParamVO;

export default class ResetPwdParamVO {

    public static async translateCheckAccessParams(
        email: string, challenge: string, new_pwd1: string): Promise<ResetPwdParamVO> {

        return new ResetPwdParamVO(email, challenge, new_pwd1);
    }

    public constructor(
        public email: string,
        public challenge: string,
        public new_pwd1: string) {
    }
}
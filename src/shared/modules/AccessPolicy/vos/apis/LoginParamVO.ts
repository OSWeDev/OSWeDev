export default class LoginParamVO {

    public static async translateCheckAccessParams(
        email: string, password: string, redirect_to: string): Promise<LoginParamVO> {

        return new LoginParamVO(email, password, redirect_to);
    }

    public constructor(
        public email: string,
        public password: string,
        public redirect_to: string) {
    }
}
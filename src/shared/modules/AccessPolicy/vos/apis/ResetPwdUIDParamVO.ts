export default class ResetPwdUIDParamVO {

    public static async translateCheckAccessParams(
        uid: number, challenge: string, new_pwd1: string): Promise<ResetPwdUIDParamVO> {

        return new ResetPwdUIDParamVO(uid, challenge, new_pwd1);
    }

    public constructor(
        public uid: number,
        public challenge: string,
        public new_pwd1: string) {
    }
}
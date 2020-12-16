import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class SendRequestParamVO implements IAPIParamTranslator<SendRequestParamVO> {

    public static fromParams(
        method: string,
        host: string,
        path: string,
        posts: {} = null,
        headers: {} = null,
        sendHttps: boolean = false): SendRequestParamVO {

        return new SendRequestParamVO(method, host, path, posts, headers, sendHttps);
    }

    public constructor(
        public method: string,
        public host: string,
        public path: string,
        public posts: {} = null,
        public headers: {} = null,
        public sendHttps: boolean = false) {
    }

    public getAPIParams(): any[] {
        return [this.method, this.host, this.path, this.posts, this.headers, this.sendHttps];
    }
}

export const SendRequestParamVOStatic: IAPIParamTranslatorStatic<SendRequestParamVO> = SendRequestParamVO;
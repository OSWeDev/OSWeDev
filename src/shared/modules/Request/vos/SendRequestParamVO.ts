import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class SendRequestParamVO implements IAPIParamTranslator<SendRequestParamVO> {

    public static fromParams(
        method: string,
        host: string,
        path: string,
        posts: {} = null,
        headers: {} = null,
        sendHttps: boolean = false,
        result_headers: {} = null): SendRequestParamVO {

        return new SendRequestParamVO(method, host, path, posts, headers, sendHttps);
    }

    public static getAPIParams(param: SendRequestParamVO): any[] {
        return [param.method, param.host, param.path, param.posts, param.headers, param.sendHttps, param.result_headers];
    }

    public constructor(
        public method: string,
        public host: string,
        public path: string,
        public posts: {} = null,
        public headers: {} = null,
        public sendHttps: boolean = false,
        public result_headers: {} = null) {
    }
}

export const SendRequestParamVOStatic: IAPIParamTranslatorStatic<SendRequestParamVO> = SendRequestParamVO;
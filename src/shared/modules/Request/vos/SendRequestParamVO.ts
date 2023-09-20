/* istanbul ignore file : nothing to test in ParamVOs */

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
        result_headers: {} = null,
        nojsonparse: boolean = false,
        add_content_length_to_headers: boolean = false,
        json_stringify_posts: boolean = true,
    ): SendRequestParamVO {

        return new SendRequestParamVO(method, host, path, posts, headers, sendHttps, result_headers, nojsonparse, add_content_length_to_headers, json_stringify_posts);
    }

    public static getAPIParams(param: SendRequestParamVO): any[] {
        return [param.method, param.host, param.path, param.posts, param.headers, param.sendHttps, param.result_headers, param.nojsonparse, param.add_content_length_to_headers, param.json_stringify_posts];
    }

    public constructor(
        public method: string,
        public host: string,
        public path: string,
        public posts: {} = null,
        public headers: {} = null,
        public sendHttps: boolean = false,
        public result_headers: {} = null,
        public nojsonparse: boolean = false,
        public add_content_length_to_headers: boolean = false,
        public json_stringify_posts: boolean = true,
    ) { }
}

export const SendRequestParamVOStatic: IAPIParamTranslatorStatic<SendRequestParamVO> = SendRequestParamVO;
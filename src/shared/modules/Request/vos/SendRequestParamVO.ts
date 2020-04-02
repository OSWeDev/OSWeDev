
export default class SendRequestParamVO {

    public static async translateCheckAccessParams(
        method: string,
        host: string,
        path: string,
        posts: {} = null,
        headers: {} = null,
        sendHttps: boolean = false): Promise<SendRequestParamVO> {

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
}
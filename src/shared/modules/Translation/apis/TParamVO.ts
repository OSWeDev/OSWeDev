export default class TParamVO {

    public static URL: string = ':code_text/:lang_id';

    public static async translateCheckAccessParams(
        code_text: string,
        lang_id: number): Promise<TParamVO> {

        return new TParamVO(code_text, lang_id);
    }

    public static async translateToURL(param: TParamVO): Promise<string> {

        return param ? param.code_text + '/' + param.lang_id : '';
    }
    public static async translateFromREQ(req): Promise<TParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new TParamVO(req.params.code_text, parseInt(req.params.lang_id));
    }

    public constructor(
        public code_text: string,
        public lang_id: number) {
    }
}
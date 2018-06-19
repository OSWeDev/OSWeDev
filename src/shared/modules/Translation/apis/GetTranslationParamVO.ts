export default class GetTranslationParamVO {

    public static URL: string = ':lang_id/:text_id';

    public static async translateCheckAccessParams(
        lang_id: number,
        text_id: number): Promise<GetTranslationParamVO> {

        return new GetTranslationParamVO(lang_id, text_id);
    }

    public static async translateToURL(param: GetTranslationParamVO): Promise<string> {

        return param ? param.lang_id + '/' + param.text_id : '';
    }
    public static async translateFromREQ(req): Promise<GetTranslationParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new GetTranslationParamVO(parseInt(req.params.lang_id), parseInt(req.params.text_id));
    }

    public constructor(
        public lang_id: number,
        public text_id: number) {
    }
}
export default class StringParamVO {

    public static URL: string = ':text';

    public static async translateCheckAccessParams(
        text: string): Promise<StringParamVO> {

        return new StringParamVO(text);
    }

    public static async translateToURL(param: StringParamVO): Promise<string> {

        return param ? param.text : '';
    }
    public static async translateFromREQ(req): Promise<StringParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new StringParamVO(req.params.text);
    }

    public constructor(
        public text: string) {
    }
}
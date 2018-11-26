export default class BooleanParamVO {

    public static URL: string = ':value';

    public static async translateCheckAccessParams(
        value: boolean): Promise<BooleanParamVO> {

        return new BooleanParamVO(value);
    }

    public static async translateToURL(param: BooleanParamVO): Promise<string> {

        return param ? (param.value ? 'true' : 'false') : '';
    }
    public static async translateFromREQ(req): Promise<BooleanParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new BooleanParamVO(req.params.value == 'true');
    }

    public constructor(
        public value: boolean) {
    }
}
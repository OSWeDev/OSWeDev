export default class NumberAndStringParamVO {

    public static URL: string = ':num/:text';

    public static async translateCheckAccessParams(
        num: number, text: string): Promise<NumberAndStringParamVO> {

        return new NumberAndStringParamVO(num, text);
    }

    public static async translateToURL(param: NumberAndStringParamVO): Promise<string> {

        return param ? ((((param.num % 1) === 0) ? param.num.toString() : param.num.toPrecision(10)) + '/' + param.text) : '';
    }
    public static async translateFromREQ(req): Promise<NumberAndStringParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new NumberAndStringParamVO(parseFloat(req.params.num), req.params.text);
    }

    public constructor(
        public num: number,
        public text: string
    ) { }
}
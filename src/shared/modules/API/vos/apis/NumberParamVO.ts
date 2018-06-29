export default class NumberParamVO {

    public static URL: string = ':num';

    public static async translateCheckAccessParams(
        num: number): Promise<NumberParamVO> {

        return new NumberParamVO(num);
    }

    public static async translateToURL(param: NumberParamVO): Promise<string> {

        return param ? (((param.num % 1) === 0) ? param.num.toString() : param.num.toPrecision(10)) : '';
    }
    public static async translateFromREQ(req): Promise<NumberParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new NumberParamVO(parseFloat(req.params.num));
    }

    public constructor(
        public num: number) {
    }
}
import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class NumberAndStringParamVO implements IAPIParamTranslator<NumberAndStringParamVO> {

    public static URL: string = ':num/:text';

    public static fromREQ(req): NumberAndStringParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new NumberAndStringParamVO(parseFloat(req.params.num), req.params.text);
    }

    public static fromParams(num: number, text: string): NumberAndStringParamVO {

        return new NumberAndStringParamVO(num, text);
    }

    public static getAPIParams(param: NumberAndStringParamVO): any[] {
        return [param.num, param.text];
    }

    public constructor(
        public num: number,
        public text: string
    ) { }

    public translateToURL(): string {

        return (((this.num % 1) === 0) ? this.num.toString() : this.num.toPrecision(10)) + '/' + this.text;
    }
}

export const NumberAndStringParamVOStatic: IAPIParamTranslatorStatic<NumberAndStringParamVO> = NumberAndStringParamVO;
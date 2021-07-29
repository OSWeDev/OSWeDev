import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class NumberParamVO implements IAPIParamTranslator<NumberParamVO> {

    public static URL: string = ':num';

    public static fromREQ(req): NumberParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new NumberParamVO(parseFloat(req.params.num));
    }

    public static fromParams(num: number): NumberParamVO {

        return new NumberParamVO(num);
    }

    public static getAPIParams(param: NumberParamVO): any[] {
        return [param.num];
    }

    public constructor(
        public num: number) {
    }

    public translateToURL(): string {

        return ((this.num % 1) === 0) ? this.num.toString() : this.num.toPrecision(10);
    }
}

export const NumberParamVOStatic: IAPIParamTranslatorStatic<NumberParamVO> = NumberParamVO;
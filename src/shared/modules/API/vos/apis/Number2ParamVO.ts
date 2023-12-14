/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class Number2ParamVO implements IAPIParamTranslator<Number2ParamVO> {

    public static URL: string = ':num1/:num2';

    public static fromREQ(req): Number2ParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new Number2ParamVO(parseFloat(req.params.num1), parseFloat(req.params.num2));
    }

    public static fromParams(num1: number, num2: number): Number2ParamVO {

        return new Number2ParamVO(num1, num2);
    }

    public static getAPIParams(param: Number2ParamVO): any[] {
        return [param.num1, param.num2];
    }

    public constructor(
        public num1: number, public num2: number) {
    }

    public translateToURL(): string {

        return (((this.num1 % 1) === 0) ? this.num1.toString() : this.num1.toPrecision(10)) + '/' + (((this.num2 % 1) === 0) ? this.num2.toString() : this.num2.toPrecision(10));
    }
}

export const Number2ParamVOStatic: IAPIParamTranslatorStatic<Number2ParamVO> = Number2ParamVO;
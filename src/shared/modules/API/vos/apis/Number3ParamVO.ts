/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class Number3ParamVO implements IAPIParamTranslator<Number3ParamVO> {

    public static URL: string = ':num1/:num2/:num3';

    public static fromREQ(req): Number3ParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new Number3ParamVO(parseFloat(req.params.num1), parseFloat(req.params.num2), parseFloat(req.params.num3));
    }

    public static fromParams(num1: number, num2: number, num3: number): Number3ParamVO {

        return new Number3ParamVO(num1, num2, num3);
    }

    public static getAPIParams(param: Number3ParamVO): any[] {
        return [param.num1, param.num2, param.num3];
    }

    public constructor(
        public num1: number, public num2: number, public num3: number) {
    }

    public translateToURL(): string {

        return (((this.num1 % 1) === 0) ? this.num1.toString() : this.num1.toPrecision(10)) + '/' + (((this.num2 % 1) === 0) ? this.num2.toString() : this.num2.toPrecision(10)) + '/' + (((this.num3 % 1) === 0) ? this.num3.toString() : this.num3.toPrecision(10));
    }
}

export const Number3ParamVOStatic: IAPIParamTranslatorStatic<Number3ParamVO> = Number3ParamVO;
/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class StringAndNumberParamVO implements IAPIParamTranslator<StringAndNumberParamVO> {

    public static URL: string = ':text/:num';

    public static fromREQ(req): StringAndNumberParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new StringAndNumberParamVO(req.params.text, parseFloat(req.params.num));
    }

    public static fromParams(text: string, num: number): StringAndNumberParamVO {

        return new StringAndNumberParamVO(text, num);
    }

    public static getAPIParams(param: StringAndNumberParamVO): any[] {
        return [param.text, param.num];
    }

    public constructor(
        public text: string,
        public num: number
    ) { }

    public translateToURL(): string {

        return this.text + '/' + (((this.num % 1) === 0) ? this.num.toString() : this.num.toPrecision(10));
    }
}

export const StringAndNumberParamVOStatic: IAPIParamTranslatorStatic<StringAndNumberParamVO> = StringAndNumberParamVO;
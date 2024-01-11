/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class StringAndBooleanParamVO implements IAPIParamTranslator<StringAndBooleanParamVO> {

    public static URL: string = ':text/:bool';

    public static fromREQ(req): StringAndBooleanParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new StringAndBooleanParamVO(req.params.text, req.params.bool == 'true');
    }

    public static fromParams(text: string, bool: boolean): StringAndBooleanParamVO {
        return new StringAndBooleanParamVO(text, bool);
    }

    public static getAPIParams(param: StringAndBooleanParamVO): any[] {
        return [param.text, param.bool];
    }

    public constructor(
        public text: string,
        public bool: boolean
    ) {
    }

    public translateToURL(): string {

        return this.text + '/' + (this.bool ? 'true' : 'false');
    }
}

export const StringAndBooleanParamVOStatic: IAPIParamTranslatorStatic<StringAndBooleanParamVO> = StringAndBooleanParamVO;
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class SetParamParamVO implements IAPIParamTranslator<SetParamParamVO> {

    public static fromParams(param_name: string, param_value: string | number | boolean): SetParamParamVO {

        return new SetParamParamVO(param_name, param_value);
    }

    public constructor(
        public param_name: string,
        public param_value: string | number | boolean) {
    }

    public getAPIParams(): any[] {
        return [this.param_name, this.param_value];
    }
}

export const SetParamParamVOStatic: IAPIParamTranslatorStatic<SetParamParamVO> = SetParamParamVO;
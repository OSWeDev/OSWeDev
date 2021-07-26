import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class String2ParamVO implements IAPIParamTranslator<String2ParamVO> {

    public static URL: string = ':text/:text2';

    public static fromREQ(req): String2ParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new String2ParamVO(req.params.text, req.params.text2);
    }

    public static fromParams(text: string, text2: string): String2ParamVO {
        return new String2ParamVO(text, text2);
    }

    public static getAPIParams(param: String2ParamVO): any[] {
        return [param.text, param.text2];
    }

    public constructor(
        public text: string,
        public text2: string) {
    }

    public translateToURL(): string {

        return this.text + "/" + this.text2;
    }
}

export const String2ParamVOStatic: IAPIParamTranslatorStatic<String2ParamVO> = String2ParamVO;
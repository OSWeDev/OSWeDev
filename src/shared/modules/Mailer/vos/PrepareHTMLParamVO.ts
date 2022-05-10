import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class PrepareHTMLParamVO implements IAPIParamTranslator<PrepareHTMLParamVO> {

    public static fromParams(template: string, lang_id: number, vars: { [name: string]: string }): PrepareHTMLParamVO {

        return new PrepareHTMLParamVO(template, lang_id, vars);
    }

    public static getAPIParams(param: PrepareHTMLParamVO): any[] {
        return [param.template, param.lang_id, param.vars];
    }

    public constructor(
        public template: string,
        public lang_id: number,
        public vars: { [name: string]: string }) {
    }
}

export const PrepareHTMLParamVOStatic: IAPIParamTranslatorStatic<PrepareHTMLParamVO> = PrepareHTMLParamVO;
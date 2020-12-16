import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class StringParamVO implements IAPIParamTranslator<StringParamVO> {

    public static URL: string = ':text';

    public static fromREQ(req): StringParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new StringParamVO(req.params.text);
    }

    public static fromParams(text: string): StringParamVO {
        return new StringParamVO(text);
    }

    public constructor(
        public text: string) {
    }

    public getAPIParams(): any[] {
        return [this.text];
    }

    public translateToURL(): string {

        return this.text;
    }
}

export const StringParamVOStatic: IAPIParamTranslatorStatic<StringParamVO> = StringParamVO;
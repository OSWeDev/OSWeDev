import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class TParamVO implements IAPIParamTranslator<TParamVO> {

    public static URL: string = ':code_text/:lang_id';

    public static fromREQ(req): TParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new TParamVO(req.params.code_text, parseInt(req.params.lang_id));
    }

    public static fromParams(code_text: string, lang_id: number): TParamVO {

        return new TParamVO(code_text, lang_id);
    }

    public constructor(
        public code_text: string,
        public lang_id: number) {
    }

    public translateToURL(): string {

        return this.code_text + '/' + this.lang_id;
    }

    public getAPIParams(): any[] {
        return [this.code_text, this.lang_id];
    }
}

export const TParamVOStatic: IAPIParamTranslatorStatic<TParamVO> = TParamVO;
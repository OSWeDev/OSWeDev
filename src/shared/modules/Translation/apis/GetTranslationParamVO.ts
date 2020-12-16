import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class GetTranslationParamVO implements IAPIParamTranslator<GetTranslationParamVO> {

    public static URL: string = ':lang_id/:text_id';

    public static fromREQ(req): GetTranslationParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new GetTranslationParamVO(parseInt(req.params.lang_id), parseInt(req.params.text_id));
    }

    public static fromParams(lang_id: number, text_id: number): GetTranslationParamVO {

        return new GetTranslationParamVO(lang_id, text_id);
    }

    public constructor(
        public lang_id: number,
        public text_id: number) {
    }

    public translateToURL(): string {

        return this.lang_id + '/' + this.text_id;
    }

    public getAPIParams(): any[] {
        return [this.lang_id, this.text_id];
    }
}

export const GetTranslationParamVOStatic: IAPIParamTranslatorStatic<GetTranslationParamVO> = GetTranslationParamVO;
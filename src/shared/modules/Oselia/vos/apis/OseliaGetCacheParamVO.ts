import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import GPTAssistantAPIThreadVO from "../../../GPT/vos/GPTAssistantAPIThreadVO";

export default class OseliaGetCacheParamVO implements IAPIParamTranslator<OseliaGetCacheParamVO> {

    public constructor(
        public thread_vo: GPTAssistantAPIThreadVO,
        public key: string,
    ) { }

    public static fromParams(
        thread_vo: GPTAssistantAPIThreadVO,
        key: string,
    ): OseliaGetCacheParamVO {

        return new OseliaGetCacheParamVO(
            thread_vo,
            key,
        );
    }

    public static getAPIParams(param: OseliaGetCacheParamVO): any[] {
        return [
            param.thread_vo,
            param.key,
        ];
    }
}

export const OseliaGetCacheParamVOStatic: IAPIParamTranslatorStatic<OseliaGetCacheParamVO> = OseliaGetCacheParamVO;
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import GPTAssistantAPIThreadVO from "../../../GPT/vos/GPTAssistantAPIThreadVO";

export default class OseliaSetCacheParamVO implements IAPIParamTranslator<OseliaSetCacheParamVO> {

    public constructor(
        public thread_vo: GPTAssistantAPIThreadVO,
        public key: string,
        public value: string,
        public thread_id: number
    ) { }

    public static fromParams(
        thread_vo: GPTAssistantAPIThreadVO,
        key: string,
        value: string,
        thread_id: number
    ): OseliaSetCacheParamVO {

        return new OseliaSetCacheParamVO(
            thread_vo,
            key,
            value,
            thread_id
        );
    }

    public static getAPIParams(param: OseliaSetCacheParamVO): any[] {
        return [
            param.thread_vo,
            param.key,
            param.value,
            param.thread_id
        ];
    }
}

export const OseliaSetCacheParamVOStatic: IAPIParamTranslatorStatic<OseliaSetCacheParamVO> = OseliaSetCacheParamVO;
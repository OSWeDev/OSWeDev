import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import GPTAssistantAPIThreadVO from "../../../GPT/vos/GPTAssistantAPIThreadVO";

export default class OseliaUpdateVOFieldParamVO implements IAPIParamTranslator<OseliaUpdateVOFieldParamVO> {

    public constructor(
        public thread_vo: GPTAssistantAPIThreadVO,
        public value: string,
        public field_name: string,
        public vo: string,
    ) { }

    public static fromParams(
        thread_vo: GPTAssistantAPIThreadVO,
        field_name: string,
        value: string,
        vo: string,
    ): OseliaUpdateVOFieldParamVO {

        return new OseliaUpdateVOFieldParamVO(
            thread_vo,
            vo,
            field_name,
            value
        );
    }

    public static getAPIParams(param: OseliaUpdateVOFieldParamVO): any[] {
        return [
            param.thread_vo,
            param.field_name,
            param.value,
            param.vo
        ];
    }
}

export const OseliaUpdateVOFieldParamVOStatic: IAPIParamTranslatorStatic<OseliaUpdateVOFieldParamVO> = OseliaUpdateVOFieldParamVO;
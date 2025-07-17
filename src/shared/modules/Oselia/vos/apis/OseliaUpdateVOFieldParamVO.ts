import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import GPTAssistantAPIThreadVO from "../../../GPT/vos/GPTAssistantAPIThreadVO";

export default class OseliaUpdateVOFieldParamVO implements IAPIParamTranslator<OseliaUpdateVOFieldParamVO> {

    public constructor(
        public vo: string,
        public field_name: string,
        public value: string
    ) { }

    public static fromParams(
        vo: string,
        field_name: string,
        value: string
    ): OseliaUpdateVOFieldParamVO {

        return new OseliaUpdateVOFieldParamVO(
            vo,
            field_name,
            value
        );
    }

    public static getAPIParams(param: OseliaUpdateVOFieldParamVO): any[] {
        return [
            param.vo,
            param.field_name,
            param.value
        ];
    }
}

export const OseliaUpdateVOFieldParamVOStatic: IAPIParamTranslatorStatic<OseliaUpdateVOFieldParamVO> = OseliaUpdateVOFieldParamVO;
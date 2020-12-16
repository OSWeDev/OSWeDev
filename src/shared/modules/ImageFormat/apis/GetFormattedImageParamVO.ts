import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class GetFormattedImageParamVO implements IAPIParamTranslator<GetFormattedImageParamVO> {

    public static fromParams(
        src: string,
        format_name: string,
        width: number,
        height: number): GetFormattedImageParamVO {

        return new GetFormattedImageParamVO(src,
            format_name,
            width,
            height);
    }

    public constructor(
        public src: string,
        public format_name: string,
        public width: number,
        public height: number) {
    }

    public getAPIParams(): any[] {
        return [this.src, this.format_name, this.width, this.height];
    }
}

export const GetFormattedImageParamVOStatic: IAPIParamTranslatorStatic<GetFormattedImageParamVO> = GetFormattedImageParamVO;
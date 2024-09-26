import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import FileVO from "../../../File/vos/FileVO";

export default class OseliaScreenshotParamVO implements IAPIParamTranslator<OseliaScreenshotParamVO> {

    public constructor(
        public track: MediaStreamTrack
    ) { }

    public static fromParams(
        track: MediaStreamTrack
    ): OseliaScreenshotParamVO {

        return new OseliaScreenshotParamVO(
            track
        );
    }

    public static getAPIParams(param: OseliaScreenshotParamVO): any[] {
        return [
            param.track
        ];
    }
}

export const OseliaScreenshotParamVOStatic: IAPIParamTranslatorStatic<OseliaScreenshotParamVO> = OseliaScreenshotParamVO;
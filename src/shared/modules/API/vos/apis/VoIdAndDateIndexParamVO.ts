import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class VoIdAndDateIndexParamVO implements IAPIParamTranslator<VoIdAndDateIndexParamVO>{

    public static URL: string = ':vo_id/:date_index';

    public static fromREQ(req): VoIdAndDateIndexParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new VoIdAndDateIndexParamVO(req.params.vo_id, req.params.date_index);
    }

    public static fromParams(vo_id: number, date_index: string): VoIdAndDateIndexParamVO {
        return new VoIdAndDateIndexParamVO(vo_id, date_index);
    }

    public constructor(
        public vo_id: number,
        public date_index: string) {
    }

    public translateToURL(): string {

        return this.vo_id + '/' + this.date_index;
    }

    public getAPIParams(): any[] {
        return [this.vo_id, this.date_index];
    }
}

export const VoIdAndDateIndexParamVOStatic: IAPIParamTranslatorStatic<VoIdAndDateIndexParamVO> = VoIdAndDateIndexParamVO;
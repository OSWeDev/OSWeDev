
export default class VoIdAndDateIndexParamVO {

    public static URL: string = ':vo_id/:date_index';

    public static async translateCheckAccessParams(
        vo_id: number,
        date_index: string): Promise<VoIdAndDateIndexParamVO> {

        return new VoIdAndDateIndexParamVO(vo_id, date_index);
    }

    public static async translateToURL(param: VoIdAndDateIndexParamVO): Promise<string> {

        return param ? param.vo_id + '/' + param.date_index : '';
    }
    public static async translateFromREQ(req): Promise<VoIdAndDateIndexParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new VoIdAndDateIndexParamVO(req.params.vo_id, req.params.date_index);
    }

    public constructor(
        public vo_id: number,
        public date_index: string) {
    }
}
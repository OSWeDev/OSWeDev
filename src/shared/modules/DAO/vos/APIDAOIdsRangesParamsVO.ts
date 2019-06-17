import NumRange from '../../DataRender/vos/NumRange';

export default class APIDAOIdsRangesParamsVO {

    public static URL: string = ':api_type_id/:ranges';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        ranges: NumRange[]): Promise<APIDAOIdsRangesParamsVO> {

        return new APIDAOIdsRangesParamsVO(API_TYPE_ID, ranges);
    }

    public static async translateToURL(param: APIDAOIdsRangesParamsVO): Promise<string> {

        let range_txt: string = "";
        for (let i in param.ranges) {

            range_txt += (range_txt == "") ? "" : "_";
            range_txt += param.ranges[i].min + "-";
            range_txt += param.ranges[i].max + "-";
            range_txt += (param.ranges[i].min_inclusiv ? "I" : "") + "-";
            range_txt += (param.ranges[i].max_inclusiv ? "I" : "") + "-";
        }
        return param ? param.API_TYPE_ID + '/' + range_txt : '';
    }
    public static async translateFromREQ(req): Promise<APIDAOIdsRangesParamsVO> {

        if (!(req && req.params)) {
            return null;
        }

        let ranges_txt: string[] = req.params.ranges.split('_');
        let ranges: NumRange[] = [];
        for (let i in ranges_txt) {

            let range_elts = ranges_txt[i].split('-');
            ranges.push(NumRange.createNew(parseFloat(range_elts[0]), parseFloat(range_elts[1]), range_elts[2] == 'I', range_elts[3] == 'I'));
        }
        return new APIDAOIdsRangesParamsVO(req.params.api_type_id, ranges);
    }

    public constructor(
        public API_TYPE_ID: string,
        public ranges: NumRange[]) {
    }
}
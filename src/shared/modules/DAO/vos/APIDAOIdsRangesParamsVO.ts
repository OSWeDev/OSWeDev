/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import NumRange from '../../DataRender/vos/NumRange';

export default class APIDAOIdsRangesParamsVO implements IAPIParamTranslator<APIDAOIdsRangesParamsVO> {

    public static URL: string = ':api_type_id/:ranges';

    public static fromParams(API_TYPE_ID: string, ranges: NumRange[]): APIDAOIdsRangesParamsVO {

        return new APIDAOIdsRangesParamsVO(API_TYPE_ID, ranges);
    }

    public static fromREQ(req): APIDAOIdsRangesParamsVO {

        if (!(req && req.params)) {
            return null;
        }

        const ranges_txt: string[] = req.params.ranges.split('_');
        const ranges: NumRange[] = [];
        for (const i in ranges_txt) {

            const range_elts = ranges_txt[i].split('-');
            ranges.push(NumRange.createNew(parseFloat(range_elts[0]), parseFloat(range_elts[1]), range_elts[2] == 'i', range_elts[3] == 'i', parseFloat(range_elts[4])));
        }
        return new APIDAOIdsRangesParamsVO(req.params.api_type_id, ranges);
    }

    public static getAPIParams(param: APIDAOIdsRangesParamsVO): any[] {
        return [param.API_TYPE_ID, param.ranges];
    }

    public constructor(
        public API_TYPE_ID: string,
        public ranges: NumRange[]) {
    }

    public translateToURL(): string {

        let range_txt: string = "";
        for (const i in this.ranges) {

            range_txt += (range_txt == "") ? "" : "_";
            range_txt += this.ranges[i].min + "-";
            range_txt += this.ranges[i].max + "-";
            range_txt += (this.ranges[i].min_inclusiv ? "i" : "") + "-";
            range_txt += (this.ranges[i].max_inclusiv ? "i" : "") + "-";
            range_txt += this.ranges[i].segment_type + "-";
        }
        return this.API_TYPE_ID + '/' + range_txt;
    }
}

export const APIDAOIdsRangesParamsVOStatic: IAPIParamTranslatorStatic<APIDAOIdsRangesParamsVO> = APIDAOIdsRangesParamsVO;
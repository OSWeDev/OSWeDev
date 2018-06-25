import TimeSegment from '../TimeSegment';

export default class GetRenderedSegmentParamVO {

    public static URL: string = ':dateIndex/:type';

    public static async translateCheckAccessParams(
        timeSegment: TimeSegment): Promise<GetRenderedSegmentParamVO> {

        return new GetRenderedSegmentParamVO(timeSegment);
    }

    public static async translateToURL(param: GetRenderedSegmentParamVO): Promise<string> {

        return param ? param.timeSegment.dateIndex + '/' + param.timeSegment.type : '';
    }
    public static async translateFromREQ(req): Promise<GetRenderedSegmentParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new GetRenderedSegmentParamVO(TimeSegment.fromDateAndType(req.params.dateIndex, req.params.type));
    }

    public constructor(
        public timeSegment: TimeSegment) {
    }
}
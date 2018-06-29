import TimeSegment from '../../../DataRender/vos/TimeSegment';

export default class TimeSegmentParamVO {

    public static URL: string = ':date_index/:type';

    public static async translateCheckAccessParams(
        timeSegment: TimeSegment): Promise<TimeSegmentParamVO> {

        return new TimeSegmentParamVO(timeSegment);
    }

    public static async translateToURL(param: TimeSegmentParamVO): Promise<string> {

        return param ? param.timeSegment.dateIndex + '/' + param.timeSegment.type : '';
    }
    public static async translateFromREQ(req): Promise<TimeSegmentParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new TimeSegmentParamVO(TimeSegment.fromDateAndType(req.params.date_index, req.params.type));
    }

    public constructor(
        public timeSegment: TimeSegment) {
    }
}
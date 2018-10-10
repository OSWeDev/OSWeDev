import TimeSegment from '../../DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../tools/TimeSegmentHandler';

export default class ProgramSegmentParamVO {

    public static URL: string = ':program_id/:date_index/:segment_type';

    public static async translateCheckAccessParams(
        program_id: number,
        timeSegment: TimeSegment): Promise<ProgramSegmentParamVO> {

        return new ProgramSegmentParamVO(program_id, timeSegment);
    }

    public static async translateToURL(param: ProgramSegmentParamVO): Promise<string> {

        return param ? param.program_id + '/' + param.timeSegment.dateIndex + '/' + param.timeSegment.type : '';
    }
    public static async translateFromREQ(req): Promise<ProgramSegmentParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new ProgramSegmentParamVO(req.params.program_id, TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(req.params.date_index, parseInt(req.params.segment_type)));
    }

    public constructor(
        public program_id: number,
        public timeSegment: TimeSegment) {
    }
}
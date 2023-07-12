/* istanbul ignore file : nothing to test in ParamVOs */

import TimeSegment from '../../DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../tools/TimeSegmentHandler';
import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';

export default class ProgramSegmentParamVO implements IAPIParamTranslator<ProgramSegmentParamVO> {

    public static URL: string = ':program_id/:date_index/:segment_type';

    public static fromREQ(req): ProgramSegmentParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new ProgramSegmentParamVO(req.params.program_id, TimeSegmentHandler.getCorrespondingTimeSegment(parseInt(req.params.date_index.toString()), parseInt(req.params.segment_type)));
    }

    public static fromParams(program_id: number, timeSegment: TimeSegment): ProgramSegmentParamVO {

        return new ProgramSegmentParamVO(program_id, timeSegment);
    }

    public static getAPIParams(param: ProgramSegmentParamVO): any[] {
        return [param.program_id, param.timeSegment];
    }

    public constructor(
        public program_id: number,
        public timeSegment: TimeSegment) {
    }

    public translateToURL(): string {

        return this.program_id + '/' + this.timeSegment.index + '/' + this.timeSegment.type;
    }
}

export const ProgramSegmentParamVOStatic: IAPIParamTranslatorStatic<ProgramSegmentParamVO> = ProgramSegmentParamVO;
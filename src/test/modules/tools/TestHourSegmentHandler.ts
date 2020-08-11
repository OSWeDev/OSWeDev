import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import HourSegmentHandler from '../../../shared/tools/HourSegmentHandler';
import HourSegment from '../../../shared/modules/DataRender/vos/HourSegment';



describe('HourSegmentHandler', () => {
    it('test getParentHourSegment', () => {
        let typeHour: HourSegment = HourSegment.createNew(moment.duration(50), HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(typeHour)).to.equal(null);
    });
});

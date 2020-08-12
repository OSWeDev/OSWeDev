import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import HourSegmentHandler from '../../../shared/tools/HourSegmentHandler';
import HourSegment from '../../../shared/modules/DataRender/vos/HourSegment';



describe('HourSegmentHandler', () => {
    it('test: getBiggestHourSegmentationType', () => {
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(null, null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(1, null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(null, 2)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(1, 4)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(-2, 2)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(1, 2)).to.equal(1);

    });
    it('test: getSmallestHourSegmentationType', () => {
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(null, null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(1, null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(null, 2)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(1, 4)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(-2, 2)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(1, 2)).to.equal(2);

    });

});

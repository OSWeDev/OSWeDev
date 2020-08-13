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
        expect(HourSegmentHandler.getInstance().getBiggestHourSegmentationType(1, 2)).to.equal(1);

    });
    it('test: getSmallestHourSegmentationType', () => {
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(null, null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(1, null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(null, 2)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getSmallestHourSegmentationType(1, 2)).to.equal(2);

    });
    it('test: getStartHour', () => {
        expect(HourSegmentHandler.getInstance().getStartHour(null, null)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getStartHour(null, 0)).to.deep.equal(null);
        let durationTest = moment.duration('23:59:59.999');
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, null)).to.deep.equal(null);
        let durationExpectation = moment.duration(999);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_MS).milliseconds()).to.deep.equal(durationExpectation.milliseconds());
        durationExpectation = moment.duration(59 * 10 * 1000 + 999);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_SECOND).milliseconds()).to.deep.equal(durationExpectation.milliseconds());
        durationExpectation = moment.duration(59 * 60 * 60 * 1000 + 59 * 60 * 1000 + 999);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_MINUTE).milliseconds()).to.deep.equal(durationExpectation.milliseconds());
        durationExpectation = moment.duration(23 * 60 * 60 * 59 * 60 * 60 * 1000 + 59 * 60 * 1000 + 999 + 54122222);
        //expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_HOUR).milliseconds()).to.deep.equal(durationExpectation.milliseconds());
        durationTest = moment.duration(2, 'hours');
        durationExpectation = moment.duration(7200000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, 1)).to.deep.equal(durationExpectation);
        durationTest = moment.duration('23:59');
        durationExpectation = moment.duration(86340000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, 2)).to.deep.equal(durationExpectation);
    });

    it('test: getCorrespondingMomentUnitOfTime', () => {
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(null)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(0)).to.equal('hour');
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(1)).to.equal('minute');
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(2)).to.equal('second');
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(3)).to.equal('ms');
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(4)).to.equal(null);
        expect(HourSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(-1)).to.equal(null);


    });

    it('test: segmentsAreAquivalent', () => {
        let duration1 = moment.duration(1000);
        let duration1bis = moment.duration(1000);
        let duration2 = moment.duration(2000);
        let segment1: HourSegment = HourSegment.createNew(duration1, HourSegment.TYPE_SECOND);
        let segment1bis: HourSegment = HourSegment.createNew(duration1bis, HourSegment.TYPE_SECOND);
        let segment2: HourSegment = HourSegment.createNew(duration1bis, HourSegment.TYPE_MS);
        let segment3: HourSegment = HourSegment.createNew(duration2, HourSegment.TYPE_SECOND);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, null)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, segment1)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, null)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment1)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment1bis)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment2)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment3)).to.equal(false);
    });

});

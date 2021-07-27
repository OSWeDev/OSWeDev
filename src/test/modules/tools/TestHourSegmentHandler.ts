import { expect } from 'chai';
import 'mocha';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import HourRange from '../../../shared/modules/DataRender/vos/HourRange';
import HourSegment from '../../../shared/modules/DataRender/vos/HourSegment';
import Durations from '../../../shared/modules/FormatDatesNombres/Dates/Durations';
import HourSegmentHandler from '../../../shared/tools/HourSegmentHandler';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();





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

    it('test: getAllSegments', () => {
        let duration1 = 1000;
        let duration2 = 2000;
        let duration3 = 3000;
        let segmentExpected = [HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND), HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND)];

        expect(HourSegmentHandler.getInstance().getAllSegments(null, duration2, HourSegment.TYPE_SECOND)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getAllSegments(duration1, null, HourSegment.TYPE_SECOND)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getAllSegments(duration1, duration2, HourSegment.TYPE_SECOND)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.getInstance().getAllSegments(duration1, duration3, HourSegment.TYPE_SECOND, true)).to.deep.equal(segmentExpected);

    });

    it('test: getParentHourSegment', () => {
        let duration = ((26 * 60) + 15) * 60 + 37;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(26 * 60 * 60, HourSegment.TYPE_HOUR);
        let minuteConverted = HourSegmentHandler.getInstance().getCorrespondingHourSegment(((26 * 60) + 15) * 60, HourSegment.TYPE_MINUTE);
        let secondConverted = HourSegmentHandler.getInstance().getCorrespondingHourSegment(((26 * 60) + 15) * 60 + 37, HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getInstance().getParentHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(hour)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(minute)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(second)).to.deep.equal(minuteConverted);
    });

    it('test: getCumulHourSegments', () => {
        let duration = ((26 * 60) + 15) * 60 + 37;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let minuteExpected = HourSegmentHandler.getInstance().getAllSegments(26 * 60 * 60, ((26 * 60) + 15) * 60, HourSegment.TYPE_MINUTE, false);
        let secondExpected = HourSegmentHandler.getInstance().getAllSegments(((26 * 60) + 15) * 60, ((26 * 60) + 15) * 60 + 37, HourSegment.TYPE_SECOND, false);

        expect(HourSegmentHandler.getInstance().getCumulHourSegments(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(hour)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(second)).to.deep.equal(secondExpected);
    });

    it('test: getStartHour', () => {
        let durationTest = ((23 * 60) + 59) * 60 + 45;

        expect(HourSegmentHandler.getInstance().getStartHour(null, null)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getStartHour(null, 0)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, null)).to.deep.equal(null);

        //la fonction n'a pas l'air de garder juste l'heure, je supose qu'elle convertit en ms de maniere exacte (impact peut-etre tests getStartHourSegment)
        let durationExpected = 23 * 60 * 60;
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_HOUR)).to.deep.equal(durationExpected);

        durationExpected = 23 * 60 * 60 + 59 * 60;
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_MINUTE)).to.deep.equal(durationExpected);

        durationExpected = 23 * 60 * 60 + 59 * 60 + 45;
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_SECOND)).to.deep.equal(durationExpected);

        durationTest = 2 * 60 * 60;
        durationExpected = 7200;
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, 1)).to.deep.equal(durationExpected);
        durationTest = ((23 * 60) + 59) * 60;
        durationExpected = 86340;
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, 2)).to.deep.equal(durationExpected);
    });

    it('test: getStartHourSegment', () => {
        let duration = ((23 * 60) + 59) * 60 + 45;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let hourExpected = 23 * 60 * 60;
        let minuteExpected = ((23 * 60) + 59) * 60;
        let secondExpected = ((23 * 60) + 59) * 60 + 45;

        expect(HourSegmentHandler.getInstance().getStartHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getStartHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getStartHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getStartHourSegment(second)).to.deep.equal(secondExpected);
    });

    it('test: getEndHourSegment', () => {
        let duration = (23 * 60 + 55) * 60 + 45;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let hourExpected = 24 * 60 * 60;
        let minuteExpected = (23 * 60 + 56) * 60;
        let secondExpected = (23 * 60 + 55) * 60 + 46;

        expect(HourSegmentHandler.getInstance().getEndHourSegment(null)).equal(null);

        expect(HourSegmentHandler.getInstance().getEndHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getEndHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getEndHourSegment(second)).to.deep.equal(secondExpected);
    });


    it('test: getInclusiveEndHourSegment', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

        let hourExpected = (24 * 60 + 0) * 60 + 0;
        let minuteExpected = (23 * 60 + 46) * 60 + 0;
        let secondExpected = (23 * 60 + 46) * 60 + 0;

        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(null)).equal(null);

        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(second)).to.deep.equal(secondExpected);
    });

    it('test: getPreviousHourSegments', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment((((23 * 60 + 0) * 60 + 0) + 0 - 60 * 60), HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment((((23 * 60 + 45) * 60 + 0) + 0 - 1 * 60), HourSegment.TYPE_MINUTE);
        let secondExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment((((23 * 60 + 45) * 60 + 59) + 0 - 1), HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getInstance().getPreviousHourSegments(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegments([null])).to.deep.equal([null]);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegments([hour, minute, second])).to.deep.equal([hourExpected, minuteExpected, secondExpected]);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegments([hour, null])).to.deep.equal([hourExpected, null]);
    });

    it('test: getPreviousHourSegment', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(((23 * 60 + 0) * 60 + 0 + 0 - 60 * 60), HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(((23 * 60 + 45) * 60 + 0 + 0 - 1 * 60), HourSegment.TYPE_MINUTE);
        let secondExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(((23 * 60 + 45) * 60 + 59 + 0 - 1), HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(second)).to.deep.equal(secondExpected);
    });

    it('test: decHourSegment', () => {
        expect(HourSegmentHandler.getInstance().decHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().decHourSegment(null, null, 0)).equal(null);

        let duration = (18 * 60 + 27) * 60 + 49;
        let hourSeg: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);

        HourSegmentHandler.getInstance().decHourSegment(hourSeg, HourSegment.TYPE_HOUR, 1);
        let hourSegExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(17 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);

        HourSegmentHandler.getInstance().decHourSegment(hourSeg, HourSegment.TYPE_HOUR, 1);
        hourSegExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(16 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);

        HourSegmentHandler.getInstance().decHourSegment(hourSeg, null, 1);
        hourSegExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(15 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);

        HourSegmentHandler.getInstance().decHourSegment(hourSeg, HourSegment.TYPE_MINUTE, -60);
        hourSegExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(16 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);
    });

    it('test: incHourSegment', () => {
        expect(HourSegmentHandler.getInstance().incHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().incHourSegment(null, null, 0)).equal(null);
    });

    it('test: incElt', () => {
        let duration = (23 * 60 + 45) * 60 + 59;

        let durationExpected = (23 * 60 + 45) * 60 + 59;
        duration = Durations.add(duration, null, null);
        expect(duration).to.deep.equal(durationExpected);


        durationExpected = (24 * 60 + 45) * 60 + 59;
        duration = Durations.add(duration, 1, HourSegment.TYPE_HOUR);
        expect(duration).to.deep.equal(durationExpected);

        durationExpected = (24 * 60 + 46) * 60 + 59;
        duration = Durations.add(duration, 1, HourSegment.TYPE_MINUTE);
        expect(duration).to.deep.equal(durationExpected);
    });

    //ici y a un probleme bizarre ue
    it('test: decMoment', () => {
        let duration = (23 * 60 + 45) * 60 + 59;

        let durationExpected = (23 * 60 + 45) * 60 + 59;
        duration = Durations.add(duration, null, null);
        expect(duration).to.deep.equal(durationExpected);


        durationExpected = (22 * 60 + 45) * 60 + 59;
        duration = Durations.add(duration, 1, HourSegment.TYPE_HOUR);
        expect(duration).to.deep.equal(durationExpected);

        durationExpected = (23 * 60 + 44) * 60 + 59;
        duration = Durations.add(duration, 1, HourSegment.TYPE_MINUTE);
        expect(duration).to.deep.equal(durationExpected);
    });

    it('test: getCorrespondingHourSegment', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date - 60 * 60 * 1000, HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date + 60 * 1000, HourSegment.TYPE_MINUTE);

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(null, null, 0)).equal(null);

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR, -1)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE, 1)).to.deep.equal(minuteExpected);
    });

    it('test: getCorrespondingHourSegments', () => {
        let date1 = (23 * 60 + 45) * 60 + 59;
        let date2 = (18 * 60 + 39) * 60 + 21;
        let dates = [date1, date2];

        let segment11 = HourSegmentHandler.getInstance().getCorrespondingHourSegment((24 * 60 + 45) * 60 + 59, HourSegment.TYPE_HOUR);
        let segment12 = HourSegmentHandler.getInstance().getCorrespondingHourSegment((19 * 60 + 39) * 60 + 21, HourSegment.TYPE_HOUR);
        let Expected1 = [segment11, segment12];

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(null, null, null)).to.deep.equal([]);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(null, null, 0)).to.deep.equal([]);

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(dates, HourSegment.TYPE_HOUR, 1)).to.deep.equal(Expected1);
    });

    it('test: isEltInSegment', () => {
        let date = (23 * 60 + 59) * 60 + 45;
        let segment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);

        expect(HourSegmentHandler.getInstance().isEltInSegment(null, null)).equal(false);
        expect(HourSegmentHandler.getInstance().isEltInSegment(null, segment)).equal(false);
        expect(HourSegmentHandler.getInstance().isEltInSegment(date, null)).equal(false);


        expect(HourSegmentHandler.getInstance().isEltInSegment(date, segment)).equal(true);

        let otherDate = (22 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(false);
        otherDate = (24 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(false);
        otherDate = (24 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(false);
        otherDate = (23 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(true);
        otherDate = (23 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(true);
    });

    it('test: isInSameSegmentType', () => {
        let date = (22 * 60 + 59) * 60 + 45;
        let segment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let otherDate = (22 * 60 + 59) * 60 + 59;
        let otherSegment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);

        expect(HourSegmentHandler.getInstance().isInSameSegmentType(null, null)).equal(false);
        expect(HourSegmentHandler.getInstance().isInSameSegmentType(null, otherSegment)).equal(false);
        expect(HourSegmentHandler.getInstance().isInSameSegmentType(segment, null)).equal(false);


        expect(HourSegmentHandler.getInstance().isInSameSegmentType(segment, otherSegment)).equal(true);

        otherDate = 23 * 60 * 60;
        otherSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);
    });

    it('test: segmentsAreEquivalent', () => {
        let date = (22 * 60 + 59) * 60 + 45;
        let segment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);
        let otherDate = (22 * 60 + 59) * 60 + 59;
        let otherSegment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(otherDate, HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, null)).to.deep.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, otherSegment)).to.deep.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment, null)).to.deep.equal(false);


        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment, otherSegment)).to.deep.equal(false);

        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment, segment)).to.deep.equal(true);
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
        let duration1 = 1000;
        let duration1bis = 1000;
        let duration2 = 2000;
        let segment1: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND);
        let segment1bis: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1bis, HourSegment.TYPE_SECOND);
        let segment3: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, null)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, segment1)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, null)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment1)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment1bis)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment3)).to.equal(false);
    });

    it('test: get_segment_from_range_start', () => {
        let duration1 = (22 * 60 + 37) * 60 + 45;
        let duration2 = (22 * 60 + 59) * 60 + 45;
        let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
        let segmentExpectedmin: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
        let segmentExpected: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, null)).to.deep.equal(segmentExpectedmin);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).to.deep.equal(null);
    });

    it('test: get_segment_from_range_end', () => {
        let duration1 = (22 * 60 + 37) * 60 + 45;
        let duration2 = (22 * 60 + 59) * 60 + 45;
        let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
        let segmentExpectedmin: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
        let segmentExpected: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, null)).to.deep.equal(segmentExpectedmin);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).to.deep.equal(null);
    });

    it('test: get_hour_ranges_', () => {
        let duration1 = (22 * 60 + 37) * 60 + 45;
        let duration2 = (22 * 60 + 59) * 60 + 45;
        let segment1: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        let segment2: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration2, HourSegment.TYPE_HOUR);
        let segments = [segment1, segment2];
        let hourRange1: HourRange = HourRange.createNew(22 * 60 * 60, 23 * 60 * 60, true, false, HourSegment.TYPE_HOUR);
        let hourRange2: HourRange = HourRange.createNew(22 * 60 * 60, 23 * 60 * 60, true, false, HourSegment.TYPE_HOUR);
        let hourRanges = [hourRange1, hourRange2];

        expect(HourSegmentHandler.getInstance()["get_hour_ranges_"](segments)).to.deep.equal(hourRanges);
        expect(HourSegmentHandler.getInstance()["get_hour_ranges_"]([])).to.deep.equal([]);
        expect(HourSegmentHandler.getInstance()["get_hour_ranges_"](null)).to.deep.equal([]);
    });

});

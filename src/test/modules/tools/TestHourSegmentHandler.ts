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
        expect(HourSegmentHandler.getBiggestHourSegmentationType(null, null)).to.equal(null);
        expect(HourSegmentHandler.getBiggestHourSegmentationType(1, null)).to.equal(null);
        expect(HourSegmentHandler.getBiggestHourSegmentationType(null, 2)).to.equal(null);
        expect(HourSegmentHandler.getBiggestHourSegmentationType(1, 2)).to.equal(1);

    });
    it('test: getSmallestHourSegmentationType', () => {
        expect(HourSegmentHandler.getSmallestHourSegmentationType(null, null)).to.equal(null);
        expect(HourSegmentHandler.getSmallestHourSegmentationType(1, null)).to.equal(null);
        expect(HourSegmentHandler.getSmallestHourSegmentationType(null, 2)).to.equal(null);
        expect(HourSegmentHandler.getSmallestHourSegmentationType(1, 2)).to.equal(2);

    });

    it('test: getAllSegments', () => {
        let duration1 = 1;
        let duration2 = 2;
        let duration3 = 3;
        let segmentExpected = [HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND), HourSegmentHandler.getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND)];

        expect(HourSegmentHandler.getAllSegments(null, duration2, HourSegment.TYPE_SECOND)).to.deep.equal(null);
        expect(HourSegmentHandler.getAllSegments(duration1, null, HourSegment.TYPE_SECOND)).to.deep.equal(null);
        expect(HourSegmentHandler.getAllSegments(duration1, duration2, HourSegment.TYPE_SECOND)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.getAllSegments(duration1, duration3, HourSegment.TYPE_SECOND, true)).to.deep.equal(segmentExpected);

    });

    it('test: getParentHourSegment', () => {
        let duration = ((26 * 60) + 15) * 60 + 37;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let hourExpected = HourSegmentHandler.getCorrespondingHourSegment(26 * 60 * 60, HourSegment.TYPE_HOUR);
        let minuteConverted = HourSegmentHandler.getCorrespondingHourSegment(((26 * 60) + 15) * 60, HourSegment.TYPE_MINUTE);
        let secondConverted = HourSegmentHandler.getCorrespondingHourSegment(((26 * 60) + 15) * 60 + 37, HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getParentHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getParentHourSegment(hour)).to.deep.equal(null);
        expect(HourSegmentHandler.getParentHourSegment(minute)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getParentHourSegment(second)).to.deep.equal(minuteConverted);
    });

    it('test: getCumulHourSegments', () => {
        let duration = ((26 * 60) + 15) * 60 + 37;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let minuteExpected = HourSegmentHandler.getAllSegments(26 * 60 * 60, ((26 * 60) + 15) * 60, HourSegment.TYPE_MINUTE, false);
        let secondExpected = HourSegmentHandler.getAllSegments(((26 * 60) + 15) * 60, ((26 * 60) + 15) * 60 + 37, HourSegment.TYPE_SECOND, false);

        expect(HourSegmentHandler.getCumulHourSegments(null)).equal(null);
        expect(HourSegmentHandler.getCumulHourSegments(hour)).to.deep.equal(null);
        expect(HourSegmentHandler.getCumulHourSegments(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getCumulHourSegments(second)).to.deep.equal(secondExpected);
    });

    it('test: getStartHour', () => {
        let durationTest = ((23 * 60) + 59) * 60 + 45;

        expect(HourSegmentHandler.getStartHour(null, null)).to.deep.equal(null);
        expect(HourSegmentHandler.getStartHour(null, 0)).to.deep.equal(null);
        expect(HourSegmentHandler.getStartHour(durationTest, null)).to.deep.equal(null);

        //la fonction n'a pas l'air de garder juste l'heure, je supose qu'elle convertit en ms de maniere exacte (impact peut-etre tests getStartHourSegment)
        let durationExpected = 23 * 60 * 60;
        expect(HourSegmentHandler.getStartHour(durationTest, HourSegment.TYPE_HOUR)).to.deep.equal(durationExpected);

        durationExpected = 23 * 60 * 60 + 59 * 60;
        expect(HourSegmentHandler.getStartHour(durationTest, HourSegment.TYPE_MINUTE)).to.deep.equal(durationExpected);

        durationExpected = 23 * 60 * 60 + 59 * 60 + 45;
        expect(HourSegmentHandler.getStartHour(durationTest, HourSegment.TYPE_SECOND)).to.deep.equal(durationExpected);

        durationTest = 2 * 60 * 60;
        durationExpected = 7200;
        expect(HourSegmentHandler.getStartHour(durationTest, 1)).to.deep.equal(durationExpected);
        durationTest = ((23 * 60) + 59) * 60;
        durationExpected = 86340;
        expect(HourSegmentHandler.getStartHour(durationTest, 2)).to.deep.equal(durationExpected);
    });

    it('test: getStartHourSegment', () => {
        let duration = ((23 * 60) + 59) * 60 + 45;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let hourExpected = 23 * 60 * 60;
        let minuteExpected = ((23 * 60) + 59) * 60;
        let secondExpected = ((23 * 60) + 59) * 60 + 45;

        expect(HourSegmentHandler.getStartHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getStartHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getStartHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getStartHourSegment(second)).to.deep.equal(secondExpected);
    });

    it('test: getEndHourSegment', () => {
        let duration = (23 * 60 + 55) * 60 + 45;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

        let hourExpected = 24 * 60 * 60;
        let minuteExpected = (23 * 60 + 56) * 60;
        let secondExpected = (23 * 60 + 55) * 60 + 46;

        expect(HourSegmentHandler.getEndHourSegment(null)).equal(null);

        expect(HourSegmentHandler.getEndHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getEndHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getEndHourSegment(second)).to.deep.equal(secondExpected);
    });


    it('test: getInclusiveEndHourSegment', () => {
        let date = (23 * 60 + 45) * 60 + 59;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

        let hourExpected = (24 * 60 + 0) * 60 - 1;
        let minuteExpected = (23 * 60 + 46) * 60 - 1;
        let secondExpected = (23 * 60 + 46) * 60 - 1;

        expect(HourSegmentHandler.getInclusiveEndHourSegment(null)).equal(null);

        expect(HourSegmentHandler.getInclusiveEndHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInclusiveEndHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInclusiveEndHourSegment(second)).to.deep.equal(secondExpected);
    });

    it('test: getPreviousHourSegments', () => {
        let date = (23 * 60 + 45) * 60 + 59;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

        let hourExpected = HourSegmentHandler.getCorrespondingHourSegment((((23 * 60 + 0) * 60 + 0) + 0 - 60 * 60), HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getCorrespondingHourSegment((((23 * 60 + 45) * 60 + 0) + 0 - 1 * 60), HourSegment.TYPE_MINUTE);
        let secondExpected = HourSegmentHandler.getCorrespondingHourSegment((((23 * 60 + 45) * 60 + 59) + 0 - 1), HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getPreviousHourSegments(null)).equal(null);
        expect(HourSegmentHandler.getPreviousHourSegments([null])).to.deep.equal([null]);
        expect(HourSegmentHandler.getPreviousHourSegments([hour, minute, second])).to.deep.equal([hourExpected, minuteExpected, secondExpected]);
        expect(HourSegmentHandler.getPreviousHourSegments([hour, null])).to.deep.equal([hourExpected, null]);
    });

    it('test: getPreviousHourSegment', () => {
        let date = (23 * 60 + 45) * 60 + 59;

        let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

        let hourExpected = HourSegmentHandler.getCorrespondingHourSegment(((23 * 60 + 0) * 60 + 0 + 0 - 60 * 60), HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getCorrespondingHourSegment(((23 * 60 + 45) * 60 + 0 + 0 - 1 * 60), HourSegment.TYPE_MINUTE);
        let secondExpected = HourSegmentHandler.getCorrespondingHourSegment(((23 * 60 + 45) * 60 + 59 + 0 - 1), HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getPreviousHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getPreviousHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getPreviousHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getPreviousHourSegment(second)).to.deep.equal(secondExpected);
    });

    it('test: decHourSegment', () => {
        expect(HourSegmentHandler.decHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.decHourSegment(null, null, 0)).equal(null);

        let duration = (18 * 60 + 27) * 60 + 49;
        let hourSeg: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);

        HourSegmentHandler.decHourSegment(hourSeg, HourSegment.TYPE_HOUR, 1);
        let hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(17 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);

        HourSegmentHandler.decHourSegment(hourSeg, HourSegment.TYPE_HOUR, 1);
        hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(16 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);

        HourSegmentHandler.decHourSegment(hourSeg, null, 1);
        hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(15 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);

        HourSegmentHandler.decHourSegment(hourSeg, HourSegment.TYPE_MINUTE, -60);
        hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(16 * 60 * 60, HourSegment.TYPE_HOUR);
        expect(hourSeg).to.deep.equal(hourSegExpected);
    });

    it('test: incHourSegment', () => {
        expect(HourSegmentHandler.incHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.incHourSegment(null, null, 0)).equal(null);
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
        duration = Durations.add(duration, -1, HourSegment.TYPE_HOUR);
        expect(duration).to.deep.equal(durationExpected);

        durationExpected = (22 * 60 + 44) * 60 + 59;
        duration = Durations.add(duration, -1, HourSegment.TYPE_MINUTE);
        expect(duration).to.deep.equal(durationExpected);
    });

    it('test: getCorrespondingHourSegment', () => {
        let date = (23 * 60 + 45) * 60 + 59;

        let hourExpected = HourSegmentHandler.getCorrespondingHourSegment(date - 60 * 60, HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getCorrespondingHourSegment(date + 60, HourSegment.TYPE_MINUTE);

        expect(HourSegmentHandler.getCorrespondingHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getCorrespondingHourSegment(null, null, 0)).equal(null);

        expect(HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR, -1)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE, 1)).to.deep.equal(minuteExpected);
    });

    it('test: getCorrespondingHourSegments', () => {
        let date1 = (23 * 60 + 45) * 60 + 59;
        let date2 = (18 * 60 + 39) * 60 + 21;
        let dates = [date1, date2];

        let segment11 = HourSegmentHandler.getCorrespondingHourSegment((24 * 60 + 45) * 60 + 59, HourSegment.TYPE_HOUR);
        let segment12 = HourSegmentHandler.getCorrespondingHourSegment((19 * 60 + 39) * 60 + 21, HourSegment.TYPE_HOUR);
        let Expected1 = [segment11, segment12];

        expect(HourSegmentHandler.getCorrespondingHourSegments(null, null, null)).to.deep.equal([]);
        expect(HourSegmentHandler.getCorrespondingHourSegments(null, null, 0)).to.deep.equal([]);

        expect(HourSegmentHandler.getCorrespondingHourSegments(dates, HourSegment.TYPE_HOUR, 1)).to.deep.equal(Expected1);
    });

    it('test: isEltInSegment', () => {
        let date = (23 * 60 + 59) * 60 + 45;
        let segment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);

        expect(HourSegmentHandler.isEltInSegment(null, null)).equal(false);
        expect(HourSegmentHandler.isEltInSegment(null, segment)).equal(false);
        expect(HourSegmentHandler.isEltInSegment(date, null)).equal(false);


        expect(HourSegmentHandler.isEltInSegment(date, segment)).equal(true);

        let otherDate = (22 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).equal(false);
        otherDate = (24 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).equal(false);
        otherDate = (24 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).equal(false);
        otherDate = (23 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).equal(true);
        otherDate = (23 * 60 + 59) * 60 + 45;
        expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).equal(true);
    });

    it('test: isInSameSegmentType', () => {
        let date = (22 * 60 + 59) * 60 + 45;
        let segment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let otherDate = (22 * 60 + 59) * 60 + 59;
        let otherSegment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);

        expect(HourSegmentHandler.isInSameSegmentType(null, null)).equal(false);
        expect(HourSegmentHandler.isInSameSegmentType(null, otherSegment)).equal(false);
        expect(HourSegmentHandler.isInSameSegmentType(segment, null)).equal(false);


        expect(HourSegmentHandler.isInSameSegmentType(segment, otherSegment)).equal(true);

        otherDate = 23 * 60 * 60;
        otherSegment = HourSegmentHandler.getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);
    });

    it('test: segmentsAreEquivalent', () => {
        let date = (22 * 60 + 59) * 60 + 45;
        let segment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);
        let otherDate = (22 * 60 + 59) * 60 + 59;
        let otherSegment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(otherDate, HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.segmentsAreEquivalent(null, null)).to.deep.equal(true);
        expect(HourSegmentHandler.segmentsAreEquivalent(null, otherSegment)).to.deep.equal(false);
        expect(HourSegmentHandler.segmentsAreEquivalent(segment, null)).to.deep.equal(false);


        expect(HourSegmentHandler.segmentsAreEquivalent(segment, otherSegment)).to.deep.equal(false);

        expect(HourSegmentHandler.segmentsAreEquivalent(segment, segment)).to.deep.equal(true);
    });



    it('test: getCorrespondingMomentUnitOfTime', () => {
        expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(null)).to.equal(null);
        expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(0)).to.equal('hour');
        expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(1)).to.equal('minute');
        expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(2)).to.equal('second');
        expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(3)).to.equal(null);
        expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(-1)).to.equal(null);
    });

    it('test: segmentsAreAquivalent', () => {
        let duration1 = 1000;
        let duration1bis = 1000;
        let duration2 = 2000;
        let segment1: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND);
        let segment1bis: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1bis, HourSegment.TYPE_SECOND);
        let segment3: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND);
        expect(HourSegmentHandler.segmentsAreEquivalent(null, null)).to.equal(true);
        expect(HourSegmentHandler.segmentsAreEquivalent(null, segment1)).to.equal(false);
        expect(HourSegmentHandler.segmentsAreEquivalent(segment1, null)).to.equal(false);
        expect(HourSegmentHandler.segmentsAreEquivalent(segment1, segment1)).to.equal(true);
        expect(HourSegmentHandler.segmentsAreEquivalent(segment1, segment1bis)).to.equal(true);
        expect(HourSegmentHandler.segmentsAreEquivalent(segment1, segment3)).to.equal(false);
    });

    it('test: get_segment_from_range_start', () => {
        let duration1 = (22 * 60 + 37) * 60 + 45;
        let duration2 = (22 * 60 + 59) * 60 + 45;
        let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
        let segmentExpectedmin: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
        let segmentExpected: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.get_segment_from_range_start(hourRange, null)).to.deep.equal(segmentExpectedmin);
        expect(HourSegmentHandler.get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).to.deep.equal(null);
    });

    it('test: get_segment_from_range_end', () => {
        let duration1 = (22 * 60 + 37) * 60 + 45;
        let duration2 = (22 * 60 + 59) * 60 + 45;
        let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
        let segmentExpectedmin: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
        let segmentExpected: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.get_segment_from_range_start(hourRange, null)).to.deep.equal(segmentExpectedmin);
        expect(HourSegmentHandler.get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).to.deep.equal(null);
    });

    it('test: get_hour_ranges_', () => {
        let duration1 = (22 * 60 + 37) * 60 + 45;
        let duration2 = (22 * 60 + 59) * 60 + 45;
        let segment1: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        let segment2: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration2, HourSegment.TYPE_HOUR);
        let segments = [segment1, segment2];
        let hourRange1: HourRange = HourRange.createNew(22 * 60 * 60, 23 * 60 * 60, true, false, HourSegment.TYPE_HOUR);
        let hourRange2: HourRange = HourRange.createNew(22 * 60 * 60, 23 * 60 * 60, true, false, HourSegment.TYPE_HOUR);
        let hourRanges = [hourRange1, hourRange2];

        expect(HourSegmentHandler["get_hour_ranges_"](segments)).to.deep.equal(hourRanges);
        expect(HourSegmentHandler["get_hour_ranges_"]([])).to.deep.equal([]);
        expect(HourSegmentHandler["get_hour_ranges_"](null)).to.deep.equal([]);
    });

});

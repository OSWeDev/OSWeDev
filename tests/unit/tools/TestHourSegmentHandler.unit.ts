import { test, expect } from "playwright-test-coverage";
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import HourRange from '../../../src/shared/modules/DataRender/vos/HourRange';
import HourSegment from '../../../src/shared/modules/DataRender/vos/HourSegment';
import Durations from '../../../src/shared/modules/FormatDatesNombres/Dates/Durations';
import HourSegmentHandler from '../../../src/shared/tools/HourSegmentHandler';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

test('HourSegmentHandler: test: getBiggestHourSegmentationType', () => {
    expect(HourSegmentHandler.getBiggestHourSegmentationType(null, null)).toStrictEqual(null);
    expect(HourSegmentHandler.getBiggestHourSegmentationType(1, null)).toStrictEqual(null);
    expect(HourSegmentHandler.getBiggestHourSegmentationType(null, 2)).toStrictEqual(null);
    expect(HourSegmentHandler.getBiggestHourSegmentationType(1, 2)).toStrictEqual(1);

});
test('HourSegmentHandler: test: getSmallestHourSegmentationType', () => {
    expect(HourSegmentHandler.getSmallestHourSegmentationType(null, null)).toStrictEqual(null);
    expect(HourSegmentHandler.getSmallestHourSegmentationType(1, null)).toStrictEqual(null);
    expect(HourSegmentHandler.getSmallestHourSegmentationType(null, 2)).toStrictEqual(null);
    expect(HourSegmentHandler.getSmallestHourSegmentationType(1, 2)).toStrictEqual(2);

});

test('HourSegmentHandler: test: getAllSegments', () => {
    let duration1 = 1;
    let duration2 = 2;
    let duration3 = 3;
    let segmentExpected = [HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND), HourSegmentHandler.getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND)];

    expect(HourSegmentHandler.getAllSegments(null, duration2, HourSegment.TYPE_SECOND)).toStrictEqual(null);
    expect(HourSegmentHandler.getAllSegments(duration1, null, HourSegment.TYPE_SECOND)).toStrictEqual(null);
    expect(HourSegmentHandler.getAllSegments(duration1, duration2, HourSegment.TYPE_SECOND)).toStrictEqual(segmentExpected);
    expect(HourSegmentHandler.getAllSegments(duration1, duration3, HourSegment.TYPE_SECOND, true)).toStrictEqual(segmentExpected);

});

test('HourSegmentHandler: test: getParentHourSegment', () => {
    let duration = ((26 * 60) + 15) * 60 + 37;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

    let hourExpected = HourSegmentHandler.getCorrespondingHourSegment(26 * 60 * 60, HourSegment.TYPE_HOUR);
    let minuteConverted = HourSegmentHandler.getCorrespondingHourSegment(((26 * 60) + 15) * 60, HourSegment.TYPE_MINUTE);
    let secondConverted = HourSegmentHandler.getCorrespondingHourSegment(((26 * 60) + 15) * 60 + 37, HourSegment.TYPE_SECOND);

    expect(HourSegmentHandler.getParentHourSegment(null)).toStrictEqual(null);
    expect(HourSegmentHandler.getParentHourSegment(hour)).toStrictEqual(null);
    expect(HourSegmentHandler.getParentHourSegment(minute)).toStrictEqual(hourExpected);
    expect(HourSegmentHandler.getParentHourSegment(second)).toStrictEqual(minuteConverted);
});

test('HourSegmentHandler: test: getCumulHourSegments', () => {
    let duration = ((26 * 60) + 15) * 60 + 37;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

    let minuteExpected = HourSegmentHandler.getAllSegments(26 * 60 * 60, ((26 * 60) + 15) * 60, HourSegment.TYPE_MINUTE, false);
    let secondExpected = HourSegmentHandler.getAllSegments(((26 * 60) + 15) * 60, ((26 * 60) + 15) * 60 + 37, HourSegment.TYPE_SECOND, false);

    expect(HourSegmentHandler.getCumulHourSegments(null)).toStrictEqual(null);
    expect(HourSegmentHandler.getCumulHourSegments(hour)).toStrictEqual(null);
    expect(HourSegmentHandler.getCumulHourSegments(minute)).toStrictEqual(minuteExpected);
    expect(HourSegmentHandler.getCumulHourSegments(second)).toStrictEqual(secondExpected);
});

test('HourSegmentHandler: test: getStartHour', () => {
    let durationTest = ((23 * 60) + 59) * 60 + 45;

    expect(HourSegmentHandler.getStartHour(null, null)).toStrictEqual(null);
    expect(HourSegmentHandler.getStartHour(null, 0)).toStrictEqual(null);
    expect(HourSegmentHandler.getStartHour(durationTest, null)).toStrictEqual(null);

    //la fonction n'a pas l'air de garder juste l'heure, je supose qu'elle convertit en ms de maniere exacte (impact peut-etre tests getStartHourSegment)
    let durationExpected = 23 * 60 * 60;
    expect(HourSegmentHandler.getStartHour(durationTest, HourSegment.TYPE_HOUR)).toStrictEqual(durationExpected);

    durationExpected = 23 * 60 * 60 + 59 * 60;
    expect(HourSegmentHandler.getStartHour(durationTest, HourSegment.TYPE_MINUTE)).toStrictEqual(durationExpected);

    durationExpected = 23 * 60 * 60 + 59 * 60 + 45;
    expect(HourSegmentHandler.getStartHour(durationTest, HourSegment.TYPE_SECOND)).toStrictEqual(durationExpected);

    durationTest = 2 * 60 * 60;
    durationExpected = 7200;
    expect(HourSegmentHandler.getStartHour(durationTest, 1)).toStrictEqual(durationExpected);
    durationTest = ((23 * 60) + 59) * 60;
    durationExpected = 86340;
    expect(HourSegmentHandler.getStartHour(durationTest, 2)).toStrictEqual(durationExpected);
});

test('HourSegmentHandler: test: getStartHourSegment', () => {
    let duration = ((23 * 60) + 59) * 60 + 45;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

    let hourExpected = 23 * 60 * 60;
    let minuteExpected = ((23 * 60) + 59) * 60;
    let secondExpected = ((23 * 60) + 59) * 60 + 45;

    expect(HourSegmentHandler.getStartHourSegment(null)).toStrictEqual(null);
    expect(HourSegmentHandler.getStartHourSegment(hour)).toStrictEqual(hourExpected);
    expect(HourSegmentHandler.getStartHourSegment(minute)).toStrictEqual(minuteExpected);
    expect(HourSegmentHandler.getStartHourSegment(second)).toStrictEqual(secondExpected);
});

test('HourSegmentHandler: test: getEndHourSegment', () => {
    let duration = (23 * 60 + 55) * 60 + 45;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);

    let hourExpected = 24 * 60 * 60;
    let minuteExpected = (23 * 60 + 56) * 60;
    let secondExpected = (23 * 60 + 55) * 60 + 46;

    expect(HourSegmentHandler.getEndHourSegment(null)).toStrictEqual(null);

    expect(HourSegmentHandler.getEndHourSegment(hour)).toStrictEqual(hourExpected);
    expect(HourSegmentHandler.getEndHourSegment(minute)).toStrictEqual(minuteExpected);
    expect(HourSegmentHandler.getEndHourSegment(second)).toStrictEqual(secondExpected);
});


test('HourSegmentHandler: test: getInclusiveEndHourSegment', () => {
    let date = (23 * 60 + 45) * 60 + 59;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

    let hourExpected = (24 * 60 + 0) * 60 - 1;
    let minuteExpected = (23 * 60 + 46) * 60 - 1;
    let secondExpected = (23 * 60 + 46) * 60 - 1;

    expect(HourSegmentHandler.getInclusiveEndHourSegment(null)).toStrictEqual(null);

    expect(HourSegmentHandler.getInclusiveEndHourSegment(hour)).toStrictEqual(hourExpected);
    expect(HourSegmentHandler.getInclusiveEndHourSegment(minute)).toStrictEqual(minuteExpected);
    expect(HourSegmentHandler.getInclusiveEndHourSegment(second)).toStrictEqual(secondExpected);
});

test('HourSegmentHandler: test: getPreviousHourSegments', () => {
    let date = (23 * 60 + 45) * 60 + 59;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

    let hourExpected = HourSegmentHandler.getCorrespondingHourSegment((((23 * 60 + 0) * 60 + 0) + 0 - 60 * 60), HourSegment.TYPE_HOUR);
    let minuteExpected = HourSegmentHandler.getCorrespondingHourSegment((((23 * 60 + 45) * 60 + 0) + 0 - 1 * 60), HourSegment.TYPE_MINUTE);
    let secondExpected = HourSegmentHandler.getCorrespondingHourSegment((((23 * 60 + 45) * 60 + 59) + 0 - 1), HourSegment.TYPE_SECOND);

    expect(HourSegmentHandler.getPreviousHourSegments(null)).toStrictEqual(null);
    expect(HourSegmentHandler.getPreviousHourSegments([null])).toStrictEqual([null]);
    expect(HourSegmentHandler.getPreviousHourSegments([hour, minute, second])).toStrictEqual([hourExpected, minuteExpected, secondExpected]);
    expect(HourSegmentHandler.getPreviousHourSegments([hour, null])).toStrictEqual([hourExpected, null]);
});

test('HourSegmentHandler: test: getPreviousHourSegment', () => {
    let date = (23 * 60 + 45) * 60 + 59;

    let hour: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);
    let minute: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
    let second: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);

    let hourExpected = HourSegmentHandler.getCorrespondingHourSegment(((23 * 60 + 0) * 60 + 0 + 0 - 60 * 60), HourSegment.TYPE_HOUR);
    let minuteExpected = HourSegmentHandler.getCorrespondingHourSegment(((23 * 60 + 45) * 60 + 0 + 0 - 1 * 60), HourSegment.TYPE_MINUTE);
    let secondExpected = HourSegmentHandler.getCorrespondingHourSegment(((23 * 60 + 45) * 60 + 59 + 0 - 1), HourSegment.TYPE_SECOND);

    expect(HourSegmentHandler.getPreviousHourSegment(null)).toStrictEqual(null);
    expect(HourSegmentHandler.getPreviousHourSegment(hour)).toStrictEqual(hourExpected);
    expect(HourSegmentHandler.getPreviousHourSegment(minute)).toStrictEqual(minuteExpected);
    expect(HourSegmentHandler.getPreviousHourSegment(second)).toStrictEqual(secondExpected);
});

test('HourSegmentHandler: test: decHourSegment', () => {
    expect(HourSegmentHandler.decHourSegment(null, null, null)).toStrictEqual(null);
    expect(HourSegmentHandler.decHourSegment(null, null, 0)).toStrictEqual(null);

    let duration = (18 * 60 + 27) * 60 + 49;
    let hourSeg: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);

    HourSegmentHandler.decHourSegment(hourSeg, HourSegment.TYPE_HOUR, 1);
    let hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(17 * 60 * 60, HourSegment.TYPE_HOUR);
    expect(hourSeg).toStrictEqual(hourSegExpected);

    HourSegmentHandler.decHourSegment(hourSeg, HourSegment.TYPE_HOUR, 1);
    hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(16 * 60 * 60, HourSegment.TYPE_HOUR);
    expect(hourSeg).toStrictEqual(hourSegExpected);

    HourSegmentHandler.decHourSegment(hourSeg, null, 1);
    hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(15 * 60 * 60, HourSegment.TYPE_HOUR);
    expect(hourSeg).toStrictEqual(hourSegExpected);

    HourSegmentHandler.decHourSegment(hourSeg, HourSegment.TYPE_MINUTE, -60);
    hourSegExpected = HourSegmentHandler.getCorrespondingHourSegment(16 * 60 * 60, HourSegment.TYPE_HOUR);
    expect(hourSeg).toStrictEqual(hourSegExpected);
});

test('HourSegmentHandler: test: incHourSegment', () => {
    expect(HourSegmentHandler.incHourSegment(null, null, null)).toStrictEqual(null);
    expect(HourSegmentHandler.incHourSegment(null, null, 0)).toStrictEqual(null);
});

test('HourSegmentHandler: test: incElt', () => {
    let duration = (23 * 60 + 45) * 60 + 59;

    let durationExpected = (23 * 60 + 45) * 60 + 59;
    duration = Durations.add(duration, null, null);
    expect(duration).toStrictEqual(durationExpected);


    durationExpected = (24 * 60 + 45) * 60 + 59;
    duration = Durations.add(duration, 1, HourSegment.TYPE_HOUR);
    expect(duration).toStrictEqual(durationExpected);

    durationExpected = (24 * 60 + 46) * 60 + 59;
    duration = Durations.add(duration, 1, HourSegment.TYPE_MINUTE);
    expect(duration).toStrictEqual(durationExpected);
});

//ici y a un probleme bizarre ue
test('HourSegmentHandler: test: decMoment', () => {
    let duration = (23 * 60 + 45) * 60 + 59;

    let durationExpected = (23 * 60 + 45) * 60 + 59;
    duration = Durations.add(duration, null, null);
    expect(duration).toStrictEqual(durationExpected);


    durationExpected = (22 * 60 + 45) * 60 + 59;
    duration = Durations.add(duration, -1, HourSegment.TYPE_HOUR);
    expect(duration).toStrictEqual(durationExpected);

    durationExpected = (22 * 60 + 44) * 60 + 59;
    duration = Durations.add(duration, -1, HourSegment.TYPE_MINUTE);
    expect(duration).toStrictEqual(durationExpected);
});

test('HourSegmentHandler: test: getCorrespondingHourSegment', () => {
    let date = (23 * 60 + 45) * 60 + 59;

    let hourExpected = HourSegmentHandler.getCorrespondingHourSegment(date - 60 * 60, HourSegment.TYPE_HOUR);
    let minuteExpected = HourSegmentHandler.getCorrespondingHourSegment(date + 60, HourSegment.TYPE_MINUTE);

    expect(HourSegmentHandler.getCorrespondingHourSegment(null, null, null)).toStrictEqual(null);
    expect(HourSegmentHandler.getCorrespondingHourSegment(null, null, 0)).toStrictEqual(null);

    expect(HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR, -1)).toStrictEqual(hourExpected);
    expect(HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE, 1)).toStrictEqual(minuteExpected);
});

test('HourSegmentHandler: test: getCorrespondingHourSegments', () => {
    let date1 = (23 * 60 + 45) * 60 + 59;
    let date2 = (18 * 60 + 39) * 60 + 21;
    let dates = [date1, date2];

    let segment11 = HourSegmentHandler.getCorrespondingHourSegment((24 * 60 + 45) * 60 + 59, HourSegment.TYPE_HOUR);
    let segment12 = HourSegmentHandler.getCorrespondingHourSegment((19 * 60 + 39) * 60 + 21, HourSegment.TYPE_HOUR);
    let Expected1 = [segment11, segment12];

    expect(HourSegmentHandler.getCorrespondingHourSegments(null, null, null)).toStrictEqual([]);
    expect(HourSegmentHandler.getCorrespondingHourSegments(null, null, 0)).toStrictEqual([]);

    expect(HourSegmentHandler.getCorrespondingHourSegments(dates, HourSegment.TYPE_HOUR, 1)).toStrictEqual(Expected1);
});

test('HourSegmentHandler: test: isEltInSegment', () => {
    let date = (23 * 60 + 59) * 60 + 45;
    let segment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);

    expect(HourSegmentHandler.isEltInSegment(null, null)).toStrictEqual(false);
    expect(HourSegmentHandler.isEltInSegment(null, segment)).toStrictEqual(false);
    expect(HourSegmentHandler.isEltInSegment(date, null)).toStrictEqual(false);


    expect(HourSegmentHandler.isEltInSegment(date, segment)).toStrictEqual(true);

    let otherDate = (22 * 60 + 59) * 60 + 45;
    expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).toStrictEqual(false);
    otherDate = (24 * 60 + 59) * 60 + 45;
    expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).toStrictEqual(false);
    otherDate = (24 * 60 + 59) * 60 + 45;
    expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).toStrictEqual(false);
    otherDate = (23 * 60 + 59) * 60 + 45;
    expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).toStrictEqual(true);
    otherDate = (23 * 60 + 59) * 60 + 45;
    expect(HourSegmentHandler.isEltInSegment(otherDate, segment)).toStrictEqual(true);
});

test('HourSegmentHandler: test: isInSameSegmentType', () => {
    let date = (22 * 60 + 59) * 60 + 45;
    let segment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
    let otherDate = (22 * 60 + 59) * 60 + 59;
    let otherSegment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);

    expect(HourSegmentHandler.isInSameSegmentType(null, null)).toStrictEqual(false);
    expect(HourSegmentHandler.isInSameSegmentType(null, otherSegment)).toStrictEqual(false);
    expect(HourSegmentHandler.isInSameSegmentType(segment, null)).toStrictEqual(false);


    expect(HourSegmentHandler.isInSameSegmentType(segment, otherSegment)).toStrictEqual(true);

    otherDate = 23 * 60 * 60;
    otherSegment = HourSegmentHandler.getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);
});

test('HourSegmentHandler: test: segmentsAreEquivalent', () => {
    let date = (22 * 60 + 59) * 60 + 45;
    let segment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);
    let otherDate = (22 * 60 + 59) * 60 + 59;
    let otherSegment: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(otherDate, HourSegment.TYPE_SECOND);

    expect(HourSegmentHandler.segmentsAreEquivalent(null, null)).toStrictEqual(true);
    expect(HourSegmentHandler.segmentsAreEquivalent(null, otherSegment)).toStrictEqual(false);
    expect(HourSegmentHandler.segmentsAreEquivalent(segment, null)).toStrictEqual(false);


    expect(HourSegmentHandler.segmentsAreEquivalent(segment, otherSegment)).toStrictEqual(false);

    expect(HourSegmentHandler.segmentsAreEquivalent(segment, segment)).toStrictEqual(true);
});



test('HourSegmentHandler: test: getCorrespondingMomentUnitOfTime', () => {
    expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(null)).toStrictEqual(null);
    expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(0)).toStrictEqual('hour');
    expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(1)).toStrictEqual('minute');
    expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(2)).toStrictEqual('second');
    expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(3)).toStrictEqual(null);
    expect(HourSegmentHandler.getCorrespondingMomentUnitOfTime(-1)).toStrictEqual(null);
});

test('HourSegmentHandler: test: segmentsAreAquivalent', () => {
    let duration1 = 1000;
    let duration1bis = 1000;
    let duration2 = 2000;
    let segment1: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND);
    let segment1bis: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1bis, HourSegment.TYPE_SECOND);
    let segment3: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND);
    expect(HourSegmentHandler.segmentsAreEquivalent(null, null)).toStrictEqual(true);
    expect(HourSegmentHandler.segmentsAreEquivalent(null, segment1)).toStrictEqual(false);
    expect(HourSegmentHandler.segmentsAreEquivalent(segment1, null)).toStrictEqual(false);
    expect(HourSegmentHandler.segmentsAreEquivalent(segment1, segment1)).toStrictEqual(true);
    expect(HourSegmentHandler.segmentsAreEquivalent(segment1, segment1bis)).toStrictEqual(true);
    expect(HourSegmentHandler.segmentsAreEquivalent(segment1, segment3)).toStrictEqual(false);
});

test('HourSegmentHandler: test: get_segment_from_range_start', () => {
    let duration1 = (22 * 60 + 37) * 60 + 45;
    let duration2 = (22 * 60 + 59) * 60 + 45;
    let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
    let segmentExpectedmin: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
    let segmentExpected: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
    expect(HourSegmentHandler.get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).toStrictEqual(segmentExpected);
    expect(HourSegmentHandler.get_segment_from_range_start(hourRange, null)).toStrictEqual(segmentExpectedmin);
    expect(HourSegmentHandler.get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).toStrictEqual(null);
});

test('HourSegmentHandler: test: get_segment_from_range_end', () => {
    let duration1 = (22 * 60 + 37) * 60 + 45;
    let duration2 = (22 * 60 + 59) * 60 + 45;
    let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
    let segmentExpectedmin: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
    let segmentExpected: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
    expect(HourSegmentHandler.get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).toStrictEqual(segmentExpected);
    expect(HourSegmentHandler.get_segment_from_range_start(hourRange, null)).toStrictEqual(segmentExpectedmin);
    expect(HourSegmentHandler.get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).toStrictEqual(null);
});

test('HourSegmentHandler: test: get_hour_ranges_', () => {
    let duration1 = (22 * 60 + 37) * 60 + 45;
    let duration2 = (22 * 60 + 59) * 60 + 45;
    let segment1: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
    let segment2: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(duration2, HourSegment.TYPE_HOUR);
    let segments = [segment1, segment2];
    let hourRange1: HourRange = HourRange.createNew(22 * 60 * 60, 23 * 60 * 60, true, false, HourSegment.TYPE_HOUR);
    let hourRange2: HourRange = HourRange.createNew(22 * 60 * 60, 23 * 60 * 60, true, false, HourSegment.TYPE_HOUR);
    let hourRanges = [hourRange1, hourRange2];

    expect(HourSegmentHandler["get_hour_ranges_"](segments)).toStrictEqual(hourRanges);
    expect(HourSegmentHandler["get_hour_ranges_"]([])).toStrictEqual([]);
    expect(HourSegmentHandler["get_hour_ranges_"](null)).toStrictEqual([]);
});
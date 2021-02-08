import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import HourSegmentHandler from '../../../shared/tools/HourSegmentHandler';
import HourSegment from '../../../shared/modules/DataRender/vos/HourSegment';
import HourRange from '../../../shared/modules/DataRender/vos/HourRange';
import { exception } from 'console';



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
        let duration1 = moment.duration(1000);
        let duration2 = moment.duration(2000);
        let duration3 = moment.duration(3000);
        let segmentExpected = [HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND), HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND)];

        expect(HourSegmentHandler.getInstance().getAllSegments(null, duration2, HourSegment.TYPE_SECOND)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getAllSegments(duration1, null, HourSegment.TYPE_SECOND)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getAllSegments(duration1, duration2, HourSegment.TYPE_SECOND)).to.deep.equal(segmentExpected);
        expect(HourSegmentHandler.getInstance().getAllSegments(duration1, duration3, HourSegment.TYPE_SECOND, true)).to.deep.equal(segmentExpected);

    });

    it('test: getParentHourSegment', () => {
        let duration = moment.duration("26:15:37.1252");

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);
        let ms: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration("26:00:00.0"), HourSegment.TYPE_HOUR);
        let minuteConverted = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration("26:15:00.0"), HourSegment.TYPE_MINUTE);
        let secondConverted = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration("26:15:37.0"), HourSegment.TYPE_SECOND);

        expect(HourSegmentHandler.getInstance().getParentHourSegment(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(hour)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(minute)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(second)).to.deep.equal(minuteConverted);
        expect(HourSegmentHandler.getInstance().getParentHourSegment(ms)).to.deep.equal(secondConverted);
    });

    it('test: getCumulHourSegments', () => {
        let duration = moment.duration("26:15:37.1252");

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);
        let ms: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        let minuteExpected = HourSegmentHandler.getInstance().getAllSegments(moment.duration("26:00:00.00"), moment.duration("26:15:00.0"), HourSegment.TYPE_MINUTE, false);
        let secondExpected = HourSegmentHandler.getInstance().getAllSegments(moment.duration("26:15:00.00"), moment.duration("26:15:37.0"), HourSegment.TYPE_SECOND, false);
        let msExpected = HourSegmentHandler.getInstance().getAllSegments(moment.duration("26:15:37.00"), moment.duration("26:15:37.1252"), HourSegment.TYPE_MS, false);

        expect(HourSegmentHandler.getInstance().getCumulHourSegments(null)).equal(null);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(hour)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(second)).to.deep.equal(secondExpected);
        expect(HourSegmentHandler.getInstance().getCumulHourSegments(ms)).to.deep.equal(msExpected);
    });

    it('test: getStartHour', () => {
        let durationTest = moment.duration('23:59:45.999');

        expect(HourSegmentHandler.getInstance().getStartHour(null, null)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getStartHour(null, 0)).to.deep.equal(null);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, null)).to.deep.equal(null);

        //la fonction n'a pas l'air de garder juste l'heure, je supose qu'elle convertit en ms de maniere exacte (impact peut-etre tests getStartHourSegment)
        let durationExpectation = moment.duration(23 * 60 * 60 * 1000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_HOUR)).to.deep.equal(durationExpectation);

        durationExpectation = moment.duration(23 * 60 * 60 * 1000 + 59 * 60 * 1000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_MINUTE)).to.deep.equal(durationExpectation);

        durationExpectation = moment.duration(23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 45 * 1000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_SECOND)).to.deep.equal(durationExpectation);

        durationExpectation = moment.duration(23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 45 * 1000 + 999);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, HourSegment.TYPE_MS)).to.deep.equal(durationExpectation);

        durationTest = moment.duration(2, 'hours');
        durationExpectation = moment.duration(7200000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, 1)).to.deep.equal(durationExpectation);
        durationTest = moment.duration('23:59');
        durationExpectation = moment.duration(86340000);
        expect(HourSegmentHandler.getInstance().getStartHour(durationTest, 2)).to.deep.equal(durationExpectation);
    });

    it('test: getStartHourSegment', () => {
        let duration = moment.duration('23:59:45.999');

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);
        let ms: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        let hourExpected = moment.duration('23:00:00.000');
        let minuteExpected = moment.duration('23:59:00.000');
        let secondExpected = moment.duration('23:59:45.0');
        let msExpected = moment.duration('23:59:45.999');

        expect(HourSegmentHandler.getInstance().getStartHourSegment(null)).equal(null);
        //la fonction renvoie ce qu'elle recoit en entrée?
        expect(HourSegmentHandler.getInstance().getStartHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getStartHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getStartHourSegment(second)).to.deep.equal(secondExpected);
        expect(HourSegmentHandler.getInstance().getStartHourSegment(ms)).to.deep.equal(msExpected);
    });

    it('test: getEndHourSegment', () => {
        let duration = moment.duration('23:55:45.999');

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);
        let ms: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        let hourExpected = moment.duration('24:00:00.000');
        let minuteExpected = moment.duration('23:56:00.000');
        let secondExpected = moment.duration('23:55:46.0');
        let msExpected = moment.duration('23:55:46.0');

        expect(HourSegmentHandler.getInstance().getEndHourSegment(null)).equal(null);

        expect(HourSegmentHandler.getInstance().getEndHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getEndHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getEndHourSegment(second)).to.deep.equal(secondExpected);
        expect(HourSegmentHandler.getInstance().getEndHourSegment(ms)).to.deep.equal(msExpected);
    });


    it('test: getInclusiveEndHourSegment', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;
        let duration = moment.duration(date);

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);
        let ms: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        let hourExpected = moment.duration((((24 * 60 + 0) * 60 + 0) * 1000) + 0 - 1);
        let minuteExpected = moment.duration((((23 * 60 + 46) * 60 + 0) * 1000) + 0 - 1);
        let secondExpected = moment.duration((((23 * 60 + 46) * 60 + 0) * 1000) + 0 - 1);
        let msExpected = moment.duration((((23 * 60 + 46) * 60 + 0) * 1000) + 0 - 1);

        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(null)).equal(null);

        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(second)).to.deep.equal(secondExpected);
        expect(HourSegmentHandler.getInstance().getInclusiveEndHourSegment(ms)).to.deep.equal(msExpected);
    });

    it('test: getPreviousHourSegment', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;
        let duration = moment.duration(date);

        let hour: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR);
        let minute: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE);
        let second: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_SECOND);
        let ms: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((23 * 60 + 0) * 60 + 0) * 1000) + 0 - 60 * 60 * 1000), HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((23 * 60 + 45) * 60 + 0) * 1000) + 0 - 1000 * 60), HourSegment.TYPE_MINUTE);
        let secondExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((23 * 60 + 45) * 60 + 59) * 1000) + 0 - 1000), HourSegment.TYPE_SECOND);
        let msExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((23 * 60 + 45) * 60 + 59) * 1000) + 999 - 1), HourSegment.TYPE_MS);

        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(null)).equal(null);

        //si type == null => type = hour.type? + renvoie la meme chose
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(hour)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(minute)).to.deep.equal(minuteExpected);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(second)).to.deep.equal(secondExpected);
        expect(HourSegmentHandler.getInstance().getPreviousHourSegment(ms)).to.deep.equal(msExpected);
    });

    it('test: decHourSegment', () => {
        expect(HourSegmentHandler.getInstance().decHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().decHourSegment(null, null, 0)).equal(null);
        expect(HourSegmentHandler.getInstance().decHourSegment(null, HourSegment.TYPE_MS, 0)).equal(null);
    });

    it('test: incHourSegment', () => {
        expect(HourSegmentHandler.getInstance().incHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().incHourSegment(null, null, 0)).equal(null);
        expect(HourSegmentHandler.getInstance().incHourSegment(null, HourSegment.TYPE_MS, 0)).equal(null);
    });

    it('test: incElt', () => {
        expect(HourSegmentHandler.getInstance().incElt(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().incElt(null, null, 0)).equal(null);
        expect(HourSegmentHandler.getInstance().incElt(null, HourSegment.TYPE_MS, 0)).equal(null);

        let duration = moment.duration("23:45:59.999");

        let durationExpected = moment.duration("23:45:59.999");
        HourSegmentHandler.getInstance().incElt(duration, null, null);
        expect(duration).to.deep.equal(durationExpected);


        durationExpected = moment.duration("24:45:59.999");
        HourSegmentHandler.getInstance().incElt(duration, HourSegment.TYPE_HOUR, 1);
        expect(duration).to.deep.equal(durationExpected);

        durationExpected = moment.duration("24:46:59.999");
        HourSegmentHandler.getInstance().incElt(duration, HourSegment.TYPE_MINUTE, 1);
        expect(duration).to.deep.equal(durationExpected);

        durationExpected = moment.duration("24:47");
        HourSegmentHandler.getInstance().incElt(duration, HourSegment.TYPE_MS, 1);
        expect(duration).to.deep.equal(durationExpected);
    });

    //ici y a un probleme bizarre ue
    it('test: decMoment', () => {
        let duration = moment.duration("23:45:59.999");

        let durationExpected = moment.duration("23:45:59.999");
        HourSegmentHandler.getInstance().decMoment(duration, null, null);
        expect(duration).to.deep.equal(durationExpected);


        durationExpected = moment.duration("22:45:59.999");
        HourSegmentHandler.getInstance().decMoment(duration, HourSegment.TYPE_HOUR, 1);
        expect(duration).to.deep.equal(durationExpected);

        durationExpected = moment.duration("22:44:59.999");
        HourSegmentHandler.getInstance().decMoment(duration, HourSegment.TYPE_MINUTE, 1);
        expect(duration).to.deep.equal(durationExpected);
    });

    it('test: getCorrespondingHourSegment', () => {
        let date = (((23 * 60 + 45) * 60 + 59) * 1000) + 999;
        let duration = moment.duration(date);

        let hourExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration(date - 60 * 60 * 1000), HourSegment.TYPE_HOUR);
        let minuteExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration(date + 60 * 1000), HourSegment.TYPE_MINUTE);
        let msExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS);

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(null, null, null)).equal(null);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(null, null, 0)).equal(null);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(null, HourSegment.TYPE_MS, 0)).equal(null);

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MS, 0)).to.deep.equal(msExpected);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, null, 0)).to.deep.equal(msExpected);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_HOUR, -1)).to.deep.equal(hourExpected);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration, HourSegment.TYPE_MINUTE, 1)).to.deep.equal(minuteExpected);
    });

    it('test: getCorrespondingHourSegments', () => {
        let date1 = moment.duration((((23 * 60 + 45) * 60 + 59) * 1000) + 999);
        let date2 = moment.duration((((18 * 60 + 39) * 60 + 21) * 1000) + 589);
        let dates: moment.Duration[] = [date1, date2];

        let segment01 = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((23 * 60 + 45) * 60 + 59) * 1000) + 999), HourSegment.TYPE_MS);
        let segment02 = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((18 * 60 + 39) * 60 + 21) * 1000) + 589), HourSegment.TYPE_MS);
        let Expected0 = [segment01, segment02];

        let segment11 = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((24 * 60 + 45) * 60 + 59) * 1000) + 999), HourSegment.TYPE_HOUR);
        let segment12 = HourSegmentHandler.getInstance().getCorrespondingHourSegment(moment.duration((((19 * 60 + 39) * 60 + 21) * 1000) + 589), HourSegment.TYPE_HOUR);
        let Expected1 = [segment11, segment12];

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(null, null, null)).to.deep.equal([]);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(null, null, 0)).to.deep.equal([]);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(null, HourSegment.TYPE_MS, 0)).to.deep.equal([]);

        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(dates, HourSegment.TYPE_MS)).to.deep.equal(Expected0);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(dates, HourSegment.TYPE_MS, 0)).to.deep.equal(Expected0);
        expect(HourSegmentHandler.getInstance().getCorrespondingHourSegments(dates, HourSegment.TYPE_HOUR, 1)).to.deep.equal(Expected1);
    });

    it('test: isEltInSegment', () => {
        let date = moment.duration('23:59:45.999');
        let segment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_HOUR);

        expect(HourSegmentHandler.getInstance().isEltInSegment(null, null)).equal(false);
        expect(HourSegmentHandler.getInstance().isEltInSegment(null, segment)).equal(false);
        expect(HourSegmentHandler.getInstance().isEltInSegment(date, null)).equal(false);


        expect(HourSegmentHandler.getInstance().isEltInSegment(date, segment)).equal(true);

        let otherDate = moment.duration('22:59:45.999');
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(false);
        otherDate = moment.duration('24:59:45.999');
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(false);
        otherDate = moment.duration('24:59:45.009');
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(false);
        otherDate = moment.duration('23:59:45.009');
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(true);
        otherDate = moment.duration('23:59:45.999');
        expect(HourSegmentHandler.getInstance().isEltInSegment(otherDate, segment)).equal(true);
    });

    it('test: isInSameSegmentType', () => {
        let date = moment.duration('22:59:45.999');
        let segment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_MINUTE);
        let otherDate = moment.duration('22:59:59.999');
        let otherSegment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);

        expect(HourSegmentHandler.getInstance().isInSameSegmentType(null, null)).equal(false);
        expect(HourSegmentHandler.getInstance().isInSameSegmentType(null, otherSegment)).equal(false);
        expect(HourSegmentHandler.getInstance().isInSameSegmentType(segment, null)).equal(false);


        expect(HourSegmentHandler.getInstance().isInSameSegmentType(segment, otherSegment)).equal(true);

        otherDate = moment.duration('23:00:00.000');
        otherSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(otherDate, HourSegment.TYPE_MINUTE);
        expect(HourSegmentHandler.getInstance().isInSameSegmentType(segment, otherSegment, HourSegment.TYPE_MS)).equal(false);
    });

    it('test: segmentsAreEquivalent', () => {
        let date = moment.duration('22:59:45.999');
        let segment: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(date, HourSegment.TYPE_SECOND);
        let otherDate = moment.duration('22:59:59.999');
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
        let duration1 = moment.duration(1000);
        let duration1bis = moment.duration(1000);
        let duration2 = moment.duration(2000);
        let segment1: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_SECOND);
        let segment1bis: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1bis, HourSegment.TYPE_SECOND);
        let segment2: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1bis, HourSegment.TYPE_MS);
        let segment3: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration2, HourSegment.TYPE_SECOND);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, null)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(null, segment1)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, null)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment1)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment1bis)).to.equal(true);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment2)).to.equal(false);
        expect(HourSegmentHandler.getInstance().segmentsAreEquivalent(segment1, segment3)).to.equal(false);
    });

    it('test: get_segment_from_range_start', () => {
        let duration1 = moment.duration('22:37:45.999');
        let duration2 = moment.duration('22:59:45.999');
        let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
        let segmentExpectedmin: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
        let segmentExpected: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).to.deep.equal(segmentExpected);
        segmentExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_MS);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, null)).to.deep.equal(segmentExpectedmin);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).to.deep.equal(null);
    });

    it('test: get_segment_from_range_end', () => {
        let duration1 = moment.duration('22:37:45.999');
        let duration2 = moment.duration('22:59:45.999');
        let hourRange: HourRange = HourRange.createNew(duration1, duration2, true, true, HourSegment.TYPE_SECOND);
        let segmentExpectedmin: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_MINUTE);
        let segmentExpected: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, HourSegment.TYPE_HOUR)).to.deep.equal(segmentExpected);
        segmentExpected = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_MS);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(hourRange, null)).to.deep.equal(segmentExpectedmin);
        expect(HourSegmentHandler.getInstance().get_segment_from_range_start(null, HourSegment.TYPE_HOUR)).to.deep.equal(null);
    });

    it('test: get_hour_ranges_', () => {
        let duration1 = moment.duration('22:37:45.999');
        let duration2 = moment.duration('22:59:45.999');
        let segment1: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration1, HourSegment.TYPE_HOUR);
        let segment2: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(duration2, HourSegment.TYPE_HOUR);
        let segments = [segment1, segment2];
        let hourRange1: HourRange = HourRange.createNew(moment.duration('22:00:00'), moment.duration('23:00:00'), true, false, HourSegment.TYPE_HOUR);
        let hourRange2: HourRange = HourRange.createNew(moment.duration('22:00:00'), moment.duration('23:00:00'), true, false, HourSegment.TYPE_HOUR);
        let hourRanges = [hourRange1, hourRange2];

        expect(HourSegmentHandler.getInstance()["get_hour_ranges_"](segments)).to.deep.equal(hourRanges);
        expect(HourSegmentHandler.getInstance()["get_hour_ranges_"]([])).to.deep.equal([]);
        expect(HourSegmentHandler.getInstance()["get_hour_ranges_"](null)).to.deep.equal([]);
    });

});

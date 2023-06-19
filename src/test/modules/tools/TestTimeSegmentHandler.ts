import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';

import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import DateHandler from '../../../shared/tools/DateHandler';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import moment from 'moment';

describe('TimeSegmentHandler', () => {

    it('test getBiggestTimeSegmentationType', () => {
        // expect(TimeSegmentHandler.getBiggestTimeSegmentationType(null, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(null);
        // expect(TimeSegmentHandler.getBiggestTimeSegmentationType(null, null)).to.equal(null);
        // expect(TimeSegmentHandler.getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, null)).to.equal(null);
        expect(TimeSegmentHandler.getBiggestTimeSegmentationType(TimeSegment.TYPE_YEAR, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_YEAR);
        expect(TimeSegmentHandler.getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_YEAR)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_DAY)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getBiggestTimeSegmentationType(TimeSegment.TYPE_DAY, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
    });

    it('test getSmallestTimeSegmentationType', () => {
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(null, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(undefined);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(null, null)).to.equal(undefined);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, null)).to.equal(4);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(TimeSegment.TYPE_YEAR, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_YEAR);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_YEAR)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_DAY)).to.equal(TimeSegment.TYPE_DAY);
        expect(TimeSegmentHandler.getSmallestTimeSegmentationType(TimeSegment.TYPE_DAY, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_DAY);
    });

    it('test getAllDataTimeSegments', () => {
        expect(TimeSegmentHandler.getAllDataTimeSegments(null, null, null)).to.equal(null);

        let res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-01-02').utc(true).unix(), TimeSegment.TYPE_DAY);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-02').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-01-02').utc(true).unix(), TimeSegment.TYPE_DAY, true);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(res[1]).to.be.equal(undefined);

        res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-02-02').utc(true).unix(), TimeSegment.TYPE_MONTH);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH, true);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1]).to.be.equal(undefined);

        res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-01-02').utc(true).unix(), TimeSegment.TYPE_MONTH);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1]).to.be.equal(undefined);

        res = TimeSegmentHandler.getAllDataTimeSegments(moment('2018-01-01').utc(true).unix(), moment('2018-01-02').utc(true).unix(), TimeSegment.TYPE_MONTH, true);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1]).to.be.equal(undefined);
    });

    it('test getCorrespondingTimeSegment', () => {
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(
            moment('2018-03-01').utc(true).unix(),
            TimeSegment.TYPE_MONTH, 2).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);

        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_DAY, 1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-04').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_DAY, -1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-02').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_MONTH, -2).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2017-12-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_MONTH, 2).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_YEAR, -1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2017-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex);
        expect(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-02-03').utc(true).unix(), TimeSegment.TYPE_YEAR, 1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex);
    });

    it('test get_surrounding_ts_range', () => {
        expect(RangeHandler.getIndex(TimeSegmentHandler.get_surrounding_ts_range([
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR)]))).to.equal('0KqDrc');
        expect(RangeHandler.getIndex(TimeSegmentHandler.get_surrounding_ts_range([
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2015-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH)]))).to.equal('1GN4W/');
    });

    it('test getCumulTimeSegments', () => {
        expect(TimeSegmentHandler.getCumulTimeSegments(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(null);
        expect(TimeSegmentHandler.getCumulTimeSegments(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.deep.equal([
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH)]);

        let res = TimeSegmentHandler.getCumulTimeSegments(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-01').utc(true).unix(), TimeSegment.TYPE_MONTH));
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[2].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[3]).to.be.equal(undefined);

        expect(TimeSegmentHandler.getCumulTimeSegments(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-01').utc(true).unix(), TimeSegment.TYPE_DAY))).to.deep.equal([
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-01').utc(true).unix(), TimeSegment.TYPE_DAY)]);

        res = TimeSegmentHandler.getCumulTimeSegments(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-03').utc(true).unix(), TimeSegment.TYPE_DAY));
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-01').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-02').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(res[2].dateIndex).to.deep.equal(TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-03-03').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);
        expect(res[3]).to.be.equal(undefined);
    });

    it('test getEndTimeSegment', () => {
        expect(TimeSegmentHandler.getEndTimeSegment(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getEndTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH)))).to.equal('2019-05-01');
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getEndTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_DAY)))).to.equal('2019-04-02');
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getEndTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR)))).to.equal('2020-01-01');
    });

    it('test getParentTimeSegment', () => {
        expect(TimeSegmentHandler.getParentTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(null);

        expect(TimeSegmentHandler.getParentTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH)).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex);

        expect(TimeSegmentHandler.getParentTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-15').utc(true).unix(), TimeSegment.TYPE_DAY)).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
    });

    it('test getPreviousTimeSegment', () => {
        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR)).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex);

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR), TimeSegment.TYPE_YEAR, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR).dateIndex);

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-15').utc(true).unix(), TimeSegment.TYPE_DAY), TimeSegment.TYPE_DAY).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-14').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-15').utc(true).unix(), TimeSegment.TYPE_DAY), TimeSegment.TYPE_DAY, 2).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-13').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-15').utc(true).unix(), TimeSegment.TYPE_DAY), TimeSegment.TYPE_DAY, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-16').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-15').utc(true).unix(), TimeSegment.TYPE_DAY), TimeSegment.TYPE_MONTH, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-15').utc(true).unix(), TimeSegment.TYPE_DAY).dateIndex);

        // Ambiguous
        // expect(TimeSegmentHandler.getPreviousTimeSegment(
        // TimeSegmentHandler.getCorrespondingTimeSegment('2019-01-31', type: TimeSegment.TYPE_DAY)        // }, TimeSegment.TYPE_MONTH, -1)).to.deep.equal(
        // TimeSegmentHandler.getCorrespondingTimeSegment('2019-02-28', type: TimeSegment.TYPE_DAY)        // });

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH), TimeSegment.TYPE_YEAR, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);

        expect(TimeSegmentHandler.getPreviousTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH), TimeSegment.TYPE_YEAR).dateIndex).to.deep.equal(
                TimeSegmentHandler.getCorrespondingTimeSegment(moment('2018-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH).dateIndex);
    });

    it('test getPreviousTimeSegments', () => {
        expect(TimeSegmentHandler.getPreviousTimeSegments(null)).to.equal(null);

        let res = TimeSegmentHandler.getPreviousTimeSegments([
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH)]);
        expect(res[0].dateIndex).to.deep.equal('2019-03-01');
        expect(res[1].dateIndex).to.deep.equal('2019-04-01');
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getPreviousTimeSegments([
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH)], TimeSegment.TYPE_YEAR);
        expect(res[0].dateIndex).to.deep.equal('2018-04-01');
        expect(res[1].dateIndex).to.deep.equal('2018-05-01');
        expect(res[2]).to.be.equal(undefined);
    });
    it('test getStartTimeSegment', () => {
        expect(TimeSegmentHandler.getStartTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.deep.equal(moment('2019-05-01').startOf('day').utc(true).unix());
        expect(TimeSegmentHandler.getStartTimeSegment(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-15').utc(true).unix(), TimeSegment.TYPE_DAY))).to.deep.equal(moment('2019-05-15').startOf('day').utc(true).unix());
    });

    it('test getInclusiveEndTimeSegment', () => {
        expect(TimeSegmentHandler.getInclusiveEndTimeSegment(null)).to.equal(null);

        let timeSeg = TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-12').utc(true).unix(), TimeSegment.TYPE_MONTH);
        expect(TimeSegmentHandler.getInclusiveEndTimeSegment(timeSeg, null)).to.deep.equal(moment('2019-05-01').utc(true).add(1, "month").add(-1, "day").unix());
        expect(TimeSegmentHandler.getInclusiveEndTimeSegment(timeSeg)).to.deep.equal(
            moment('2019-05-01').utc(true).add(1, "month").add(-1, "day").unix()
        );

        timeSeg = TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-09-18').utc(true).unix(), TimeSegment.TYPE_YEAR);
        expect(TimeSegmentHandler.getInclusiveEndTimeSegment(timeSeg, TimeSegment.TYPE_HOUR)).to.deep.equal(
            moment('2019-01-01').utc(true).add(1, "year").add(-1, "hour").unix()
        );

        timeSeg = TimeSegmentHandler.getCorrespondingTimeSegment(moment('2021-11-05').utc(true).unix(), TimeSegment.TYPE_MINUTE);
        expect(TimeSegmentHandler.getInclusiveEndTimeSegment(timeSeg, TimeSegment.TYPE_DAY)).to.deep.equal(
            moment('2021-11-05').utc(true).add(1, "minute").add(-1, "day").unix());

    });

    it('test isEltInSegment', () => {
        let momentTest1 = moment('2019-05-01').utc(true).unix();
        let momentTest2 = moment('2019-05-02').utc(true).unix();
        let momentTest3 = moment('2020-05-01').utc(true).unix();
        let momentTest4 = moment('2020-05-02').utc(true).unix();
        let timeSegmentTest = TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);

        expect(TimeSegmentHandler.isEltInSegment(null, timeSegmentTest)).to.equal(false);
        expect(TimeSegmentHandler.isEltInSegment(momentTest1, null)).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(momentTest1, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.isEltInSegment(momentTest2, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.isEltInSegment(momentTest3, timeSegmentTest)).to.equal(false);
        expect(TimeSegmentHandler.isEltInSegment(momentTest4, timeSegmentTest)).to.equal(false);

        timeSegmentTest = TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_YEAR);
        momentTest1 = moment('2019-01-01').utc(true).unix();
        momentTest2 = moment('2019-01-02').utc(true).unix();
        momentTest3 = moment('2020-01-01').utc(true).unix();
        momentTest4 = moment('2020-01-02').utc(true).unix();
        expect(TimeSegmentHandler.isEltInSegment(momentTest1, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.isEltInSegment(momentTest2, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.isEltInSegment(momentTest3, timeSegmentTest)).to.equal(false);
        expect(TimeSegmentHandler.isEltInSegment(momentTest4, timeSegmentTest)).to.equal(false);

    });
    it('test isInSameSegmentType', () => {
        expect(TimeSegmentHandler.isInSameSegmentType(
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH), null)).to.equal(false);
        expect(TimeSegmentHandler.isInSameSegmentType(null,
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(true);
        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH), TimeSegment.TYPE_DAY)).to.equal(true);

        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_MONTH), TimeSegment.TYPE_YEAR)).to.equal(true);

        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-20').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-21').utc(true).unix(), TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(true);

        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-20').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-21').utc(true).unix(), TimeSegment.TYPE_DAY), TimeSegment.TYPE_MONTH)).to.equal(true);

        expect(TimeSegmentHandler.isInSameSegmentType(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-20').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-21').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isMomentInTimeSegment', () => {
        expect(TimeSegmentHandler.isEltInSegment(null, null)).to.equal(false);
        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-01').startOf("day").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-21').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-01').startOf("month").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-04-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-01').startOf("year").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(true);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-12-31').startOf("year").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(true);

        expect(TimeSegmentHandler.isEltInSegment(moment('2020-01-01').startOf("year").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(moment('2018-12-31').startOf("year").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-21').startOf("day").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-21').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(true);
        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-21').startOf("day").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-20').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);
        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-21').startOf("day").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-22').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-31').startOf("month").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(true);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-01-31').startOf("month").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.isEltInSegment(moment('2019-02-01').startOf("month").utc(true).unix(),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

    });

    it('test segmentsAreEquivalent', () => {
        expect(TimeSegmentHandler.segmentsAreEquivalent(null, null)).to.equal(true);
        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(true);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(true);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(true);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-01-01').utc(true).unix(), TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-02').utc(true).unix(), TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.segmentsAreEquivalent(

            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-02-01').utc(true).unix(), TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-01-01').utc(true).unix(), TimeSegment.TYPE_MONTH))).to.equal(false);
    });

    it('test get_date_indexes', () => {
        let timeSegmentTests = [TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
        TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-11-17').utc(true).unix(), TimeSegment.TYPE_YEAR),
        TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-03-29').utc(true).unix(), TimeSegment.TYPE_MONTH)
        ];
        let res = ['2019-05-01', '2019-01-01', '2020-03-01'];

        expect(TimeSegmentHandler.get_date_indexes(null)).to.deep.equal([]);
        //expect(TimeSegmentHandler.get_date_indexes([null])).to.deep.equal([]);

        expect(TimeSegmentHandler.get_date_indexes(timeSegmentTests)).to.deep.equal(res);

    });

    // it('test get_ts_ranges', () => {
    //     let timeSegmentTests = [TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-05-01').utc(true).unix(), TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
    //     TimeSegmentHandler.getCorrespondingTimeSegment(moment('2019-11-17').utc(true).unix(), TimeSegment.TYPE_YEAR),
    //     TimeSegmentHandler.getCorrespondingTimeSegment(moment('2020-03-29').utc(true).unix(), TimeSegment.TYPE_MONTH)
    //     ];
    //     let res = ['2019-05-01', '2019-01-01', '2020-03-01'];

    //     expect(TimeSegmentHandler.get_ts_ranges(null)).to.deep.equal(null);
    //     expect(TimeSegmentHandler.get_ts_ranges([null])).to.deep.equal([]);

    //     expect(TimeSegmentHandler.get_ts_ranges(timeSegmentTests)).to.deep.equal(res);

    // });

});
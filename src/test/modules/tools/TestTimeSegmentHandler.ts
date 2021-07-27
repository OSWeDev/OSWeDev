import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';

import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import DateHandler from '../../../shared/tools/DateHandler';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import * as moment from 'moment';

describe('TimeSegmentHandler', () => {

    it('test getBiggestTimeSegmentationType', () => {
        // expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(null, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(null);
        // expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(null, null)).to.equal(null);
        // expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, null)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(TimeSegment.TYPE_YEAR, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_YEAR);
        expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_YEAR)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_DAY)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getInstance().getBiggestTimeSegmentationType(TimeSegment.TYPE_DAY, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
    });

    it('test getSmallestTimeSegmentationType', () => {
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(null, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(undefined);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(null, null)).to.equal(undefined);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, null)).to.equal(4);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(TimeSegment.TYPE_YEAR, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_YEAR);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_YEAR)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(TimeSegment.TYPE_ROLLING_YEAR_MONTH_START, TimeSegment.TYPE_DAY)).to.equal(TimeSegment.TYPE_DAY);
        expect(TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(TimeSegment.TYPE_DAY, TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)).to.equal(TimeSegment.TYPE_DAY);
    });

    it('test getAllDataTimeSegments', () => {
        expect(TimeSegmentHandler.getInstance().getAllDataTimeSegments(null, null, null)).to.equal(null);

        let res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-01-02').utc(true), TimeSegment.TYPE_DAY);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_DAY).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-02', TimeSegment.TYPE_DAY).dateIndex);
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-01-02').utc(true), TimeSegment.TYPE_DAY, true);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_DAY).dateIndex);
        expect(res[1]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-02-02').utc(true), TimeSegment.TYPE_MONTH);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-02-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-02-01').utc(true), TimeSegment.TYPE_MONTH);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-02-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-02-01').utc(true), TimeSegment.TYPE_MONTH, true);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-01-02').utc(true), TimeSegment.TYPE_MONTH);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment('2018-01-01').utc(true), moment('2018-01-02').utc(true), TimeSegment.TYPE_MONTH, true);
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1]).to.be.equal(undefined);
    });

    it('test getCorrespondingTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment('2018-03-01'),
            TimeSegment.TYPE_MONTH, 2).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-05-01', TimeSegment.TYPE_MONTH).dateIndex);

        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_DAY).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-02-03', TimeSegment.TYPE_DAY).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_DAY, 1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-02-04', TimeSegment.TYPE_DAY).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_DAY, -1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-02-02', TimeSegment.TYPE_DAY).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_MONTH).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-02-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_MONTH, -2).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2017-12-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_MONTH, 2).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-04-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_YEAR).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_YEAR).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_YEAR, -1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2017-01-01', TimeSegment.TYPE_YEAR).dateIndex);
        expect(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment('2018-02-03'), TimeSegment.TYPE_YEAR, 1).dateIndex).to.deep.equal(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR).dateIndex);
    });

    it('test get_surrounding_ts_range', () => {
        expect(RangeHandler.getInstance().getIndex(TimeSegmentHandler.getInstance().get_surrounding_ts_range([
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR)]))).to.equal('[1546300800000,1577836800000)');
        expect(RangeHandler.getInstance().getIndex(TimeSegmentHandler.getInstance().get_surrounding_ts_range([
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2015-02-01', TimeSegment.TYPE_MONTH)]))).to.equal('[1422748800000,1425168000000)');
    });

    it('test getCumulTimeSegments', () => {
        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.deep.equal([
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH)]);

        let res = TimeSegmentHandler.getInstance().getCumulTimeSegments(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-01', TimeSegment.TYPE_MONTH));
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-02-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[2].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-01', TimeSegment.TYPE_MONTH).dateIndex);
        expect(res[3]).to.be.equal(undefined);

        expect(TimeSegmentHandler.getInstance().getCumulTimeSegments(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-01', TimeSegment.TYPE_DAY))).to.deep.equal([
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-01', TimeSegment.TYPE_DAY)]);

        res = TimeSegmentHandler.getInstance().getCumulTimeSegments(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-03', TimeSegment.TYPE_DAY));
        expect(res[0].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-01', TimeSegment.TYPE_DAY).dateIndex);
        expect(res[1].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-02', TimeSegment.TYPE_DAY).dateIndex);
        expect(res[2].dateIndex).to.deep.equal(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-03', TimeSegment.TYPE_DAY).dateIndex);
        expect(res[3]).to.be.equal(undefined);
    });

    it('test getDateInMonthSegment', () => {
        expect(TimeSegmentHandler.getInstance().getDateInMonthSegment(null, null)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getDateInMonthSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-03-03', TimeSegment.TYPE_DAY), 10)).to.equal(null);
        expect(TimeSegmentHandler.getInstance().getDateInMonthSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR), 10)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getDateInMonthSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH), 10))).to.equal('2019-04-10');
    });

    it('test getEndTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getEndTimeSegment(null)).to.equal(null);
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getEndTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH)))).to.equal('2019-05-01');
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getEndTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_DAY)))).to.equal('2019-04-02');
        expect(DateHandler.getInstance().formatDayForIndex(TimeSegmentHandler.getInstance().getEndTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR)))).to.equal('2020-01-01');
    });

    it('test getParentTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getParentTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(null);

        expect(TimeSegmentHandler.getInstance().getParentTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH)).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR).dateIndex);

        expect(TimeSegmentHandler.getInstance().getParentTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-15', TimeSegment.TYPE_DAY)).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH).dateIndex);
    });

    it('test getPreviousTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR)).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-01-01', TimeSegment.TYPE_YEAR).dateIndex);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR), TimeSegment.TYPE_YEAR, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2020-01-01', TimeSegment.TYPE_YEAR).dateIndex);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-15', TimeSegment.TYPE_DAY), TimeSegment.TYPE_DAY).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-14', TimeSegment.TYPE_DAY).dateIndex);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-15', TimeSegment.TYPE_DAY), TimeSegment.TYPE_DAY, 2).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-13', TimeSegment.TYPE_DAY).dateIndex);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-15', TimeSegment.TYPE_DAY), TimeSegment.TYPE_DAY, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-16', TimeSegment.TYPE_DAY).dateIndex);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-15', TimeSegment.TYPE_DAY), TimeSegment.TYPE_MONTH, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-15', TimeSegment.TYPE_DAY).dateIndex);

        // Ambiguous
        // expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
        // TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-31', type: TimeSegment.TYPE_DAY)        // }, TimeSegment.TYPE_MONTH, -1)).to.deep.equal(
        // TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-02-28', type: TimeSegment.TYPE_DAY)        // });

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH), TimeSegment.TYPE_YEAR, -1).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2020-05-01', TimeSegment.TYPE_MONTH).dateIndex);

        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH), TimeSegment.TYPE_YEAR).dateIndex).to.deep.equal(
                TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2018-05-01', TimeSegment.TYPE_MONTH).dateIndex);
    });

    it('test getPreviousTimeSegments', () => {
        expect(TimeSegmentHandler.getInstance().getPreviousTimeSegments(null)).to.equal(null);

        let res = TimeSegmentHandler.getInstance().getPreviousTimeSegments([
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH)]);
        expect(res[0].dateIndex).to.deep.equal('2019-03-01');
        expect(res[1].dateIndex).to.deep.equal('2019-04-01');
        expect(res[2]).to.be.equal(undefined);

        res = TimeSegmentHandler.getInstance().getPreviousTimeSegments([
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH)], TimeSegment.TYPE_YEAR);
        expect(res[0].dateIndex).to.deep.equal('2018-04-01');
        expect(res[1].dateIndex).to.deep.equal('2018-05-01');
        expect(res[2]).to.be.equal(undefined);
    });
    it('test getStartTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getStartTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH))).to.deep.equal(moment('2019-05-01').startOf('day').utc(true));
        expect(TimeSegmentHandler.getInstance().getStartTimeSegment(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-15', TimeSegment.TYPE_DAY))).to.deep.equal(moment('2019-05-15').startOf('day').utc(true));
    });

    it('test getInclusiveEndTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().getInclusiveEndTimeSegment(null)).to.equal(null);

        let timeSeg = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-12', TimeSegment.TYPE_MONTH);
        expect(TimeSegmentHandler.getInstance().getInclusiveEndTimeSegment(timeSeg, null)).to.deep.equal(moment('2019-05-01').utc(true).add(1, "month").add(-1, "day"));
        expect(TimeSegmentHandler.getInstance().getInclusiveEndTimeSegment(timeSeg)).to.deep.equal(
            moment('2019-05-01').utc(true).add(1, "month").add(-1, "day")
        );

        timeSeg = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2009-09-18', TimeSegment.TYPE_YEAR);
        expect(TimeSegmentHandler.getInstance().getInclusiveEndTimeSegment(timeSeg, TimeSegment.TYPE_HOUR)).to.deep.equal(
            moment('2009-01-01').utc(true).add(1, "year").add(-1, "hour")
        );

        timeSeg = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2021-11-05', TimeSegment.TYPE_MINUTE);
        expect(TimeSegmentHandler.getInstance().getInclusiveEndTimeSegment(timeSeg, TimeSegment.TYPE_DAY)).to.deep.equal(
            moment('2021-11-05').utc(true).add(1, "minute").add(-1, "day"));

    });

    it('test isEltInSegment', () => {
        let momentTest1 = moment('2019-05-01');
        let momentTest2 = moment('2019-05-02');
        let momentTest3 = moment('2020-05-01');
        let momentTest4 = moment('2020-05-02');
        let timeSegmentTest = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_ROLLING_YEAR_MONTH_START);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(null, timeSegmentTest)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest1, null)).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest1, timeSegmentTest)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest2, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest3, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest4, timeSegmentTest)).to.equal(false);

        timeSegmentTest = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_YEAR);
        momentTest1 = moment('2019-01-01');
        momentTest2 = moment('2019-01-02');
        momentTest3 = moment('2020-01-01');
        momentTest4 = moment('2020-01-02');
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest1, timeSegmentTest)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest2, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest3, timeSegmentTest)).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(momentTest4, timeSegmentTest)).to.equal(false);

    });
    it('test isInSameSegmentType', () => {
        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH), null)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(null,
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH))).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH), TimeSegment.TYPE_DAY)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_MONTH), TimeSegment.TYPE_YEAR)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-20', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-21', TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-20', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-21', TimeSegment.TYPE_DAY), TimeSegment.TYPE_MONTH)).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isInSameSegmentType(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-20', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-21', TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isMomentInTimeSegment', () => {
        expect(TimeSegmentHandler.getInstance().isEltInSegment(null, null)).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-01').startOf("day").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-21', TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-01').startOf("month").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-04-01', TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-01').startOf("year").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-12-31').startOf("year").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2020-01-01').startOf("year").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2018-12-31').startOf("year").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-21').startOf("day").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-21', TimeSegment.TYPE_DAY))).to.equal(true);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-21').startOf("day").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-20', TimeSegment.TYPE_DAY))).to.equal(false);
        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-21').startOf("day").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-22', TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-31').startOf("month").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.equal(true);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-01-31').startOf("month").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-02-01', TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().isEltInSegment(moment('2019-02-01').startOf("month").utc(true),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.equal(false);

    });

    it('test segmentsAreEquivalent', () => {
        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(null, null)).to.equal(true);
        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.equal(true);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY))).to.equal(true);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(true);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_YEAR),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2020-01-01', TimeSegment.TYPE_YEAR))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_DAY),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-02', TimeSegment.TYPE_DAY))).to.equal(false);

        expect(TimeSegmentHandler.getInstance().segmentsAreEquivalent(

            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-02-01', TimeSegment.TYPE_MONTH),
            TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-01-01', TimeSegment.TYPE_MONTH))).to.equal(false);
    });

    it('test get_date_indexes', () => {
        let timeSegmentTests = [TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-11-17', TimeSegment.TYPE_YEAR),
        TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2020-03-29', TimeSegment.TYPE_MONTH)
        ];
        let res = ['2019-05-01', '2019-01-01', '2020-03-01'];

        expect(TimeSegmentHandler.getInstance().get_date_indexes(null)).to.deep.equal([]);
        //expect(TimeSegmentHandler.getInstance().get_date_indexes([null])).to.deep.equal([]);

        expect(TimeSegmentHandler.getInstance().get_date_indexes(timeSegmentTests)).to.deep.equal(res);

    });

    // it('test get_ts_ranges', () => {
    //     let timeSegmentTests = [TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-05-01', TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
    //     TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2019-11-17', TimeSegment.TYPE_YEAR),
    //     TimeSegmentHandler.getInstance().getCorrespondingTimeSegment('2020-03-29', TimeSegment.TYPE_MONTH)
    //     ];
    //     let res = ['2019-05-01', '2019-01-01', '2020-03-01'];

    //     expect(TimeSegmentHandler.getInstance().get_ts_ranges(null)).to.deep.equal(null);
    //     expect(TimeSegmentHandler.getInstance().get_ts_ranges([null])).to.deep.equal([]);

    //     expect(TimeSegmentHandler.getInstance().get_ts_ranges(timeSegmentTests)).to.deep.equal(res);

    // });

});
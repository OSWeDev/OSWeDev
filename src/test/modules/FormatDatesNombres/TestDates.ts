import { expect } from 'chai';
import 'mocha';

import * as moment from 'moment';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

describe('Dates', () => {

    const basicDate = 1627903493; // 2-08-2021 11:24:53 GMT
    const edgeDate = 1583020799; // 28-02-2020 23:59:59 GMT
    const reverseEdgeDate = 1583020800;  // 00-03-2020 00:00:00 GMT

    it('now', () => {
        let b = moment.unix(basicDate).unix();
        let a = basicDate;
        expect(a).to.equal(b);
    });

    it('add', () => {
        // add 1
        let b = moment.unix(basicDate).utc().add(1, 'day').unix();
        let a = Dates.add(basicDate, 1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'day').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(1, 'hour').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'hour').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(1, 'minute').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'minute').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        /*  b = moment().utc().add(1, 'month').unix();
         a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_MONTH);
         expect(a - b).to.be.lessThan(2); */
        b = moment.unix(basicDate).utc().add(1, 'month').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'month').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(1, 'second').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'second').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(1, 'week').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().add(1, 'week').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        /* b = moment().utc().add(1, 'year').unix();
        a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR);
        expect(a - b).to.be.lessThan(2); */
        b = moment.unix(basicDate).utc().add(1, 'year').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        /**
         * Cas particuliers, incohérents entre Date et momentjs, on utilise la version de Date
         */
        // b = moment.unix(edgeDate).utc().add(1, 'year').unix();
        let date_ = new Date(edgeDate * 1000);
        b = date_.setUTCFullYear(date_.getUTCFullYear() + 1) / 1000;
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        // add 0
        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_DAY)).to.equal(basicDate);

        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_HOUR)).to.equal(basicDate);

        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_MINUTE)).to.equal(basicDate);

        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_MONTH)).to.equal(basicDate);

        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_SECOND)).to.equal(basicDate);

        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_WEEK)).to.equal(basicDate);

        expect(Dates.add(basicDate, 0, TimeSegment.TYPE_YEAR)).to.equal(basicDate);

        // remove 1
        b = moment.unix(basicDate).utc().add(-1, 'day').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'day').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'hour').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'hour').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'minute').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'minute').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'month').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'month').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'second').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'second').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'week').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'week').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(-1, 'year').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).utc().add(-1, 'year').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        // add forbidden values
        b = moment.unix(basicDate).utc().add(undefined, 'day').unix();
        a = Dates.add(basicDate, undefined, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(null, 'day').unix();
        a = Dates.add(basicDate, null, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().add(NaN, 'day').unix();
        a = Dates.add(basicDate, NaN, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);
    });

    it('startOf', () => {
        let b = moment.unix(basicDate).utc().startOf('day').unix();
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().startOf('hour').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().startOf('minute').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().startOf('second').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().startOf('month').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().startOf('year').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().startOf('isoWeek').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);
    });

    it('endOf', () => {
        let b = moment.unix(basicDate).utc().endOf('day').unix();
        let a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().endOf('hour').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().endOf('minute').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().endOf('second').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().endOf('month').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().endOf('year').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc().endOf('isoWeek').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        // edgy : 15 fev 2020 (bissextile)
        b = moment.unix(1581768000).utc().endOf('month').unix();
        a = Dates.endOf(1581768000, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc().endOf('isoWeek').unix();
        a = Dates.endOf(edgeDate, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);
    });

    it('format', () => {
        let b = moment.unix(basicDate).utc().startOf('day');
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('hour');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('minute');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('second');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('month');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('year');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('isoWeek');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
        // expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        // forbidden values
        expect(Dates.format(null, "DD/MM/YYYY HH:mm:ss")).to.equal(null);
        expect(Dates.format(undefined, "DD/MM/YYYY HH:mm:ss")).to.equal(null);
        expect(Dates.format(NaN, "DD/MM/YYYY HH:mm:ss")).to.equal(null);

        expect(Dates.format(basicDate, "foo-bar")).to.equal(moment.unix(basicDate).utc().format("foo-bar"));
    });

    it('diff', () => {
        let a1 = basicDate;
        let a = Dates.startOf(a1, TimeSegment.TYPE_DAY);

        expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'day', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_WEEK, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'week', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MONTH, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'month', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_YEAR, false)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'year', false));

        expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'day', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_WEEK, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'week', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MONTH, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'month', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_YEAR, true)).to.equal(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'year', true));

        expect(Dates.diff(a, a1, TimeSegment.TYPE_DAY, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'day', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_HOUR, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'hour', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'minute', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_SECOND, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'second', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_WEEK, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'week', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_MONTH, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'month', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_YEAR, false)).to.equal(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'year', false));
    });

    it('isSame', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'day'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'hour'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'minute'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'second'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'week'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'month'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'year'));

        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'day'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'hour'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'minute'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'second'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'week'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'month'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'year'));

        // forbidden values
        expect(Dates.isSame(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(null).utc(), 'day'));
        expect(Dates.isSame(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(undefined).utc(), 'day'));
        expect(Dates.isSame(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(NaN).utc(), 'day'));
    });

    it('isBefore', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'day'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'hour'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'minute'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'second'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'week'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'month'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'year'));

        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'day'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'hour'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'minute'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'second'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'week'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'month'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'year'));

        // forbidden values
        expect(Dates.isBefore(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(null).utc(), 'day'));
        expect(Dates.isBefore(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(undefined).utc(), 'day'));
        expect(Dates.isBefore(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isBefore(moment.unix(NaN).utc(), 'day'));
    });

    it('isSameOrBefore', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'day'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'hour'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'minute'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'second'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'week'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'month'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'year'));

        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'day'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'hour'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'minute'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'second'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'week'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'month'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'year'));

        // forbidden values
        expect(Dates.isSameOrBefore(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(null).utc(), 'day'));
        expect(Dates.isSameOrBefore(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(undefined).utc(), 'day'));
        expect(Dates.isSameOrBefore(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(NaN).utc(), 'day'));
    });

    it('isAfter', () => {
        let a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'day'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'hour'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'minute'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'second'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'week'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'month'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'year'));

        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'day'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'hour'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'minute'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'second'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'week'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'month'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'year'));

        // forbidden values
        expect(Dates.isAfter(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(null).utc(), 'day'));
        expect(Dates.isAfter(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(undefined).utc(), 'day'));
        expect(Dates.isAfter(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isAfter(moment.unix(NaN).utc(), 'day'));
    });

    it('isSameOrAfter', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'day'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'hour'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'minute'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'second'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'week'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'month'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'year'));

        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'day'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'hour'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'minute'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'second'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'week'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'month'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'year'));

        // forbidden values
        expect(Dates.isSameOrAfter(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(null).utc(), 'day'));
        expect(Dates.isSameOrAfter(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(undefined).utc(), 'day'));
        expect(Dates.isSameOrAfter(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(NaN).utc(), 'day'));
    });

    it('isBetween', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        let b = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isBetween(basicDate, a, b)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, basicDate, b)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(basicDate).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(a, basicDate, basicDate)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(basicDate).utc()));
        expect(Dates.isBetween(basicDate, basicDate, basicDate)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(basicDate).utc(), moment.unix(basicDate).utc()));
        expect(Dates.isBetween(a, basicDate, b)).to.equal(moment.unix(a).utc().isBetween(moment.unix(basicDate).utc(), moment.unix(b).utc()));

        // forbidden values
        expect(Dates.isBetween(null, a, b)).to.equal(moment.unix(null).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, null, b)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(null).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, a, null)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(null).utc()));
        expect(Dates.isBetween(null, null, b)).to.equal(moment.unix(null).utc().isBetween(moment.unix(null).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(null, a, null)).to.equal(moment.unix(null).utc().isBetween(moment.unix(a).utc(), moment.unix(null).utc()));
        expect(Dates.isBetween(basicDate, null, null)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(null).utc(), moment.unix(null).utc()));
        expect(Dates.isBetween(null, null, null)).to.equal(moment.unix(null).utc().isBetween(moment.unix(null).utc(), moment.unix(null).utc()));

        expect(Dates.isBetween(undefined, a, b)).to.equal(moment.unix(undefined).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, undefined, b)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(undefined).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, a, undefined)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(undefined).utc()));
        expect(Dates.isBetween(undefined, undefined, b)).to.equal(moment.unix(undefined).utc().isBetween(moment.unix(undefined).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(undefined, a, undefined)).to.equal(moment.unix(undefined).utc().isBetween(moment.unix(a).utc(), moment.unix(undefined).utc()));
        expect(Dates.isBetween(basicDate, undefined, undefined)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(undefined).utc(), moment.unix(undefined).utc()));
        expect(Dates.isBetween(undefined, undefined, undefined)).to.equal(moment.unix(undefined).utc().isBetween(moment.unix(undefined).utc(), moment.unix(undefined).utc()));

        expect(Dates.isBetween(NaN, a, b)).to.equal(moment.unix(NaN).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, NaN, b)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(NaN).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(basicDate, a, NaN)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(NaN).utc()));
        expect(Dates.isBetween(NaN, NaN, b)).to.equal(moment.unix(NaN).utc().isBetween(moment.unix(NaN).utc(), moment.unix(b).utc()));
        expect(Dates.isBetween(NaN, a, NaN)).to.equal(moment.unix(NaN).utc().isBetween(moment.unix(a).utc(), moment.unix(NaN).utc()));
        expect(Dates.isBetween(basicDate, NaN, NaN)).to.equal(moment.unix(basicDate).utc().isBetween(moment.unix(NaN).utc(), moment.unix(NaN).utc()));
        expect(Dates.isBetween(NaN, NaN, NaN)).to.equal(moment.unix(NaN).utc().isBetween(moment.unix(NaN).utc(), moment.unix(NaN).utc()));
    });

    it('hour', () => {
        let b = moment().utc().hour();
        let a = Dates.hour();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc().hour(16).unix();
        a = Dates.hour(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.hour(basicDate)).to.equal(moment.unix(basicDate).utc().hour());
        expect(Dates.hour(basicDate, 18)).to.equal(moment.unix(basicDate).utc().hour(18).unix());

        // forbidden values

        /**
         * Résulat volontairement différent de moment => si on ne passe pas de paramètre, on charge Dates.now()
         */
        // expect(Dates.hour(undefined)).to.equal(moment.unix(undefined).utc().hour());
        // expect(Dates.hour(undefined, 18)).to.equal(moment.unix(undefined).utc().hour(18).unix());
        expect(Dates.hour(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().hour(undefined));

        // expect(Dates.hour(NaN)).to.equal(moment.unix(NaN).utc().hour());
        // expect(Dates.hour(NaN, 18)).to.equal(moment.unix(NaN).utc().hour(18).unix());
        expect(Dates.hour(basicDate, NaN)).to.equal(moment.unix(basicDate).utc().hour(NaN).unix());
    });

    it('hours', () => {
        let b = moment().utc().hours();
        let a = Dates.hours();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc().hours(16).unix();
        a = Dates.hours(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.hours(basicDate)).to.equal(moment.unix(basicDate).utc().hours());
        expect(Dates.hours(basicDate, 18)).to.equal(moment.unix(basicDate).utc().hours(18).unix());

        // forbidden values
        // expect(Dates.hours(undefined)).to.equal(moment.unix(undefined).utc().hours());
        // expect(Dates.hours(undefined, 18)).to.equal(moment.unix(undefined).utc().hours(18).unix());
        expect(Dates.hours(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().hours(undefined));

        // expect(Dates.hours(NaN)).to.equal(moment.unix(NaN).utc().hours());
        // expect(Dates.hours(NaN, 18)).to.equal(moment.unix(NaN).utc().hours(18).unix());
        expect(Dates.hours(basicDate, NaN)).to.equal(moment.unix(basicDate).utc().hours(NaN).unix());
    });
});
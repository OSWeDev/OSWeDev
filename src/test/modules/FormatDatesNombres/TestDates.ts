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
        let b = moment().utc(false).unix();
        let a = Dates.now();
        expect(a - b).to.be.lessThan(2);
    });

    it('add', () => {
        // add 1
        let b = moment.unix(basicDate).add(1, 'day').unix();
        let a = Dates.add(basicDate, 1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).add(1, 'day').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(1, 'hour').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).add(1, 'hour').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(1, 'minute').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).add(1, 'minute').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        /*  b = moment().utc(true).add(1, 'month').unix();
         a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_MONTH);
         expect(a - b).to.be.lessThan(2); */
        b = moment.unix(basicDate).add(1, 'month').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(1580472000).add(1, 'month').unix();  // 31-01-2020 12:00:00 GMT
        a = Dates.add(1580472000, 1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(1, 'second').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).add(1, 'second').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(1, 'week').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(1582372800).add(1, 'week').unix();  // 22-02-2020 12:00:00 GMT
        a = Dates.add(1582372800, 1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        /* b = moment().utc(true).add(1, 'year').unix();
        a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR);
        expect(a - b).to.be.lessThan(2); */
        b = moment.unix(basicDate).add(1, 'year').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).add(1, 'year').unix();
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
        b = moment.unix(basicDate).add(-1, 'day').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).add(-1, 'day').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-1, 'hour').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).add(-1, 'hour').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-1, 'minute').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).add(-1, 'minute').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-1, 'month').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(1585569600).utc(false).add(-1, 'month').unix();  // 30-03-2020 12:00:00 GMT
        a = Dates.add(1585569600, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-1, 'second').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).add(-1, 'second').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-1, 'week').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(1583582400).add(-1, 'week').unix();  // 07-03-2020 12:00:00 GMT
        a = Dates.add(1583582400, -1, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-1, 'year').unix();
        a = Dates.add(basicDate, -1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).add(-1, 'year').unix();
        a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        // add decimal numbers
        b = moment.unix(basicDate).add(0.333, 'day').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(0.333, 'hour').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-0.125, 'hour').unix();
        a = Dates.add(basicDate, -0.333, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(0.333, 'minute').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(0.333, 'second').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(0.333, 'week').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(-0.5, 'week').unix();
        a = Dates.add(basicDate, -0.5, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(0.333, 'month').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(0.333, 'year').unix();
        a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).add(0.333, 'month').unix();
        a = Dates.add(edgeDate, 0.333, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(reverseEdgeDate).add(-0.25, 'month').unix();
        a = Dates.add(reverseEdgeDate, -0.25, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        // Tests changement d'heures (dernier dimanche de mars et dernier dimanche d'octobre)
        b = moment.unix(1616864400).utc(false).add(2, 'day').unix();  // 27-03-2021 18:00:00 GMT
        a = Dates.add(1616864400, 2, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(1616864400).utc(false).add(15, 'hour').unix();  // 27-03-2021 18:00:00 GMT
        a = Dates.add(1616864400, 15, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(1519862400).utc(false).add(2, 'month').unix();  // 01-03-2018 00:00:00 GMT
        a = Dates.add(1519862400, 2, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(1603198800).utc(false).add(2, 'month').unix();  // 20-10-2020 13:00:00 GMT
        a = Dates.add(1603198800, 2, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(1604406897).utc(false).add(-1, 'month').unix();  // 03-11-2020 12:34:57 GMT
        a = Dates.add(1604406897, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(1604406897).utc(false).add(-6, 'month').unix();  // 03-11-2020 12:34:57 GMT
        b = moment.unix(b).utc(false).add(-6, 'month').unix();
        a = Dates.add(1604406897, -6, TimeSegment.TYPE_MONTH);
        a = Dates.add(a, -6, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        // Autres (enchaînement d'addition soustraction, overflow...)
        b = moment.unix(basicDate).utc(false).add(1, 'month').unix();
        b = moment.unix(b).utc(false).add(-1, 'month').unix();
        a = Dates.add(basicDate, 1, TimeSegment.TYPE_MONTH);
        a = Dates.add(a, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(false).add(2, 'month').unix();
        b = moment.unix(b).utc(false).add(-3, 'month').unix();
        a = Dates.add(basicDate, 2, TimeSegment.TYPE_MONTH);
        a = Dates.add(a, -3, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc(false).add(1, 'month').unix();
        b = moment.unix(b).utc(false).add(-1, 'month').unix();
        a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MONTH);
        a = Dates.add(a, -1, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc(false).add(2, 'month').unix();
        b = moment.unix(b).utc(false).add(-3, 'month').unix();
        a = Dates.add(edgeDate, 2, TimeSegment.TYPE_MONTH);
        a = Dates.add(a, -3, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(67, 'day').unix();
        a = Dates.add(basicDate, 67, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(67, 'hour').unix();
        a = Dates.add(basicDate, 67, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(67, 'minute').unix();
        a = Dates.add(basicDate, 67, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(3700, 'second').unix();
        a = Dates.add(basicDate, 3700, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(15, 'week').unix();
        a = Dates.add(basicDate, 15, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(67, 'week').unix();
        a = Dates.add(basicDate, 67, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(13, 'month').unix();
        a = Dates.add(basicDate, 13, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        // add forbidden values
        b = moment.unix(basicDate).add(undefined, 'day').unix();
        a = Dates.add(basicDate, undefined, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(null, 'day').unix();
        a = Dates.add(basicDate, null, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).add(NaN, 'day').unix();
        a = Dates.add(basicDate, NaN, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);
    });

    it('startOf', () => {
        let b = moment.unix(basicDate).utc(true).startOf('day').unix();
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).startOf('hour').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).startOf('minute').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).startOf('second').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(true).startOf('month').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(true).startOf('year').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(true).startOf('isoWeek').unix();
        a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);
    });

    it('endOf', () => {
        let b = moment.unix(basicDate).utc(true).endOf('day').unix();
        let a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).endOf('hour').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).endOf('minute').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).endOf('second').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(true).endOf('month').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(true).endOf('year').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(a).to.equal(b);

        b = moment.unix(basicDate).utc(true).endOf('isoWeek').unix();
        a = Dates.endOf(basicDate, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);

        // edgy : 15 fev 2020 (bissextile)
        b = moment.unix(1581768000).utc(true).endOf('month').unix();
        a = Dates.endOf(1581768000, TimeSegment.TYPE_MONTH);
        expect(a).to.equal(b);

        b = moment.unix(edgeDate).utc(true).endOf('isoWeek').unix();
        a = Dates.endOf(edgeDate, TimeSegment.TYPE_WEEK);
        expect(a).to.equal(b);
    });

    it('format', () => {
        let b = moment.unix(basicDate).utc(true).startOf('day');
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc(false).startOf('hour');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc(false).startOf('minute');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc(false).startOf('second');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc(true).startOf('month');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc(true).startOf('year');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc(true).startOf('isoWeek');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
        // expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss")).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        // forbidden values
        expect(Dates.format(null, "DD/MM/YYYY HH:mm:ss")).to.equal(null);
        expect(Dates.format(undefined, "DD/MM/YYYY HH:mm:ss")).to.equal(null);
        expect(Dates.format(NaN, "DD/MM/YYYY HH:mm:ss")).to.equal(null);

        expect(Dates.format(basicDate, "foo-bar")).to.equal(moment.unix(basicDate).utc(true).format("foo-bar"));
    });

    it('diff', () => {
        let a1 = edgeDate;
        let a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);

        expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'day', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'hour', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'minute', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'second', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_WEEK, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'week', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MONTH, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'month', false));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_YEAR, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'year', false));

        expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'day', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'hour', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'minute', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'second', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_WEEK, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'week', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_MONTH, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'month', true));
        expect(Dates.diff(a1, a, TimeSegment.TYPE_YEAR, true)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a).utc(true), 'year', true));

        expect(Dates.diff(a, a1, TimeSegment.TYPE_DAY, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'day', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_HOUR, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'hour', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'minute', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_SECOND, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'second', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_WEEK, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'week', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_MONTH, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'month', false));
        expect(Dates.diff(a, a1, TimeSegment.TYPE_YEAR, false)).to.equal(moment.unix(a).utc(true).diff(moment.unix(a1).utc(true), 'year', false));

        expect(Dates.diff(a1, a1, TimeSegment.TYPE_DAY, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'day', false));
        expect(Dates.diff(a1, a1, TimeSegment.TYPE_HOUR, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'hour', false));
        expect(Dates.diff(a1, a1, TimeSegment.TYPE_MINUTE, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'minute', false));
        expect(Dates.diff(a1, a1, TimeSegment.TYPE_SECOND, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'second', false));
        expect(Dates.diff(a1, a1, TimeSegment.TYPE_WEEK, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'week', false));
        expect(Dates.diff(a1, a1, TimeSegment.TYPE_MONTH, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'month', false));
        expect(Dates.diff(a1, a1, TimeSegment.TYPE_YEAR, false)).to.equal(moment.unix(a1).utc(true).diff(moment.unix(a1).utc(true), 'year', false));
    });

    it('isSame', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'day'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'hour'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'minute'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'second'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'week'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'month'));
        expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(basicDate).utc(true), 'year'));

        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'day'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'hour'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'minute'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'second'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'week'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'month'));
        expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(a).utc(true), 'year'));

        // forbidden values
        expect(Dates.isSame(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(null).utc(true), 'day'));
        expect(Dates.isSame(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(undefined).utc(true), 'day'));
        expect(Dates.isSame(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSame(moment.unix(NaN).utc(true), 'day'));
    });

    it('isBefore', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'day'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'hour'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'minute'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'second'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'week'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'month'));
        expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(basicDate).utc(true), 'year'));

        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'day'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'hour'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'minute'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'second'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'week'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'month'));
        expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(a).utc(true), 'year'));

        // forbidden values
        expect(Dates.isBefore(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(null).utc(true), 'day'));
        expect(Dates.isBefore(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(undefined).utc(true), 'day'));
        expect(Dates.isBefore(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isBefore(moment.unix(NaN).utc(true), 'day'));
    });

    it('isSameOrBefore', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'day'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'hour'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'minute'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'second'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'week'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'month'));
        expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(basicDate).utc(true), 'year'));

        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'day'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'hour'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'minute'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'second'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'week'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'month'));
        expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(a).utc(true), 'year'));

        // forbidden values
        expect(Dates.isSameOrBefore(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(null).utc(true), 'day'));
        expect(Dates.isSameOrBefore(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(undefined).utc(true), 'day'));
        expect(Dates.isSameOrBefore(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrBefore(moment.unix(NaN).utc(true), 'day'));
    });

    it('isAfter', () => {
        let a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'day'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'hour'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'minute'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'second'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'week'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'month'));
        expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(basicDate).utc(true), 'year'));

        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'day'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'hour'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'minute'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'second'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'week'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'month'));
        expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(a).utc(true), 'year'));

        // forbidden values
        expect(Dates.isAfter(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(null).utc(true), 'day'));
        expect(Dates.isAfter(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(undefined).utc(true), 'day'));
        expect(Dates.isAfter(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isAfter(moment.unix(NaN).utc(true), 'day'));
    });

    it('isSameOrAfter', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'day'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'hour'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'minute'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'second'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'week'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'month'));
        expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(basicDate).utc(true), 'year'));

        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'day'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'hour'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'minute'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'second'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'week'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'month'));
        expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(a).utc(true), 'year'));

        // forbidden values
        expect(Dates.isSameOrAfter(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(null).utc(true), 'day'));
        expect(Dates.isSameOrAfter(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(undefined).utc(true), 'day'));
        expect(Dates.isSameOrAfter(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc(true).isSameOrAfter(moment.unix(NaN).utc(true), 'day'));
    });

    it('isBetween', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        let b = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);

        expect(Dates.isBetween(basicDate, a, b)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, basicDate, b)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(basicDate).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(a, basicDate, basicDate)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(basicDate).utc(true)));
        expect(Dates.isBetween(basicDate, basicDate, basicDate)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(basicDate).utc(true), moment.unix(basicDate).utc(true)));
        expect(Dates.isBetween(a, basicDate, b)).to.equal(moment.unix(a).utc(true).isBetween(moment.unix(basicDate).utc(true), moment.unix(b).utc(true)));

        // forbidden values
        expect(Dates.isBetween(null, a, b)).to.equal(moment.unix(null).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, null, b)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(null).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, a, null)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(null).utc(true)));
        expect(Dates.isBetween(null, null, b)).to.equal(moment.unix(null).utc(true).isBetween(moment.unix(null).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(null, a, null)).to.equal(moment.unix(null).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(null).utc(true)));
        expect(Dates.isBetween(basicDate, null, null)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(null).utc(true), moment.unix(null).utc(true)));
        expect(Dates.isBetween(null, null, null)).to.equal(moment.unix(null).utc(true).isBetween(moment.unix(null).utc(true), moment.unix(null).utc(true)));

        expect(Dates.isBetween(undefined, a, b)).to.equal(moment.unix(undefined).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, undefined, b)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(undefined).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, a, undefined)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(undefined).utc(true)));
        expect(Dates.isBetween(undefined, undefined, b)).to.equal(moment.unix(undefined).utc(true).isBetween(moment.unix(undefined).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(undefined, a, undefined)).to.equal(moment.unix(undefined).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(undefined).utc(true)));
        expect(Dates.isBetween(basicDate, undefined, undefined)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(undefined).utc(true), moment.unix(undefined).utc(true)));
        expect(Dates.isBetween(undefined, undefined, undefined)).to.equal(moment.unix(undefined).utc(true).isBetween(moment.unix(undefined).utc(true), moment.unix(undefined).utc(true)));

        expect(Dates.isBetween(NaN, a, b)).to.equal(moment.unix(NaN).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, NaN, b)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(NaN).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(basicDate, a, NaN)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(NaN).utc(true)));
        expect(Dates.isBetween(NaN, NaN, b)).to.equal(moment.unix(NaN).utc(true).isBetween(moment.unix(NaN).utc(true), moment.unix(b).utc(true)));
        expect(Dates.isBetween(NaN, a, NaN)).to.equal(moment.unix(NaN).utc(true).isBetween(moment.unix(a).utc(true), moment.unix(NaN).utc(true)));
        expect(Dates.isBetween(basicDate, NaN, NaN)).to.equal(moment.unix(basicDate).utc(true).isBetween(moment.unix(NaN).utc(true), moment.unix(NaN).utc(true)));
        expect(Dates.isBetween(NaN, NaN, NaN)).to.equal(moment.unix(NaN).utc(true).isBetween(moment.unix(NaN).utc(true), moment.unix(NaN).utc(true)));
    });

    it('hour', () => {
        let b = moment().utc(false).hour();
        let a = Dates.hour();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).hour(16).unix();
        a = Dates.hour(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.hour(basicDate)).to.equal(moment.unix(basicDate).utc(false).hour());
        expect(Dates.hour(basicDate, 18)).to.equal(moment.unix(basicDate).utc(true).hour(18).unix());
        expect(Dates.hour(basicDate, 35)).to.equal(moment.unix(basicDate).utc(true).hour(35).unix());
        expect(Dates.hour(basicDate, -10)).to.equal(moment.unix(basicDate).utc(true).hour(-10).unix());

        // forbidden values
        expect(Dates.hour(undefined)).to.equal(moment.unix(undefined).utc(false).hour());
        expect(Dates.hour(undefined, 18)).to.equal(moment.unix(undefined).utc(true).hour(18).unix());
        expect(Dates.hour(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).hour(undefined));

        expect(Dates.hour(NaN)).to.equal(moment.unix(NaN).utc(false).hour());
        expect(Dates.hour(NaN, 18)).to.equal(moment.unix(NaN).utc(true).hour(18).unix());
        expect(Dates.hour(basicDate, NaN)).to.equal(moment.unix(basicDate).utc(true).hour(NaN).unix());
    });

    it('hours', () => {
        let b = moment().utc(false).hours();
        let a = Dates.hours();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).hours(16).unix();
        a = Dates.hours(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.hours(basicDate)).to.equal(moment.unix(basicDate).utc(false).hours());
        expect(Dates.hours(basicDate, 18)).to.equal(moment.unix(basicDate).utc(true).hours(18).unix());
        expect(Dates.hours(basicDate, -10)).to.equal(moment.unix(basicDate).utc(true).hours(-10).unix());
        expect(Dates.hours(basicDate, 35)).to.equal(moment.unix(basicDate).utc(true).hours(35).unix());

        // forbidden values
        expect(Dates.hours(undefined)).to.equal(moment.unix(undefined).utc(false).hours());
        expect(Dates.hours(undefined, 18)).to.equal(moment.unix(undefined).utc(true).hours(18).unix());
        expect(Dates.hours(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).hours(undefined));

        expect(Dates.hours(NaN)).to.equal(moment.unix(NaN).utc(false).hours());
        expect(Dates.hours(NaN, 18)).to.equal(moment.unix(NaN).utc(true).hours(18).unix());
        expect(Dates.hours(basicDate, NaN)).to.equal(moment.unix(basicDate).utc(true).hours(NaN).unix());
    });

    it('minute', () => {
        let b = moment().utc(false).minute();
        let a = Dates.minute();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).minute(16).unix();
        a = Dates.minute(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.minute(basicDate)).to.equal(moment.unix(basicDate).utc(false).minute());
        expect(Dates.minute(basicDate, 33)).to.equal(moment.unix(basicDate).utc(false).minute(33).unix());
        expect(Dates.minute(basicDate, 70)).to.equal(moment.unix(basicDate).utc(false).minute(70).unix());
        expect(Dates.minute(basicDate, -10)).to.equal(moment.unix(basicDate).utc(false).minute(-10).unix());

        expect(Dates.minute(Dates.minute(edgeDate, 30), -30)).to.equal(moment.unix(edgeDate).utc(false).minute(30).minute(-30).unix());

        // forbidden values
        expect(Dates.minute(undefined)).to.equal(moment.unix(undefined).utc(false).minute());
        expect(Dates.minute(undefined, 18)).to.equal(moment.unix(undefined).utc(true).minute(18).unix());
        expect(Dates.minute(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).minute(undefined));
    });
});
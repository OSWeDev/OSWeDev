import { expect } from 'chai';
import 'mocha';

import moment from 'moment';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

describe('Dates', () => {

    const basicDate = 1627903493; // 2-08-2021 11:24:53 GMT
    const edgeDate = 1583020799; // 29-02-2020 23:59:59 GMT
    const reverseEdgeDate = 1583020800;  // 01-03-2020 00:00:00 GMT

    it('now', () => {
        let b = moment().utc(false).unix();
        let a = Dates.now();
        expect(a - b).to.be.lessThan(2);
    });

    describe('add', () => {

        it('adds days', () => {
            let b = moment.unix(basicDate).utc().add(1, 'day').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);

            b = moment.unix(edgeDate).utc().add(1, 'day').unix();
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_DAY)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'day').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'day').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);

            // Volontairement différent de MomentJS => pourquoi on a le droit d'ajouter une demi heure mais pas une demi journée ... ?
            // b = moment.unix(basicDate).utc().add(0.333, 'day').unix();
            // a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_DAY);
            // expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(1.333, 'day').unix();
            // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_DAY);
            // expect(a).to.equal(b);

            b = moment.unix(1616864400).utc(false).add(2, 'day').unix();  // 27-03-2021 18:00:00 GMT
            a = Dates.add(1616864400, 2, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(67, 'day').unix();
            a = Dates.add(basicDate, 67, TimeSegment.TYPE_DAY);
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

        it('adds hours', () => {
            let b = moment.unix(basicDate).utc().add(1, 'hour').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(edgeDate).utc().add(1, 'hour').unix();
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_HOUR)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'hour').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'hour').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(0.333, 'hour').unix();
            a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(-0.125, 'hour').unix();
            a = Dates.add(basicDate, -0.125, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(1.333, 'hour').unix();
            a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(-1.125, 'hour').unix();
            a = Dates.add(basicDate, -1.125, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(1616864400).utc(false).add(15, 'hour').unix();  // 27-03-2021 18:00:00 GMT
            a = Dates.add(1616864400, 15, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(67, 'hour').unix();
            a = Dates.add(basicDate, 67, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);
        });


        it('adds minutes', () => {
            let b = moment.unix(basicDate).utc().add(1, 'minute').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);

            b = moment.unix(edgeDate).utc().add(1, 'minute').unix();
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_MINUTE)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'minute').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'minute').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(0.333, 'minute').unix();
            a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(1.333, 'minute').unix();
            a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(67, 'minute').unix();
            a = Dates.add(basicDate, 67, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);
        });

        it('adds seconds', () => {
            let b = moment.unix(basicDate).utc().add(1, 'second').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);

            b = moment.unix(edgeDate).utc().add(1, 'second').unix();
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_SECOND)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'second').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'second').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(0.333, 'second').unix();
            a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(1.333, 'second').unix();
            a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(3700, 'second').unix();
            a = Dates.add(basicDate, 3700, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);
        });

        it('adds weeks', () => {
            let b = moment.unix(basicDate).utc().add(1, 'week').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            b = moment.unix(1582372800).utc().add(1, 'week').unix();  // 22-02-2020 12:00:00 GMT
            a = Dates.add(1582372800, 1, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            b = moment.unix(edgeDate).utc().add(1, 'week').unix();
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_WEEK)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'week').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            b = moment.unix(1583582400).utc().add(-1, 'week').unix();  // 07-03-2020 12:00:00 GMT
            a = Dates.add(1583582400, -1, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'week').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            // Volontairement différent de MomentJS => pourquoi on a le droit d'ajouter une demi heure mais pas une demi-semaine ... ?
            // b = moment.unix(basicDate).utc().add(0.333, 'week').unix();
            // a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_WEEK);
            // expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(-0.5, 'week').unix();
            // a = Dates.add(basicDate, -0.5, TimeSegment.TYPE_WEEK);
            // expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(1.333, 'week').unix();
            // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_WEEK);
            // expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(-1.5, 'week').unix();
            // a = Dates.add(basicDate, -1.5, TimeSegment.TYPE_WEEK);
            // expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(15, 'week').unix();
            a = Dates.add(basicDate, 15, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(67, 'week').unix();
            a = Dates.add(basicDate, 67, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);
        });

        it('adds months', () => {
            /*  b = moment().utc().add(1, 'month').unix();
             a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_MONTH);
             expect(a - b).to.be.lessThan(2); */
            let b = moment.unix(basicDate).utc().add(1, 'month').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            // Volontairement différent de MomentJs sur ce test, on se base sur les choix de Date pour le coup
            // b = moment.unix(1580472000).utc().add(1, 'month').unix();  // 31-01-2020 12:00:00 GMT
            // a = Dates.add(1580472000, 1, TimeSegment.TYPE_MONTH);
            // expect(a).to.equal(b);
            b = moment.unix(edgeDate).utc().add(1, 'month').unix();
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_MONTH)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'month').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'month').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            b = moment.unix(basicDate).utc().add(0.333, 'month').unix();
            a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            // b = moment.unix(edgeDate).add(0.333, 'month').unix();
            // a = Dates.add(edgeDate, 0.333, TimeSegment.TYPE_MONTH);
            // expect(a).to.equal(b);

            // b = moment.unix(reverseEdgeDate).add(-0.25, 'month').unix();
            // a = Dates.add(reverseEdgeDate, -0.25, TimeSegment.TYPE_MONTH);
            // expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(1.333, 'month').unix();
            // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_MONTH);
            // expect(a).to.equal(b);

            // b = moment.unix(edgeDate).add(1.333, 'month').unix();
            // a = Dates.add(edgeDate, 1.333, TimeSegment.TYPE_MONTH);
            // expect(a).to.equal(b);

            // b = moment.unix(reverseEdgeDate).add(-1.25, 'month').unix();
            // a = Dates.add(reverseEdgeDate, -1.25, TimeSegment.TYPE_MONTH);
            // expect(a).to.equal(b);

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

            b = moment.unix(basicDate).utc().add(13, 'month').unix();
            a = Dates.add(basicDate, 13, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            b = moment.unix(1635724799).utc().add(-1, 'month').unix(); // 2021-10-31 23:59:59
            a = Dates.add(1635724799, -1, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);
        });

        it('adds years', () => {
            /* b = moment().utc().add(1, 'year').unix();
            a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR);
            expect(a - b).to.be.lessThan(2); */
            let b = moment.unix(basicDate).utc().add(1, 'year').unix();
            let a = Dates.add(basicDate, 1, TimeSegment.TYPE_YEAR);
            expect(a).to.equal(b);

            /**
             * Cas particuliers, incohérents entre Date et momentjs, on utilise la version de Date
             */
            // b = moment.unix(edgeDate).utc().add(1, 'year').unix();
            let date_ = new Date(edgeDate * 1000);
            b = date_.setUTCFullYear(date_.getUTCFullYear() + 1) / 1000;
            a = Dates.add(edgeDate, 1, TimeSegment.TYPE_YEAR);
            expect(a).to.equal(b);

            expect(Dates.add(basicDate, 0, TimeSegment.TYPE_YEAR)).to.equal(basicDate);

            b = moment.unix(basicDate).utc().add(-1, 'year').unix();
            a = Dates.add(basicDate, -1, TimeSegment.TYPE_YEAR);
            expect(a).to.equal(b);

            b = moment.unix(reverseEdgeDate).utc().add(-1, 'year').unix();
            a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_YEAR);
            expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(0.333, 'year').unix();
            // a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_YEAR);
            // expect(a).to.equal(b);

            // b = moment.unix(basicDate).utc().add(1.333, 'year').unix();
            // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_YEAR);
            // expect(a).to.equal(b);
        });
    });

    describe('startOf', () => {

        it('startOf-Day', () => {
            let b = moment.unix(basicDate).utc().startOf('day').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);
        });

        it('startOf-Hour', () => {
            let b = moment.unix(basicDate).utc().startOf('hour').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);
        });

        it('startOf-Minute', () => {
            let b = moment.unix(basicDate).utc().startOf('minute').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);
        });

        it('startOf-Second', () => {
            let b = moment.unix(basicDate).utc().startOf('second').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);
        });

        it('startOf-Month', () => {
            let b = moment.unix(basicDate).utc().startOf('month').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);
        });

        it('startOf-Year', () => {
            let b = moment.unix(basicDate).utc().startOf('year').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
            expect(a).to.equal(b);
        });

        it('startOf-Week', () => {
            let b = moment.unix(basicDate).utc().startOf('isoWeek').unix();
            let a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);
        });
    });

    describe('endOf', () => {

        it('endOf-Day', () => {
            let b = moment.unix(basicDate).utc().endOf('day').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);
            expect(a).to.equal(b);
        });

        it('endOf-Hour', () => {
            let b = moment.unix(basicDate).utc().endOf('hour').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_HOUR);
            expect(a).to.equal(b);
        });

        it('endOf-Minute', () => {
            let b = moment.unix(basicDate).utc().endOf('minute').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_MINUTE);
            expect(a).to.equal(b);
        });

        it('endOf-Second', () => {
            let b = moment.unix(basicDate).utc().endOf('second').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_SECOND);
            expect(a).to.equal(b);
        });

        it('endOf-Month', () => {
            let b = moment.unix(basicDate).utc().endOf('month').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            let testDate: number = 1581768000; // edgy : 15 fev 2020 (bissextile)
            b = moment.unix(testDate).utc().endOf('month').unix();
            a = Dates.endOf(testDate, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);

            testDate = 1638316799; // 30 nov 2021 23:59:59
            b = moment.unix(testDate).utc().endOf('month').unix();
            a = Dates.endOf(testDate, TimeSegment.TYPE_MONTH);
            expect(a).to.equal(b);
            expect(a).to.equal(testDate);
        });

        it('endOf-Year', () => {
            let b = moment.unix(basicDate).utc().endOf('year').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_YEAR);
            expect(a).to.equal(b);
        });

        it('endOf-Week', () => {
            let b = moment.unix(basicDate).utc().endOf('isoWeek').unix();
            let a = Dates.endOf(basicDate, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);

            b = moment.unix(edgeDate).utc().endOf('isoWeek').unix();
            a = Dates.endOf(edgeDate, TimeSegment.TYPE_WEEK);
            expect(a).to.equal(b);
        });
    });

    it('format', () => {
        let b = moment.unix(basicDate).utc().startOf('day');
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('hour');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('minute');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('second');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('month');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('year');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        b = moment.unix(basicDate).utc().startOf('isoWeek');
        a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
        expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).to.equal(b.format("DD/MM/YYYY HH:mm:ss"));

        // forbidden values
        expect(Dates.format(null, "DD/MM/YYYY HH:mm:ss", false)).to.equal(null);
        expect(Dates.format(undefined, "DD/MM/YYYY HH:mm:ss", false)).to.equal(null);
        expect(Dates.format(NaN, "DD/MM/YYYY HH:mm:ss", false)).to.equal(null);

        expect(Dates.format(basicDate, "foo-bar", false)).to.equal(moment.unix(basicDate).utc().format("foo-bar"));
    });

    it('diff', () => {
        let a1 = edgeDate;
        let a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);

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

    describe('isSame', () => {
        let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

        it('isSame-Day', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'day'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'day'));
        });

        it('isSame-Hour', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'hour'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_HOUR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'hour'));
        });

        it('isSame-Minute', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'minute'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MINUTE)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'minute'));
        });

        it('isSame-Second', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'second'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_SECOND)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'second'));
        });

        it('isSame-Month', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'month'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'month'));

            let date1 = 1638316799;
            let date2 = 1638748799;
            expect(Dates.isSame(date1, date2, TimeSegment.TYPE_MONTH)).to.equal(moment.unix(date1).utc().isSame(moment.unix(date2).utc(), 'month'));
        });

        it('isSame-Year', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'year'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_YEAR)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'year'));
        });

        it('isSame-Week', () => {
            expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'week'));
            expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_WEEK)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'week'));
        });

        it('forbidden values', () => {
            // forbidden values
            expect(Dates.isSame(basicDate, null, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(null).utc(), 'day'));
            expect(Dates.isSame(basicDate, undefined, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(undefined).utc(), 'day'));
            expect(Dates.isSame(basicDate, NaN, TimeSegment.TYPE_DAY)).to.equal(moment.unix(basicDate).utc().isSame(moment.unix(NaN).utc(), 'day'));
        });
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

        expect(Dates.hour(edgeDate, 25)).to.equal(moment.unix(edgeDate).utc().hour(25).unix());

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

        expect(Dates.minute(1583013600, 122)).to.equal(moment.unix(1583013600).utc(false).minute(122).unix());  // 29-02-2020 22:00:00 GMT

        // forbidden values
        // expect(Dates.minute(undefined)).to.equal(moment.unix(undefined).utc(false).minute());
        // expect(Dates.minute(undefined, 18)).to.equal(moment.unix(undefined).utc(true).minute(18).unix());
        expect(Dates.minute(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).minute(undefined));
    });

    it('minutes', () => {
        let b = moment().utc(false).minutes();
        let a = Dates.minutes();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).minutes(16).unix();
        a = Dates.minute(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.minutes(basicDate)).to.equal(moment.unix(basicDate).utc(false).minutes());
        expect(Dates.minutes(basicDate, 33)).to.equal(moment.unix(basicDate).utc(false).minutes(33).unix());
        expect(Dates.minutes(basicDate, 70)).to.equal(moment.unix(basicDate).utc(false).minutes(70).unix());
        expect(Dates.minutes(basicDate, -10)).to.equal(moment.unix(basicDate).utc(false).minutes(-10).unix());

        // forbidden values
        // expect(Dates.minutes(undefined)).to.equal(moment.unix(undefined).utc(false).minutes());
        // expect(Dates.minutes(undefined, 18)).to.equal(moment.unix(undefined).utc(true).minutes(18).unix());
        expect(Dates.minutes(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).minutes(undefined));
    });

    it('second', () => {
        let b = moment().utc(false).second();
        let a = Dates.second();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).second(16).unix();
        a = Dates.second(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.second(basicDate)).to.equal(moment.unix(basicDate).utc(false).second());
        expect(Dates.second(basicDate, 33)).to.equal(moment.unix(basicDate).utc(false).second(33).unix());
        expect(Dates.second(basicDate, 70)).to.equal(moment.unix(basicDate).utc(false).second(70).unix());
        expect(Dates.second(basicDate, -10)).to.equal(moment.unix(basicDate).utc(false).second(-10).unix());

        // forbidden values
        // expect(Dates.second(undefined)).to.equal(moment.unix(undefined).utc(false).second());
        // expect(Dates.second(undefined, 18)).to.equal(moment.unix(undefined).utc(true).second(18).unix());
        expect(Dates.second(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).second(undefined));
    });

    it('seconds', () => {
        let b = moment().utc(false).seconds();
        let a = Dates.seconds();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(false).seconds(16).unix();
        a = Dates.seconds(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.seconds(basicDate)).to.equal(moment.unix(basicDate).utc(false).seconds());
        expect(Dates.seconds(basicDate, 33)).to.equal(moment.unix(basicDate).utc(false).seconds(33).unix());
        expect(Dates.seconds(basicDate, 70)).to.equal(moment.unix(basicDate).utc(false).seconds(70).unix());
        expect(Dates.seconds(basicDate, -10)).to.equal(moment.unix(basicDate).utc(false).seconds(-10).unix());

        // forbidden values
        // expect(Dates.seconds(undefined)).to.equal(moment.unix(undefined).utc(false).seconds());
        // expect(Dates.seconds(undefined, 18)).to.equal(moment.unix(undefined).utc(true).seconds(18).unix());
        expect(Dates.seconds(basicDate, undefined)).to.equal(moment.unix(basicDate).utc(false).seconds(undefined));
    });

    it('toISOString', () => {
        expect(Dates.toISOString(basicDate)).to.equal(moment.unix(basicDate).toISOString());
        expect(Dates.toISOString(edgeDate)).to.equal(moment.unix(edgeDate).toISOString());
        expect(Dates.toISOString(Dates.now())).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('date', () => {
        let b = moment().utc().date();
        let a = Dates.date();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc().date(16).unix();
        a = Dates.date(null, 16);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.date(basicDate)).to.equal(moment.unix(basicDate).utc().date());
        expect(Dates.date(basicDate, 16)).to.equal(moment.unix(basicDate).utc().date(16).unix());
        expect(Dates.date(basicDate, 35)).to.equal(moment.unix(basicDate).utc().date(35).unix());
        expect(Dates.date(basicDate, -10)).to.equal(moment.unix(basicDate).utc().date(-10).unix());

        expect(Dates.date(edgeDate, 30)).to.equal(moment.unix(edgeDate).utc().date(30).unix());

        // forbidden values
        // expect(Dates.date(undefined)).to.equal(moment.unix(undefined).utc().date());
        // expect(Dates.date(undefined, 18)).to.equal(moment.unix(undefined).utc().date(18).unix());
        expect(Dates.date(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().date(undefined));
    });

    it('day', () => {
        let b = moment().utc().day();
        let a = Dates.day();
        expect(a - b).to.equal(0);
        b = moment().utc().day(5).unix();
        a = Dates.day(null, 5);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.day(basicDate)).to.equal(moment.unix(basicDate).utc().day());
        expect(Dates.day(basicDate, 5)).to.equal(moment.unix(basicDate).utc().day(5).unix());
        expect(Dates.day(basicDate, 10)).to.equal(moment.unix(basicDate).utc().day(10).unix());
        expect(Dates.day(basicDate, -3)).to.equal(moment.unix(basicDate).utc().day(-3).unix());

        expect(Dates.day(edgeDate, 7)).to.equal(moment.unix(edgeDate).utc().day(7).unix());

        expect(Dates.day(1628337600, 0)).to.equal(moment.unix(1628337600).utc().day(0).unix());  // Sat Aug 07 2021 12:00:00 GMT+0000
        expect(Dates.day(1628337600, 1)).to.equal(moment.unix(1628337600).utc().day(1).unix());
        expect(Dates.day(1628337600, 7)).to.equal(moment.unix(1628337600).utc().day(7).unix());
        expect(Dates.day(1628337600, 8)).to.equal(moment.unix(1628337600).utc().day(8).unix());

        expect(Dates.day(1628424000, 0)).to.equal(moment.unix(1628424000).utc().day(0).unix());  // Sun Aug 08 2021 12:00:00 GMT+0000
        expect(Dates.day(1628424000, 1)).to.equal(moment.unix(1628424000).utc().day(1).unix());
        expect(Dates.day(1628424000, 7)).to.equal(moment.unix(1628424000).utc().day(7).unix());
        expect(Dates.day(1628424000, 8)).to.equal(moment.unix(1628424000).utc().day(8).unix());

        expect(Dates.day(1628510400, 0)).to.equal(moment.unix(1628510400).utc().day(0).unix());  // Mon Aug 09 2021 12:00:00 GMT+0000
        expect(Dates.day(1628510400, 1)).to.equal(moment.unix(1628510400).utc().day(1).unix());
        expect(Dates.day(1628510400, 7)).to.equal(moment.unix(1628510400).utc().day(7).unix());
        expect(Dates.day(1628510400, 8)).to.equal(moment.unix(1628510400).utc().day(8).unix());

        // forbidden values
        // expect(Dates.day(undefined)).to.equal(moment.unix(undefined).utc().day());
        // expect(Dates.day(undefined, 18)).to.equal(moment.unix(undefined).utc().day(18).unix());
        expect(Dates.day(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().day(undefined));
    });

    it('isoWeekday', () => {
        let b = moment().utc().isoWeekday();
        let a = Dates.isoWeekday();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc(true).isoWeekday(5).unix();
        a = Dates.isoWeekday(null, 5);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.isoWeekday(basicDate)).to.equal(moment.unix(basicDate).utc().isoWeekday());
        expect(Dates.isoWeekday(basicDate, 5)).to.equal(moment.unix(basicDate).utc().isoWeekday(5).unix());
        expect(Dates.isoWeekday(basicDate, 10)).to.equal(moment.unix(basicDate).utc().isoWeekday(10).unix());
        expect(Dates.isoWeekday(basicDate, -3)).to.equal(moment.unix(basicDate).utc().isoWeekday(-3).unix());

        expect(Dates.isoWeekday(1628510400, 1)).to.equal(moment.unix(1628510400).utc().isoWeekday(1).unix());
        expect(Dates.isoWeekday(1628510400, 2)).to.equal(moment.unix(1628510400).utc().isoWeekday(2).unix());
        expect(Dates.isoWeekday(1628596800, 2)).to.equal(moment.unix(1628596800).utc().isoWeekday(2).unix());
        expect(Dates.isoWeekday(1628596800, 1)).to.equal(moment.unix(1628596800).utc().isoWeekday(1).unix());
        expect(Dates.isoWeekday(1628337600, 0)).to.equal(1627819200); // Volontairement différent de moment.unix(1628337600).utc().isoWeekday(0).unix());  // Sat Aug 07 2021 12:00:00 GMT+0000
        expect(Dates.isoWeekday(1628337600, 1)).to.equal(1627905600); // moment.unix(1628337600).utc().isoWeekday(1).unix());
        expect(Dates.isoWeekday(1628337600, 7)).to.equal(1628424000); // moment.unix(1628337600).utc().isoWeekday(7).unix());
        expect(Dates.isoWeekday(1628337600, 8)).to.equal(1628510400); // moment.unix(1628337600).utc().isoWeekday(8).unix());

        expect(Dates.isoWeekday(1628424000, 0)).to.equal(moment.unix(1628424000).utc().isoWeekday(0).unix());  // Sun Aug 08 2021 12:00:00 GMT+0000
        expect(Dates.isoWeekday(1628424000, 1)).to.equal(moment.unix(1628424000).utc().isoWeekday(1).unix());
        expect(Dates.isoWeekday(1628424000, 7)).to.equal(moment.unix(1628424000).utc().isoWeekday(7).unix());
        expect(Dates.isoWeekday(1628424000, 8)).to.equal(moment.unix(1628424000).utc().isoWeekday(8).unix());

        expect(Dates.isoWeekday(1628510400, 0)).to.equal(moment.unix(1628510400).utc().isoWeekday(0).unix());  // Mon Aug 09 2021 12:00:00 GMT+0000
        expect(Dates.isoWeekday(1628510400, 1)).to.equal(moment.unix(1628510400).utc().isoWeekday(1).unix());
        expect(Dates.isoWeekday(1628510400, 7)).to.equal(moment.unix(1628510400).utc().isoWeekday(7).unix());
        expect(Dates.isoWeekday(1628510400, 8)).to.equal(moment.unix(1628510400).utc().isoWeekday(8).unix());

        // forbidden values
        // expect(Dates.isoWeekday(undefined)).to.equal(moment.unix(undefined).utc().isoWeekday());
        // expect(Dates.isoWeekday(undefined, 18)).to.equal(moment.unix(undefined).utc().isoWeekday(18).unix());
        expect(Dates.isoWeekday(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().isoWeekday(undefined));
    });

    it('month', () => {
        let b = moment().utc().month();
        let a = Dates.month();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc().month(5).unix();
        a = Dates.month(null, 5);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.month(basicDate)).to.equal(moment.unix(basicDate).utc().month());
        expect(Dates.month(basicDate, 5)).to.equal(moment.unix(basicDate).utc().month(5).unix());
        expect(Dates.month(basicDate, 13)).to.equal(moment.unix(basicDate).utc().month(13).unix());
        expect(Dates.month(basicDate, -3)).to.equal(moment.unix(basicDate).utc().month(-3).unix());

        expect(Dates.month(1612094400, 1)).to.equal(moment.unix(1612094400).utc().month(1).unix());  // 31-01-2021 12:00:00 GMT

        // forbidden values
        // expect(Dates.month(undefined)).to.equal(moment.unix(undefined).utc().month());
        // expect(Dates.month(undefined, 18)).to.equal(moment.unix(undefined).utc().month(18).unix());
        expect(Dates.month(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().month(undefined));
    });

    it('year', () => {
        let b = moment().utc().year();
        let a = Dates.year();
        expect(a - b).to.be.lessThan(2);
        b = moment().utc().year(5).unix();
        a = Dates.year(null, 5);
        expect(a - b).to.be.lessThan(2);
        expect(Dates.year(basicDate)).to.equal(moment.unix(basicDate).utc().year());
        expect(Dates.year(basicDate, 5)).to.equal(moment.unix(basicDate).utc().year(5).unix());
        expect(Dates.year(basicDate, -3)).to.equal(moment.unix(basicDate).utc().year(-3).unix());

        expect(Dates.year(basicDate, 271000)).to.equal(moment.unix(basicDate).utc().year(271000).unix());
        expect(Dates.year(basicDate, -271000)).to.equal(moment.unix(basicDate).utc().year(-271000).unix());

        // forbidden values
        // expect(Dates.year(undefined)).to.equal(moment.unix(undefined).utc().year());
        // expect(Dates.year(undefined, 18)).to.equal(moment.unix(undefined).utc().year(18).unix());
        expect(Dates.year(basicDate, undefined)).to.equal(moment.unix(basicDate).utc().year(undefined));
    });
});
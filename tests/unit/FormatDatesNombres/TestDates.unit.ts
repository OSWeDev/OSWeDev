import { test, expect } from "playwright-test-coverage";

import moment from 'moment';
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../src/shared/modules/FormatDatesNombres/Dates/Dates';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

const basicDate = 1627903493; // 2-08-2021 11:24:53 GMT
const edgeDate = 1583020799; // 29-02-2020 23:59:59 GMT
const reverseEdgeDate = 1583020800;  // 01-03-2020 00:00:00 GMT

test('Dates: now', () => {
    const b = moment().utc(false).unix();
    const a = Dates.now();
    expect(a - b).toBeLessThan(2);
});

test('Dates: adds days', () => {
    let b = moment.unix(basicDate).utc().add(1, 'day').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'day').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_DAY)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'day').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'day').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    // Volontairement différent de MomentJS => pourquoi on a le droit d'ajouter une demi heure mais pas une demi journée ... ?
    // b = moment.unix(basicDate).utc().add(0.333, 'day').unix();
    // a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_DAY);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(1.333, 'day').unix();
    // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_DAY);
    // expect(a).toStrictEqual(b);

    b = moment.unix(1616864400).utc(false).add(2, 'day').unix();  // 27-03-2021 18:00:00 GMT
    a = Dates.add(1616864400, 2, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(67, 'day').unix();
    a = Dates.add(basicDate, 67, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    // add forbidden values
    b = moment.unix(basicDate).utc().add(undefined, 'day').unix();
    a = Dates.add(basicDate, undefined, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(null, 'day').unix();
    a = Dates.add(basicDate, null, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(NaN, 'day').unix();
    a = Dates.add(basicDate, NaN, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);
});

test('Dates: adds hours', () => {
    let b = moment.unix(basicDate).utc().add(1, 'hour').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'hour').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_HOUR)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'hour').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'hour').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(0.333, 'hour').unix();
    a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-0.125, 'hour').unix();
    a = Dates.add(basicDate, -0.125, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(1.333, 'hour').unix();
    a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-1.125, 'hour').unix();
    a = Dates.add(basicDate, -1.125, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(1616864400).utc(false).add(15, 'hour').unix();  // 27-03-2021 18:00:00 GMT
    a = Dates.add(1616864400, 15, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(67, 'hour').unix();
    a = Dates.add(basicDate, 67, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);
});


test('Dates: adds minutes', () => {
    let b = moment.unix(basicDate).utc().add(1, 'minute').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'minute').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_MINUTE)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'minute').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'minute').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(0.333, 'minute').unix();
    a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(1.333, 'minute').unix();
    a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(67, 'minute').unix();
    a = Dates.add(basicDate, 67, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);
});

test('Dates: adds seconds', () => {
    let b = moment.unix(basicDate).utc().add(1, 'second').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'second').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_SECOND)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'second').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'second').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(0.333, 'second').unix();
    a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(1.333, 'second').unix();
    a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(3700, 'second').unix();
    a = Dates.add(basicDate, 3700, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);
});

test('Dates: adds weeks', () => {
    let b = moment.unix(basicDate).utc().add(1, 'week').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    b = moment.unix(1582372800).utc().add(1, 'week').unix();  // 22-02-2020 12:00:00 GMT
    a = Dates.add(1582372800, 1, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'week').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_WEEK)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'week').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    b = moment.unix(1583582400).utc().add(-1, 'week').unix();  // 07-03-2020 12:00:00 GMT
    a = Dates.add(1583582400, -1, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'week').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    // Volontairement différent de MomentJS => pourquoi on a le droit d'ajouter une demi heure mais pas une demi-semaine ... ?
    // b = moment.unix(basicDate).utc().add(0.333, 'week').unix();
    // a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_WEEK);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(-0.5, 'week').unix();
    // a = Dates.add(basicDate, -0.5, TimeSegment.TYPE_WEEK);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(1.333, 'week').unix();
    // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_WEEK);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(-1.5, 'week').unix();
    // a = Dates.add(basicDate, -1.5, TimeSegment.TYPE_WEEK);
    // expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(15, 'week').unix();
    a = Dates.add(basicDate, 15, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(67, 'week').unix();
    a = Dates.add(basicDate, 67, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);
});

test('Dates: adds months', () => {
    /*  b = moment().utc().add(1, 'month').unix();
     a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_MONTH);
     expect(a - b).toBeLessThan(2); */
    let b = moment.unix(basicDate).utc().add(1, 'month').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    // Volontairement différent de MomentJs sur ce test, on se base sur les choix de Date pour le coup
    // b = moment.unix(1580472000).utc().add(1, 'month').unix();  // 31-01-2020 12:00:00 GMT
    // a = Dates.add(1580472000, 1, TimeSegment.TYPE_MONTH);
    // expect(a).toStrictEqual(b);
    b = moment.unix(edgeDate).utc().add(1, 'month').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_MONTH)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'month').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'month').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(0.333, 'month').unix();
    a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    // b = moment.unix(edgeDate).add(0.333, 'month').unix();
    // a = Dates.add(edgeDate, 0.333, TimeSegment.TYPE_MONTH);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(reverseEdgeDate).add(-0.25, 'month').unix();
    // a = Dates.add(reverseEdgeDate, -0.25, TimeSegment.TYPE_MONTH);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(1.333, 'month').unix();
    // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_MONTH);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(edgeDate).add(1.333, 'month').unix();
    // a = Dates.add(edgeDate, 1.333, TimeSegment.TYPE_MONTH);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(reverseEdgeDate).add(-1.25, 'month').unix();
    // a = Dates.add(reverseEdgeDate, -1.25, TimeSegment.TYPE_MONTH);
    // expect(a).toStrictEqual(b);

    b = moment.unix(1519862400).utc(false).add(2, 'month').unix();  // 01-03-2018 00:00:00 GMT
    a = Dates.add(1519862400, 2, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(1603198800).utc(false).add(2, 'month').unix();  // 20-10-2020 13:00:00 GMT
    a = Dates.add(1603198800, 2, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(1604406897).utc(false).add(-1, 'month').unix();  // 03-11-2020 12:34:57 GMT
    a = Dates.add(1604406897, -1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(1604406897).utc(false).add(-6, 'month').unix();  // 03-11-2020 12:34:57 GMT
    b = moment.unix(b).utc(false).add(-6, 'month').unix();
    a = Dates.add(1604406897, -6, TimeSegment.TYPE_MONTH);
    a = Dates.add(a, -6, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc(false).add(1, 'month').unix();
    b = moment.unix(b).utc(false).add(-1, 'month').unix();
    a = Dates.add(basicDate, 1, TimeSegment.TYPE_MONTH);
    a = Dates.add(a, -1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc(false).add(2, 'month').unix();
    b = moment.unix(b).utc(false).add(-3, 'month').unix();
    a = Dates.add(basicDate, 2, TimeSegment.TYPE_MONTH);
    a = Dates.add(a, -3, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc(false).add(1, 'month').unix();
    b = moment.unix(b).utc(false).add(-1, 'month').unix();
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_MONTH);
    a = Dates.add(a, -1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc(false).add(2, 'month').unix();
    b = moment.unix(b).utc(false).add(-3, 'month').unix();
    a = Dates.add(edgeDate, 2, TimeSegment.TYPE_MONTH);
    a = Dates.add(a, -3, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(13, 'month').unix();
    a = Dates.add(basicDate, 13, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    b = moment.unix(1635724799).utc().add(-1, 'month').unix(); // 2021-10-31 23:59:59
    a = Dates.add(1635724799, -1, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);
});

test('Dates: adds years', () => {
    /* b = moment().utc().add(1, 'year').unix();
    a = Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR);
    expect(a - b).toBeLessThan(2); */
    let b = moment.unix(basicDate).utc().add(1, 'year').unix();
    let a = Dates.add(basicDate, 1, TimeSegment.TYPE_YEAR);
    expect(a).toStrictEqual(b);

    /**
     * Cas particuliers, incohérents entre Date et momentjs, on utilise la version de Date
     */
    // b = moment.unix(edgeDate).utc().add(1, 'year').unix();
    const date_ = new Date(edgeDate * 1000);
    b = date_.setUTCFullYear(date_.getUTCFullYear() + 1) / 1000;
    a = Dates.add(edgeDate, 1, TimeSegment.TYPE_YEAR);
    expect(a).toStrictEqual(b);

    expect(Dates.add(basicDate, 0, TimeSegment.TYPE_YEAR)).toStrictEqual(basicDate);

    b = moment.unix(basicDate).utc().add(-1, 'year').unix();
    a = Dates.add(basicDate, -1, TimeSegment.TYPE_YEAR);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'year').unix();
    a = Dates.add(reverseEdgeDate, -1, TimeSegment.TYPE_YEAR);
    expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(0.333, 'year').unix();
    // a = Dates.add(basicDate, 0.333, TimeSegment.TYPE_YEAR);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(basicDate).utc().add(1.333, 'year').unix();
    // a = Dates.add(basicDate, 1.333, TimeSegment.TYPE_YEAR);
    // expect(a).toStrictEqual(b);
});

test('Dates: startOf-Day', () => {
    const b = moment.unix(basicDate).utc().startOf('day').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);
});

test('Dates: startOf-Hour', () => {
    const b = moment.unix(basicDate).utc().startOf('hour').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);
});

test('Dates: startOf-Minute', () => {
    const b = moment.unix(basicDate).utc().startOf('minute').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);
});

test('Dates: startOf-Second', () => {
    const b = moment.unix(basicDate).utc().startOf('second').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);
});

test('Dates: startOf-Month', () => {
    const b = moment.unix(basicDate).utc().startOf('month').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);
});

test('Dates: startOf-Year', () => {
    const b = moment.unix(basicDate).utc().startOf('year').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
    expect(a).toStrictEqual(b);
});

test('Dates: startOf-Week', () => {
    const b = moment.unix(basicDate).utc().startOf('isoWeek').unix();
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);
});

test('Dates: endOf-Day', () => {
    const b = moment.unix(basicDate).utc().endOf('day').unix();
    const a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);
    expect(a).toStrictEqual(b);
});

test('Dates: endOf-Hour', () => {
    const b = moment.unix(basicDate).utc().endOf('hour').unix();
    const a = Dates.endOf(basicDate, TimeSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);
});

test('Dates: endOf-Minute', () => {
    const b = moment.unix(basicDate).utc().endOf('minute').unix();
    const a = Dates.endOf(basicDate, TimeSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);
});

test('Dates: endOf-Second', () => {
    const b = moment.unix(basicDate).utc().endOf('second').unix();
    const a = Dates.endOf(basicDate, TimeSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);
});

test('Dates: endOf-Month', () => {
    let b = moment.unix(basicDate).utc().endOf('month').unix();
    let a = Dates.endOf(basicDate, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    let testDate: number = 1581768000; // edgy : 15 fev 2020 (bissextile)
    b = moment.unix(testDate).utc().endOf('month').unix();
    a = Dates.endOf(testDate, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);

    testDate = 1638316799; // 30 nov 2021 23:59:59
    b = moment.unix(testDate).utc().endOf('month').unix();
    a = Dates.endOf(testDate, TimeSegment.TYPE_MONTH);
    expect(a).toStrictEqual(b);
    expect(a).toStrictEqual(testDate);
});

test('Dates: endOf-Year', () => {
    const b = moment.unix(basicDate).utc().endOf('year').unix();
    const a = Dates.endOf(basicDate, TimeSegment.TYPE_YEAR);
    expect(a).toStrictEqual(b);
});

test('Dates: endOf-Week', () => {
    let b = moment.unix(basicDate).utc().endOf('isoWeek').unix();
    let a = Dates.endOf(basicDate, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().endOf('isoWeek').unix();
    a = Dates.endOf(edgeDate, TimeSegment.TYPE_WEEK);
    expect(a).toStrictEqual(b);
});

test('Dates: format', () => {
    let b = moment.unix(basicDate).utc().startOf('day');
    let a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    b = moment.unix(basicDate).utc().startOf('hour');
    a = Dates.startOf(basicDate, TimeSegment.TYPE_HOUR);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    b = moment.unix(basicDate).utc().startOf('minute');
    a = Dates.startOf(basicDate, TimeSegment.TYPE_MINUTE);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    b = moment.unix(basicDate).utc().startOf('second');
    a = Dates.startOf(basicDate, TimeSegment.TYPE_SECOND);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    b = moment.unix(basicDate).utc().startOf('month');
    a = Dates.startOf(basicDate, TimeSegment.TYPE_MONTH);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    b = moment.unix(basicDate).utc().startOf('year');
    a = Dates.startOf(basicDate, TimeSegment.TYPE_YEAR);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    b = moment.unix(basicDate).utc().startOf('isoWeek');
    a = Dates.startOf(basicDate, TimeSegment.TYPE_WEEK);
    expect(Dates.format(a, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(b.format("DD/MM/YYYY HH:mm:ss"));

    // forbidden values
    expect(Dates.format(null, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(null);
    expect(Dates.format(undefined, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(null);
    expect(Dates.format(NaN, "DD/MM/YYYY HH:mm:ss", false)).toStrictEqual(null);

    expect(Dates.format(basicDate, "foo-bar", false)).toStrictEqual(moment.unix(basicDate).utc().format("foo-bar"));
});

test('Dates: diff', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);

    expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'day', false));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', false));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', false));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', false));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_WEEK, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'week', false));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_MONTH, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'month', false));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_YEAR, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'year', false));

    expect(Dates.diff(a1, a, TimeSegment.TYPE_DAY, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'day', true));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_HOUR, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', true));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_MINUTE, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', true));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_SECOND, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', true));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_WEEK, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'week', true));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_MONTH, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'month', true));
    expect(Dates.diff(a1, a, TimeSegment.TYPE_YEAR, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'year', true));

    expect(Dates.diff(a, a1, TimeSegment.TYPE_DAY, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'day', false));
    expect(Dates.diff(a, a1, TimeSegment.TYPE_HOUR, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'hour', false));
    expect(Dates.diff(a, a1, TimeSegment.TYPE_MINUTE, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'minute', false));
    expect(Dates.diff(a, a1, TimeSegment.TYPE_SECOND, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'second', false));
    expect(Dates.diff(a, a1, TimeSegment.TYPE_WEEK, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'week', false));
    expect(Dates.diff(a, a1, TimeSegment.TYPE_MONTH, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'month', false));
    expect(Dates.diff(a, a1, TimeSegment.TYPE_YEAR, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'year', false));
});

test('Dates: isSame-Day', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'day'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'day'));
});

test('Dates: isSame-Hour', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'hour'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'hour'));
});

test('Dates: isSame-Minute', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'minute'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'minute'));
});

test('Dates: isSame-Second', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'second'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'second'));
});

test('Dates: isSame-Month', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'month'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'month'));

    const date1 = 1638316799;
    const date2 = 1638748799;
    expect(Dates.isSame(date1, date2, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(date1).utc().isSame(moment.unix(date2).utc(), 'month'));
});

test('Dates: isSame-Year', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'year'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'year'));
});

test('Dates: isSame-Week', () => {
    const a1 = edgeDate;
    const a = Dates.add(a1, -1, TimeSegment.TYPE_YEAR);
    expect(Dates.isSame(basicDate, basicDate, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(basicDate).utc(), 'week'));
    expect(Dates.isSame(basicDate, a, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(a).utc(), 'week'));
});

test('Dates: forbidden values', () => {
    // forbidden values
    expect(Dates.isSame(basicDate, null, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(null).utc(), 'day'));
    expect(Dates.isSame(basicDate, undefined, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(undefined).utc(), 'day'));
    expect(Dates.isSame(basicDate, NaN, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSame(moment.unix(NaN).utc(), 'day'));
});

test('Dates: isBefore', () => {
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'day'));
    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'hour'));
    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'minute'));
    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'second'));
    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'week'));
    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'month'));
    expect(Dates.isBefore(basicDate, basicDate, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(basicDate).utc(), 'year'));

    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'day'));
    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'hour'));
    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'minute'));
    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'second'));
    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'week'));
    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'month'));
    expect(Dates.isBefore(basicDate, a, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(a).utc(), 'year'));

    // forbidden values
    expect(Dates.isBefore(basicDate, null, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(null).utc(), 'day'));
    expect(Dates.isBefore(basicDate, undefined, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(undefined).utc(), 'day'));
    expect(Dates.isBefore(basicDate, NaN, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isBefore(moment.unix(NaN).utc(), 'day'));
});

test('Dates: isSameOrBefore', () => {
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'day'));
    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'hour'));
    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'minute'));
    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'second'));
    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'week'));
    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'month'));
    expect(Dates.isSameOrBefore(basicDate, basicDate, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(basicDate).utc(), 'year'));

    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'day'));
    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'hour'));
    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'minute'));
    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'second'));
    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'week'));
    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'month'));
    expect(Dates.isSameOrBefore(basicDate, a, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(a).utc(), 'year'));

    // forbidden values
    expect(Dates.isSameOrBefore(basicDate, null, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(null).utc(), 'day'));
    expect(Dates.isSameOrBefore(basicDate, undefined, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(undefined).utc(), 'day'));
    expect(Dates.isSameOrBefore(basicDate, NaN, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrBefore(moment.unix(NaN).utc(), 'day'));
});

test('Dates: isAfter', () => {
    const a = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);

    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'day'));
    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'hour'));
    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'minute'));
    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'second'));
    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'week'));
    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'month'));
    expect(Dates.isAfter(basicDate, basicDate, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(basicDate).utc(), 'year'));

    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'day'));
    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'hour'));
    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'minute'));
    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'second'));
    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'week'));
    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'month'));
    expect(Dates.isAfter(basicDate, a, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(a).utc(), 'year'));

    // forbidden values
    expect(Dates.isAfter(basicDate, null, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(null).utc(), 'day'));
    expect(Dates.isAfter(basicDate, undefined, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(undefined).utc(), 'day'));
    expect(Dates.isAfter(basicDate, NaN, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isAfter(moment.unix(NaN).utc(), 'day'));
});

test('Dates: isSameOrAfter', () => {
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);

    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'day'));
    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'hour'));
    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'minute'));
    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'second'));
    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'week'));
    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'month'));
    expect(Dates.isSameOrAfter(basicDate, basicDate, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(basicDate).utc(), 'year'));

    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'day'));
    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_HOUR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'hour'));
    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_MINUTE)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'minute'));
    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_SECOND)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'second'));
    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_WEEK)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'week'));
    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_MONTH)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'month'));
    expect(Dates.isSameOrAfter(basicDate, a, TimeSegment.TYPE_YEAR)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(a).utc(), 'year'));

    // forbidden values
    expect(Dates.isSameOrAfter(basicDate, null, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(null).utc(), 'day'));
    expect(Dates.isSameOrAfter(basicDate, undefined, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(undefined).utc(), 'day'));
    expect(Dates.isSameOrAfter(basicDate, NaN, TimeSegment.TYPE_DAY)).toStrictEqual(moment.unix(basicDate).utc().isSameOrAfter(moment.unix(NaN).utc(), 'day'));
});

test('Dates: isBetween', () => {
    const a = Dates.startOf(basicDate, TimeSegment.TYPE_DAY);
    const b = Dates.endOf(basicDate, TimeSegment.TYPE_DAY);

    expect(Dates.isBetween(basicDate, a, b)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, basicDate, b)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(basicDate).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(a, basicDate, basicDate)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(basicDate).utc()));
    expect(Dates.isBetween(basicDate, basicDate, basicDate)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(basicDate).utc(), moment.unix(basicDate).utc()));
    expect(Dates.isBetween(a, basicDate, b)).toStrictEqual(moment.unix(a).utc().isBetween(moment.unix(basicDate).utc(), moment.unix(b).utc()));

    // forbidden values
    expect(Dates.isBetween(null, a, b)).toStrictEqual(moment.unix(null).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, null, b)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(null).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, a, null)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(null).utc()));
    expect(Dates.isBetween(null, null, b)).toStrictEqual(moment.unix(null).utc().isBetween(moment.unix(null).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(null, a, null)).toStrictEqual(moment.unix(null).utc().isBetween(moment.unix(a).utc(), moment.unix(null).utc()));
    expect(Dates.isBetween(basicDate, null, null)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(null).utc(), moment.unix(null).utc()));
    expect(Dates.isBetween(null, null, null)).toStrictEqual(moment.unix(null).utc().isBetween(moment.unix(null).utc(), moment.unix(null).utc()));

    expect(Dates.isBetween(undefined, a, b)).toStrictEqual(moment.unix(undefined).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, undefined, b)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(undefined).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, a, undefined)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(undefined).utc()));
    expect(Dates.isBetween(undefined, undefined, b)).toStrictEqual(moment.unix(undefined).utc().isBetween(moment.unix(undefined).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(undefined, a, undefined)).toStrictEqual(moment.unix(undefined).utc().isBetween(moment.unix(a).utc(), moment.unix(undefined).utc()));
    expect(Dates.isBetween(basicDate, undefined, undefined)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(undefined).utc(), moment.unix(undefined).utc()));
    expect(Dates.isBetween(undefined, undefined, undefined)).toStrictEqual(moment.unix(undefined).utc().isBetween(moment.unix(undefined).utc(), moment.unix(undefined).utc()));

    expect(Dates.isBetween(NaN, a, b)).toStrictEqual(moment.unix(NaN).utc().isBetween(moment.unix(a).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, NaN, b)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(NaN).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(basicDate, a, NaN)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(a).utc(), moment.unix(NaN).utc()));
    expect(Dates.isBetween(NaN, NaN, b)).toStrictEqual(moment.unix(NaN).utc().isBetween(moment.unix(NaN).utc(), moment.unix(b).utc()));
    expect(Dates.isBetween(NaN, a, NaN)).toStrictEqual(moment.unix(NaN).utc().isBetween(moment.unix(a).utc(), moment.unix(NaN).utc()));
    expect(Dates.isBetween(basicDate, NaN, NaN)).toStrictEqual(moment.unix(basicDate).utc().isBetween(moment.unix(NaN).utc(), moment.unix(NaN).utc()));
    expect(Dates.isBetween(NaN, NaN, NaN)).toStrictEqual(moment.unix(NaN).utc().isBetween(moment.unix(NaN).utc(), moment.unix(NaN).utc()));
});

test('Dates: hour', () => {
    let b = moment().utc().hour();
    let a = Dates.hour();
    expect(a - b).toBeLessThan(2);
    b = moment().utc().hour(16).unix();
    a = Dates.hour(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.hour(basicDate)).toStrictEqual(moment.unix(basicDate).utc().hour());
    expect(Dates.hour(basicDate, 18)).toStrictEqual(moment.unix(basicDate).utc().hour(18).unix());

    expect(Dates.hour(edgeDate, 25)).toStrictEqual(moment.unix(edgeDate).utc().hour(25).unix());

    // forbidden values

    /**
     * Résulat volontairement différent de moment => si on ne passe pas de paramètre, on charge Dates.now()
     */
    // expect(Dates.hour(undefined)).toStrictEqual(moment.unix(undefined).utc().hour());
    // expect(Dates.hour(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().hour(18).unix());
    expect(Dates.hour(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().hour(undefined));

    // expect(Dates.hour(NaN)).toStrictEqual(moment.unix(NaN).utc().hour());
    // expect(Dates.hour(NaN, 18)).toStrictEqual(moment.unix(NaN).utc().hour(18).unix());
    expect(Dates.hour(basicDate, NaN)).toStrictEqual(moment.unix(basicDate).utc().hour(NaN).unix());
});

test('Dates: hours', () => {
    let b = moment().utc().hours();
    let a = Dates.hours();
    expect(a - b).toBeLessThan(2);
    b = moment().utc().hours(16).unix();
    a = Dates.hours(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.hours(basicDate)).toStrictEqual(moment.unix(basicDate).utc().hours());
    expect(Dates.hours(basicDate, 18)).toStrictEqual(moment.unix(basicDate).utc().hours(18).unix());

    // forbidden values
    // expect(Dates.hours(undefined)).toStrictEqual(moment.unix(undefined).utc().hours());
    // expect(Dates.hours(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().hours(18).unix());
    expect(Dates.hours(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().hours(undefined));

    // expect(Dates.hours(NaN)).toStrictEqual(moment.unix(NaN).utc().hours());
    // expect(Dates.hours(NaN, 18)).toStrictEqual(moment.unix(NaN).utc().hours(18).unix());
    expect(Dates.hours(basicDate, NaN)).toStrictEqual(moment.unix(basicDate).utc().hours(NaN).unix());
});

test('Dates: minute', () => {
    let b = moment().utc(false).minute();
    let a = Dates.minute();
    expect(a - b).toBeLessThan(2);
    b = moment().utc(false).minute(16).unix();
    a = Dates.minute(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.minute(basicDate)).toStrictEqual(moment.unix(basicDate).utc(false).minute());
    expect(Dates.minute(basicDate, 33)).toStrictEqual(moment.unix(basicDate).utc(false).minute(33).unix());
    expect(Dates.minute(basicDate, 70)).toStrictEqual(moment.unix(basicDate).utc(false).minute(70).unix());
    expect(Dates.minute(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc(false).minute(-10).unix());

    expect(Dates.minute(1583013600, 122)).toStrictEqual(moment.unix(1583013600).utc(false).minute(122).unix());  // 29-02-2020 22:00:00 GMT

    // forbidden values
    // expect(Dates.minute(undefined)).toStrictEqual(moment.unix(undefined).utc(false).minute());
    // expect(Dates.minute(undefined, 18)).toStrictEqual(moment.unix(undefined).utc(true).minute(18).unix());
    expect(Dates.minute(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc(false).minute(undefined));
});

test('Dates: minutes', () => {
    let b = moment().utc(false).minutes();
    let a = Dates.minutes();
    expect(a - b).toBeLessThan(2);
    b = moment().utc(false).minutes(16).unix();
    a = Dates.minute(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.minutes(basicDate)).toStrictEqual(moment.unix(basicDate).utc(false).minutes());
    expect(Dates.minutes(basicDate, 33)).toStrictEqual(moment.unix(basicDate).utc(false).minutes(33).unix());
    expect(Dates.minutes(basicDate, 70)).toStrictEqual(moment.unix(basicDate).utc(false).minutes(70).unix());
    expect(Dates.minutes(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc(false).minutes(-10).unix());

    // forbidden values
    // expect(Dates.minutes(undefined)).toStrictEqual(moment.unix(undefined).utc(false).minutes());
    // expect(Dates.minutes(undefined, 18)).toStrictEqual(moment.unix(undefined).utc(true).minutes(18).unix());
    expect(Dates.minutes(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc(false).minutes(undefined));
});

test('Dates: second', () => {
    let b = moment().utc(false).second();
    let a = Dates.second();
    expect(a - b).toBeLessThan(2);
    b = moment().utc(false).second(16).unix();
    a = Dates.second(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.second(basicDate)).toStrictEqual(moment.unix(basicDate).utc(false).second());
    expect(Dates.second(basicDate, 33)).toStrictEqual(moment.unix(basicDate).utc(false).second(33).unix());
    expect(Dates.second(basicDate, 70)).toStrictEqual(moment.unix(basicDate).utc(false).second(70).unix());
    expect(Dates.second(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc(false).second(-10).unix());

    // forbidden values
    // expect(Dates.second(undefined)).toStrictEqual(moment.unix(undefined).utc(false).second());
    // expect(Dates.second(undefined, 18)).toStrictEqual(moment.unix(undefined).utc(true).second(18).unix());
    expect(Dates.second(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc(false).second(undefined));
});

test('Dates: seconds', () => {
    let b = moment().utc(false).seconds();
    let a = Dates.seconds();
    expect(a - b).toBeLessThan(2);
    b = moment().utc(false).seconds(16).unix();
    a = Dates.seconds(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.seconds(basicDate)).toStrictEqual(moment.unix(basicDate).utc(false).seconds());
    expect(Dates.seconds(basicDate, 33)).toStrictEqual(moment.unix(basicDate).utc(false).seconds(33).unix());
    expect(Dates.seconds(basicDate, 70)).toStrictEqual(moment.unix(basicDate).utc(false).seconds(70).unix());
    expect(Dates.seconds(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc(false).seconds(-10).unix());

    // forbidden values
    // expect(Dates.seconds(undefined)).toStrictEqual(moment.unix(undefined).utc(false).seconds());
    // expect(Dates.seconds(undefined, 18)).toStrictEqual(moment.unix(undefined).utc(true).seconds(18).unix());
    expect(Dates.seconds(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc(false).seconds(undefined));
});

test('Dates: toISOString', () => {
    expect(Dates.toISOString(basicDate)).toStrictEqual(moment.unix(basicDate).toISOString());
    expect(Dates.toISOString(edgeDate)).toStrictEqual(moment.unix(edgeDate).toISOString());
    expect(Dates.toISOString(Dates.now())).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('Dates: date', () => {
    let b = moment().utc().date();
    let a = Dates.date();
    expect(a - b).toBeLessThan(2);
    b = moment().utc().date(16).unix();
    a = Dates.date(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Dates.date(basicDate)).toStrictEqual(moment.unix(basicDate).utc().date());
    expect(Dates.date(basicDate, 16)).toStrictEqual(moment.unix(basicDate).utc().date(16).unix());
    expect(Dates.date(basicDate, 35)).toStrictEqual(moment.unix(basicDate).utc().date(35).unix());
    expect(Dates.date(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc().date(-10).unix());

    expect(Dates.date(edgeDate, 30)).toStrictEqual(moment.unix(edgeDate).utc().date(30).unix());

    // forbidden values
    // expect(Dates.date(undefined)).toStrictEqual(moment.unix(undefined).utc().date());
    // expect(Dates.date(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().date(18).unix());
    expect(Dates.date(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().date(undefined));
});

test('Dates: day', () => {
    let b = moment().utc().day();
    let a = Dates.day();
    expect(a - b).toStrictEqual(0);
    b = moment().utc().day(5).unix();
    a = Dates.day(null, 5);
    expect(a - b).toBeLessThan(2);
    expect(Dates.day(basicDate)).toStrictEqual(moment.unix(basicDate).utc().day());
    expect(Dates.day(basicDate, 5)).toStrictEqual(moment.unix(basicDate).utc().day(5).unix());
    expect(Dates.day(basicDate, 10)).toStrictEqual(moment.unix(basicDate).utc().day(10).unix());
    expect(Dates.day(basicDate, -3)).toStrictEqual(moment.unix(basicDate).utc().day(-3).unix());

    expect(Dates.day(edgeDate, 7)).toStrictEqual(moment.unix(edgeDate).utc().day(7).unix());

    expect(Dates.day(1628337600, 0)).toStrictEqual(moment.unix(1628337600).utc().day(0).unix());  // Sat Aug 07 2021 12:00:00 GMT+0000
    expect(Dates.day(1628337600, 1)).toStrictEqual(moment.unix(1628337600).utc().day(1).unix());
    expect(Dates.day(1628337600, 7)).toStrictEqual(moment.unix(1628337600).utc().day(7).unix());
    expect(Dates.day(1628337600, 8)).toStrictEqual(moment.unix(1628337600).utc().day(8).unix());

    expect(Dates.day(1628424000, 0)).toStrictEqual(moment.unix(1628424000).utc().day(0).unix());  // Sun Aug 08 2021 12:00:00 GMT+0000
    expect(Dates.day(1628424000, 1)).toStrictEqual(moment.unix(1628424000).utc().day(1).unix());
    expect(Dates.day(1628424000, 7)).toStrictEqual(moment.unix(1628424000).utc().day(7).unix());
    expect(Dates.day(1628424000, 8)).toStrictEqual(moment.unix(1628424000).utc().day(8).unix());

    expect(Dates.day(1628510400, 0)).toStrictEqual(moment.unix(1628510400).utc().day(0).unix());  // Mon Aug 09 2021 12:00:00 GMT+0000
    expect(Dates.day(1628510400, 1)).toStrictEqual(moment.unix(1628510400).utc().day(1).unix());
    expect(Dates.day(1628510400, 7)).toStrictEqual(moment.unix(1628510400).utc().day(7).unix());
    expect(Dates.day(1628510400, 8)).toStrictEqual(moment.unix(1628510400).utc().day(8).unix());

    // forbidden values
    // expect(Dates.day(undefined)).toStrictEqual(moment.unix(undefined).utc().day());
    // expect(Dates.day(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().day(18).unix());
    expect(Dates.day(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().day(undefined));
});

test('Dates: isoWeekday', () => {
    let b = moment().utc().isoWeekday();
    let a = Dates.isoWeekday();
    expect(a - b).toBeLessThan(2);
    b = moment().utc(true).isoWeekday(5).unix();
    a = Dates.isoWeekday(null, 5);
    expect(a - b).toBeLessThan(2);
    expect(Dates.isoWeekday(basicDate)).toStrictEqual(moment.unix(basicDate).utc().isoWeekday());
    expect(Dates.isoWeekday(basicDate, 5)).toStrictEqual(moment.unix(basicDate).utc().isoWeekday(5).unix());
    expect(Dates.isoWeekday(basicDate, 10)).toStrictEqual(moment.unix(basicDate).utc().isoWeekday(10).unix());
    expect(Dates.isoWeekday(basicDate, -3)).toStrictEqual(moment.unix(basicDate).utc().isoWeekday(-3).unix());

    expect(Dates.isoWeekday(1628510400, 1)).toStrictEqual(moment.unix(1628510400).utc().isoWeekday(1).unix());
    expect(Dates.isoWeekday(1628510400, 2)).toStrictEqual(moment.unix(1628510400).utc().isoWeekday(2).unix());
    expect(Dates.isoWeekday(1628596800, 2)).toStrictEqual(moment.unix(1628596800).utc().isoWeekday(2).unix());
    expect(Dates.isoWeekday(1628596800, 1)).toStrictEqual(moment.unix(1628596800).utc().isoWeekday(1).unix());
    expect(Dates.isoWeekday(1628337600, 0)).toStrictEqual(1627819200); // Volontairement différent de moment.unix(1628337600).utc().isoWeekday(0).unix());  // Sat Aug 07 2021 12:00:00 GMT+0000
    expect(Dates.isoWeekday(1628337600, 1)).toStrictEqual(1627905600); // moment.unix(1628337600).utc().isoWeekday(1).unix());
    expect(Dates.isoWeekday(1628337600, 7)).toStrictEqual(1628424000); // moment.unix(1628337600).utc().isoWeekday(7).unix());
    expect(Dates.isoWeekday(1628337600, 8)).toStrictEqual(1628510400); // moment.unix(1628337600).utc().isoWeekday(8).unix());

    expect(Dates.isoWeekday(1628424000, 0)).toStrictEqual(moment.unix(1628424000).utc().isoWeekday(0).unix());  // Sun Aug 08 2021 12:00:00 GMT+0000
    expect(Dates.isoWeekday(1628424000, 1)).toStrictEqual(moment.unix(1628424000).utc().isoWeekday(1).unix());
    expect(Dates.isoWeekday(1628424000, 7)).toStrictEqual(moment.unix(1628424000).utc().isoWeekday(7).unix());
    expect(Dates.isoWeekday(1628424000, 8)).toStrictEqual(moment.unix(1628424000).utc().isoWeekday(8).unix());

    expect(Dates.isoWeekday(1628510400, 0)).toStrictEqual(moment.unix(1628510400).utc().isoWeekday(0).unix());  // Mon Aug 09 2021 12:00:00 GMT+0000
    expect(Dates.isoWeekday(1628510400, 1)).toStrictEqual(moment.unix(1628510400).utc().isoWeekday(1).unix());
    expect(Dates.isoWeekday(1628510400, 7)).toStrictEqual(moment.unix(1628510400).utc().isoWeekday(7).unix());
    expect(Dates.isoWeekday(1628510400, 8)).toStrictEqual(moment.unix(1628510400).utc().isoWeekday(8).unix());

    // forbidden values
    // expect(Dates.isoWeekday(undefined)).toStrictEqual(moment.unix(undefined).utc().isoWeekday());
    // expect(Dates.isoWeekday(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().isoWeekday(18).unix());
    expect(Dates.isoWeekday(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().isoWeekday(undefined));
});

test('Dates: month', () => {
    let b = moment().utc().month();
    let a = Dates.month();
    expect(a - b).toBeLessThan(2);
    b = moment().utc().month(5).unix();
    a = Dates.month(null, 5);
    expect(a - b).toBeLessThan(2);
    expect(Dates.month(basicDate)).toStrictEqual(moment.unix(basicDate).utc().month());
    expect(Dates.month(basicDate, 5)).toStrictEqual(moment.unix(basicDate).utc().month(5).unix());
    expect(Dates.month(basicDate, 13)).toStrictEqual(moment.unix(basicDate).utc().month(13).unix());
    expect(Dates.month(basicDate, -3)).toStrictEqual(moment.unix(basicDate).utc().month(-3).unix());

    expect(Dates.month(1612094400, 1)).toStrictEqual(moment.unix(1612094400).utc().month(1).unix());  // 31-01-2021 12:00:00 GMT

    // forbidden values
    // expect(Dates.month(undefined)).toStrictEqual(moment.unix(undefined).utc().month());
    // expect(Dates.month(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().month(18).unix());
    expect(Dates.month(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().month(undefined));
});

test('Dates: year', () => {
    let b = moment().utc().year();
    let a = Dates.year();
    expect(a - b).toBeLessThan(2);
    b = moment().utc().year(5).unix();
    a = Dates.year(null, 5);
    expect(a - b).toBeLessThan(2);
    expect(Dates.year(basicDate)).toStrictEqual(moment.unix(basicDate).utc().year());
    expect(Dates.year(basicDate, 5)).toStrictEqual(moment.unix(basicDate).utc().year(5).unix());
    expect(Dates.year(basicDate, -3)).toStrictEqual(moment.unix(basicDate).utc().year(-3).unix());

    expect(Dates.year(basicDate, 271000)).toStrictEqual(moment.unix(basicDate).utc().year(271000).unix());
    expect(Dates.year(basicDate, -271000)).toStrictEqual(moment.unix(basicDate).utc().year(-271000).unix());

    // forbidden values
    // expect(Dates.year(undefined)).toStrictEqual(moment.unix(undefined).utc().year());
    // expect(Dates.year(undefined, 18)).toStrictEqual(moment.unix(undefined).utc().year(18).unix());
    expect(Dates.year(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().year(undefined));
});
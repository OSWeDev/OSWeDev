import { test, expect } from "playwright-test-coverage";

import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import moment from 'moment';
import HourSegment from "../../../src/shared/modules/DataRender/vos/HourSegment";
import Durations from '../../../src/shared/modules/FormatDatesNombres/Dates/Durations';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

const basicDate = 1627903493; // 2-08-2021 11:24:53 GMT
const edgeDate = 1583020799; // 29-02-2020 23:59:59 GMT
const reverseEdgeDate = 1583020800;  // 00-03-2020 00:00:00 GMT

test('Durations: from_segmentation', () => {
    let b = moment.duration(2, 'hours');
    let a = Durations.from_segmentation(2, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(2, 'minutes');
    a = Durations.from_segmentation(2, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(2, 'seconds');
    a = Durations.from_segmentation(2, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b.asSeconds());

    // Overflow
    b = moment.duration(28, 'hours');
    a = Durations.from_segmentation(28, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(75, 'minutes');
    a = Durations.from_segmentation(75, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(1441, 'minutes');
    a = Durations.from_segmentation(1441, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(120, 'seconds');
    a = Durations.from_segmentation(120, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(3601, 'seconds');
    a = Durations.from_segmentation(3601, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b.asSeconds());

    // Null duration
    b = moment.duration(0, 'hours');
    a = Durations.from_segmentation(0, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(0, 'minutes');
    a = Durations.from_segmentation(0, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(0, 'seconds');
    a = Durations.from_segmentation(0, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b.asSeconds());

    // Negative duration
    b = moment.duration(-2, 'hours');
    a = Durations.from_segmentation(-2, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(-2, 'minutes');
    a = Durations.from_segmentation(-2, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(-2, 'seconds');
    a = Durations.from_segmentation(-2, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b.asSeconds());

    // Decimal duration
    b = moment.duration(0.333, 'hours');
    a = Durations.from_segmentation(0.333, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(0.333, 'minutes');
    a = Durations.from_segmentation(0.333, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(0.333, 'seconds');
    a = Durations.from_segmentation(0.333, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    // Forbidden values
    b = moment.duration(null, 'hours');
    a = Durations.from_segmentation(null, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(null, 'minutes');
    a = Durations.from_segmentation(null, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(null, 'seconds');
    a = Durations.from_segmentation(null, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(undefined, 'hours');
    a = Durations.from_segmentation(undefined, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(undefined, 'minutes');
    a = Durations.from_segmentation(undefined, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(undefined, 'seconds');
    a = Durations.from_segmentation(undefined, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(Math.floor(b.asSeconds()));

    b = moment.duration(NaN, 'hours');
    a = Durations.from_segmentation(NaN, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(NaN, 'minutes');
    a = Durations.from_segmentation(NaN, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b.asSeconds());

    b = moment.duration(NaN, 'seconds');
    a = Durations.from_segmentation(NaN, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b.asSeconds());

    // // Add 1
    // let b = moment.unix(0).utc().add(1, 'hour').unix();
    // let a = Durations.from_segmentation(1, HourSegment.TYPE_HOUR);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(1, 'minute').unix();
    // a = Durations.from_segmentation(1, HourSegment.TYPE_MINUTE);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(1, 'second').unix();
    // a = Durations.from_segmentation(1, HourSegment.TYPE_SECOND);
    // expect(a).toStrictEqual(b);

    // // Add 0
    // expect(Durations.from_segmentation(0, HourSegment.TYPE_HOUR)).toStrictEqual(0);
    // expect(Durations.from_segmentation(0, HourSegment.TYPE_MINUTE)).toStrictEqual(0);
    // expect(Durations.from_segmentation(0, HourSegment.TYPE_SECOND)).toStrictEqual(0);

    // // Remove 1
    // b = moment.unix(0).utc().add(-1, 'hour').unix();
    // a = Durations.from_segmentation(-1, HourSegment.TYPE_HOUR);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(-1, 'minute').unix();
    // a = Durations.from_segmentation(-1, HourSegment.TYPE_MINUTE);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(-1, 'second').unix();
    // a = Durations.from_segmentation(-1, HourSegment.TYPE_SECOND);
    // expect(a).toStrictEqual(b);

    // // Add decimal number
    // b = moment.unix(0).utc().add(0.125, 'hour').unix();
    // a = Durations.from_segmentation(0.125, HourSegment.TYPE_HOUR);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(-0.25, 'hour').unix();
    // a = Durations.from_segmentation(-0.25, HourSegment.TYPE_HOUR);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(0.333, 'minute').unix();
    // a = Durations.from_segmentation(0.333, HourSegment.TYPE_MINUTE);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(-0.2, 'minute').unix();
    // a = Durations.from_segmentation(-0.2, HourSegment.TYPE_MINUTE);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(0.654, 'second').unix();
    // a = Durations.from_segmentation(0.654, HourSegment.TYPE_SECOND);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(-1.33, 'second').unix();
    // a = Durations.from_segmentation(-1.33, HourSegment.TYPE_SECOND);
    // expect(a).toStrictEqual(b);

    // // Forbidden values
    // b = moment.unix(0).utc().add(null, 'hour').unix();
    // a = Durations.from_segmentation(null, HourSegment.TYPE_HOUR);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(undefined, 'minute').unix();
    // a = Durations.from_segmentation(undefined, HourSegment.TYPE_MINUTE);
    // expect(a).toStrictEqual(b);

    // b = moment.unix(0).utc().add(NaN, 'second').unix();
    // a = Durations.from_segmentation(NaN, HourSegment.TYPE_SECOND);
    // expect(a).toStrictEqual(b);
});

test('Durations: parse', () => {
    const durationStr = '2:26:38';
    expect(Durations.as(Durations.parse(durationStr), HourSegment.TYPE_SECOND)).toStrictEqual(moment.duration(durationStr).asSeconds());
    const durationInt = 3600000;
    expect(Durations.as(Durations.parse(durationInt), HourSegment.TYPE_SECOND)).toStrictEqual(moment.duration(durationInt).asSeconds());
});

test('Durations: add', () => {
    // Add 1
    let b = moment.unix(basicDate).utc().add(1, 'hour').unix();
    let a = Durations.add(basicDate, 1, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(1, 'minute').unix();
    a = Durations.add(basicDate, 1, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(1, 'second').unix();
    a = Durations.add(basicDate, 1, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'hour').unix();
    a = Durations.add(edgeDate, 1, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'minute').unix();
    a = Durations.add(edgeDate, 1, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(edgeDate).utc().add(1, 'second').unix();
    a = Durations.add(edgeDate, 1, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    // Add 0
    expect(Durations.add(basicDate, 0, HourSegment.TYPE_HOUR)).toStrictEqual(basicDate);
    expect(Durations.add(basicDate, 0, HourSegment.TYPE_MINUTE)).toStrictEqual(basicDate);
    expect(Durations.add(basicDate, 0, HourSegment.TYPE_SECOND)).toStrictEqual(basicDate);

    // Remove 1
    b = moment.unix(basicDate).utc().add(-1, 'hour').unix();
    a = Durations.add(basicDate, -1, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-1, 'minute').unix();
    a = Durations.add(basicDate, -1, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-1, 'second').unix();
    a = Durations.add(basicDate, -1, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'hour').unix();
    a = Durations.add(reverseEdgeDate, -1, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'minute').unix();
    a = Durations.add(reverseEdgeDate, -1, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(reverseEdgeDate).utc().add(-1, 'second').unix();
    a = Durations.add(reverseEdgeDate, -1, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    // Add decimal number
    b = moment.unix(basicDate).utc().add(0.125, 'hour').unix();
    a = Durations.add(basicDate, 0.125, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-0.25, 'hour').unix();
    a = Durations.add(basicDate, -0.25, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(0.333, 'minute').unix();
    a = Durations.add(basicDate, 0.333, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-0.2, 'minute').unix();
    a = Durations.add(basicDate, -0.2, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(0.654, 'second').unix();
    a = Durations.add(basicDate, 0.654, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(-1.33, 'second').unix();
    a = Durations.add(basicDate, -1.33, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    // Autres (overflow, changement d'heure...)
    b = moment.unix(basicDate).utc().add(25, 'hour').unix();
    a = Durations.add(basicDate, 25, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(70, 'minute').unix();
    a = Durations.add(basicDate, 70, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(70, 'second').unix();
    a = Durations.add(basicDate, 70, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);

    b = moment.unix(1616864400).utc().add(15, 'hour').unix();  // 27-03-2021 18:00:00 GMT
    a = Durations.add(1616864400, 15, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    // Forbidden values
    b = moment.unix(basicDate).utc().add(null, 'hour').unix();
    a = Durations.add(basicDate, null, HourSegment.TYPE_HOUR);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(undefined, 'minute').unix();
    a = Durations.add(basicDate, undefined, HourSegment.TYPE_MINUTE);
    expect(a).toStrictEqual(b);

    b = moment.unix(basicDate).utc().add(NaN, 'second').unix();
    a = Durations.add(basicDate, NaN, HourSegment.TYPE_SECOND);
    expect(a).toStrictEqual(b);
});

test('Durations: format', () => {
    expect(Durations.format(basicDate, "DD/MM/YYYY HH:mm:ss")).toStrictEqual(moment.unix(basicDate).utc().format("DD/MM/YYYY HH:mm:ss"));
    expect(Durations.format(edgeDate, "DD/MM/YYYY HH:mm:ss")).toStrictEqual(moment.unix(edgeDate).utc().format("DD/MM/YYYY HH:mm:ss"));
    expect(Durations.format(reverseEdgeDate, "DD/MM/YYYY HH:mm:ss")).toStrictEqual(moment.unix(reverseEdgeDate).utc().format("DD/MM/YYYY HH:mm:ss"));
});

test('Durations: diff', () => {
    const a1 = edgeDate;
    const a = moment.unix(edgeDate).utc().add(-1, 'day').unix();

    expect(Durations.diff(a1, a, HourSegment.TYPE_HOUR, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', false));
    expect(Durations.diff(a1, a, HourSegment.TYPE_MINUTE, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', false));
    expect(Durations.diff(a1, a, HourSegment.TYPE_SECOND, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', false));

    expect(Durations.diff(a1, a, HourSegment.TYPE_HOUR, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'hour', true));
    expect(Durations.diff(a1, a, HourSegment.TYPE_MINUTE, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'minute', true));
    expect(Durations.diff(a1, a, HourSegment.TYPE_SECOND, true)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(a).utc(), 'second', true));

    expect(Durations.diff(a, a1, HourSegment.TYPE_HOUR, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'hour', false));
    expect(Durations.diff(a, a1, HourSegment.TYPE_MINUTE, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'minute', false));
    expect(Durations.diff(a, a1, HourSegment.TYPE_SECOND, false)).toStrictEqual(moment.unix(a).utc().diff(moment.unix(a1).utc(), 'second', false));

    // Forbidden values
    expect(Durations.diff(a1, undefined, HourSegment.TYPE_HOUR, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(undefined).utc(), 'hour', false));
    expect(Durations.diff(a1, null, HourSegment.TYPE_MINUTE, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(null).utc(), 'minute', false));
    expect(Durations.diff(a1, NaN, HourSegment.TYPE_SECOND, false)).toStrictEqual(moment.unix(a1).utc().diff(moment.unix(NaN).utc(), 'second', false));

    expect(Durations.diff(undefined, a, HourSegment.TYPE_HOUR, false)).toStrictEqual(moment.unix(undefined).utc().diff(moment.unix(a).utc(), 'hour', false));
    expect(Durations.diff(null, a, HourSegment.TYPE_MINUTE, false)).toStrictEqual(moment.unix(null).utc().diff(moment.unix(a).utc(), 'minute', false));
    expect(Durations.diff(NaN, a, HourSegment.TYPE_SECOND, false)).toStrictEqual(moment.unix(NaN).utc().diff(moment.unix(a).utc(), 'second', false));
});

test('Durations: as', () => {
    let b = moment.duration(2, 'hours');
    let a = Durations.from_segmentation(2, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(2, 'minutes');
    a = Durations.from_segmentation(2, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(2, 'seconds');
    a = Durations.from_segmentation(2, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    // Overflow
    b = moment.duration(28, 'hours');
    a = Durations.from_segmentation(28, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(75, 'minutes');
    a = Durations.from_segmentation(75, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(1441, 'minutes');
    a = Durations.from_segmentation(1441, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(120, 'seconds');
    a = Durations.from_segmentation(120, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    b = moment.duration(3601, 'seconds');
    a = Durations.from_segmentation(3601, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    // Null duration
    b = moment.duration(0, 'hours');
    a = Durations.from_segmentation(0, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(0, 'minutes');
    a = Durations.from_segmentation(0, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(0, 'seconds');
    a = Durations.from_segmentation(0, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    // Negative duration
    b = moment.duration(-2, 'hours');
    a = Durations.from_segmentation(-2, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(-2, 'minutes');
    a = Durations.from_segmentation(-2, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(-2, 'seconds');
    a = Durations.from_segmentation(-2, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    // Decimal duration
    b = moment.duration(0.333, 'hours');
    a = Durations.from_segmentation(0.333, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(0.3327777777777778); // volontairement différent b.asHours());

    b = moment.duration(0.333, 'minutes');
    a = Durations.from_segmentation(0.333, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(0.31666666666666665); // volontairement différent b.asMinutes());

    b = moment.duration(0.333, 'seconds');
    a = Durations.from_segmentation(0.333, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(0); // volontairement différent b.asSeconds());

    // Forbidden values
    b = moment.duration(null, 'hours');
    a = Durations.from_segmentation(null, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(null, 'minutes');
    a = Durations.from_segmentation(null, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(null, 'seconds');
    a = Durations.from_segmentation(null, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    b = moment.duration(undefined, 'hours');
    a = Durations.from_segmentation(undefined, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(undefined, 'minutes');
    a = Durations.from_segmentation(undefined, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(undefined, 'seconds');
    a = Durations.from_segmentation(undefined, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());

    b = moment.duration(NaN, 'hours');
    a = Durations.from_segmentation(NaN, HourSegment.TYPE_HOUR);
    expect(Durations.as(a, HourSegment.TYPE_HOUR)).toStrictEqual(b.asHours());

    b = moment.duration(NaN, 'minutes');
    a = Durations.from_segmentation(NaN, HourSegment.TYPE_MINUTE);
    expect(Durations.as(a, HourSegment.TYPE_MINUTE)).toStrictEqual(b.asMinutes());

    b = moment.duration(NaN, 'seconds');
    a = Durations.from_segmentation(NaN, HourSegment.TYPE_SECOND);
    expect(Durations.as(a, HourSegment.TYPE_SECOND)).toStrictEqual(b.asSeconds());
});

test('Durations: hours', () => {
    let b = moment().utc().hour();
    let a = Durations.hours(null);
    expect(a - b).toBeLessThan(2);
    b = moment().utc().hour(16).unix();
    a = Durations.hours(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Durations.hours(basicDate)).toStrictEqual(moment.unix(basicDate).utc().hour());
    expect(Durations.hours(basicDate, 18)).toStrictEqual(moment.unix(basicDate).utc().hour(18).unix());

    expect(Durations.hours(edgeDate, 25)).toStrictEqual(moment.unix(edgeDate).utc().hour(25).unix());

    // Forbidden values
    expect(Durations.hours(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc().hour(undefined));
    expect(Durations.hours(basicDate, NaN)).toStrictEqual(moment.unix(basicDate).utc().hour(NaN).unix());
});

test('Durations: minutes', () => {
    let b = moment().utc(false).minute();
    let a = Durations.minutes(null);
    expect(a - b).toBeLessThan(2);
    b = moment().utc(false).minute(16).unix();
    a = Durations.minutes(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Durations.minutes(basicDate)).toStrictEqual(moment.unix(basicDate).utc(false).minute());
    expect(Durations.minutes(basicDate, 33)).toStrictEqual(moment.unix(basicDate).utc(false).minute(33).unix());
    expect(Durations.minutes(basicDate, 70)).toStrictEqual(moment.unix(basicDate).utc(false).minute(70).unix());
    expect(Durations.minutes(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc(false).minute(-10).unix());

    // forbidden values
    // expect(Durations.minutes(undefined)).toStrictEqual(moment.unix(undefined).utc(false).minute());
    // expect(Durations.minutes(undefined, 18)).toStrictEqual(moment.unix(undefined).utc(true).minute(18).unix());
    expect(Durations.minutes(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc(false).minute(undefined));
});

test('Durations: seconds', () => {
    let b = moment().utc(false).second();
    let a = Durations.seconds(null);
    expect(a - b).toBeLessThan(2);
    b = moment().utc(false).second(16).unix();
    a = Durations.seconds(null, 16);
    expect(a - b).toBeLessThan(2);
    expect(Durations.seconds(basicDate)).toStrictEqual(moment.unix(basicDate).utc(false).second());
    expect(Durations.seconds(basicDate, 33)).toStrictEqual(moment.unix(basicDate).utc(false).second(33).unix());
    expect(Durations.seconds(basicDate, 70)).toStrictEqual(moment.unix(basicDate).utc(false).second(70).unix());
    expect(Durations.seconds(basicDate, -10)).toStrictEqual(moment.unix(basicDate).utc(false).second(-10).unix());

    // forbidden values
    // expect(Durations.seconds(undefined)).toStrictEqual(moment.unix(undefined).utc(false).second());
    // expect(Durations.seconds(undefined, 18)).toStrictEqual(moment.unix(undefined).utc(true).second(18).unix());
    expect(Durations.seconds(basicDate, undefined)).toStrictEqual(moment.unix(basicDate).utc(false).second(undefined));
});
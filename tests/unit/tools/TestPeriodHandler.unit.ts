import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";

import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';
import PeriodHandler from '../../../src/shared/tools/PeriodHandler';
import moment from 'moment';

test('PeriodHandler: isDateInPeriod', () => {

    expect(PeriodHandler.getInstance().isDateInPeriod(null, null)).toStrictEqual(false);

    // Contrat fin 30/07 => 30/07 dans planning pas accessible
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-06-30']")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-06-30')")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-06-30')")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-06-30']")).toStrictEqual(false);

    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-06-30']")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-06-30')")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-06-30')")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-06-30']")).toStrictEqual(true);


    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-07-01']")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-29','2019-07-01')")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-07-01')")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-29','2019-07-01']")).toStrictEqual(true);


    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-07-01']")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "['2019-06-30','2019-07-01')")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-07-01')")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().isDateInPeriod(moment('2019-06-30').utc(true), "('2019-06-30','2019-07-01']")).toStrictEqual(false);
});

test('PeriodHandler: lower', () => {

    expect(PeriodHandler.getInstance().lower(null, null)).toStrictEqual(null);
    expect(PeriodHandler.getInstance().lower("['2019-06-30','2019-07-01']")).toStrictEqual('2019-06-30');
    expect(PeriodHandler.getInstance().lower("['2019-07-01','2019-06-30']")).toStrictEqual('2019-07-01');
});

test('PeriodHandler: upper', () => {

    expect(PeriodHandler.getInstance().upper(null, null)).toStrictEqual(null);
    expect(PeriodHandler.getInstance().upper("['2019-06-30','2019-07-01']")).toStrictEqual('2019-07-01');
    expect(PeriodHandler.getInstance().upper("['2019-07-01','2019-06-30']")).toStrictEqual('2019-06-30');
});


test('PeriodHandler: lowerMoment', () => {

    expect(PeriodHandler.getInstance().lowerMoment(null, null)).toStrictEqual(null);
    expect(PeriodHandler.getInstance().lowerMoment("['2019-07-01','2019-06-30']", "hours")).toStrictEqual(moment("'2019-07-01'").utc(true));
    expect(PeriodHandler.getInstance().upperMoment("['2019-06-30','2019-07-01']", "hours")).toStrictEqual(moment("'2019-07-01'").utc(true));

});

test('PeriodHandler: upperMoment', () => {

    expect(PeriodHandler.getInstance().upperMoment(null, null)).toStrictEqual(null);
    expect(PeriodHandler.getInstance().upperMoment("['2019-07-01','2019-06-30']", "hours")).toStrictEqual(moment("'2019-06-30'").utc(true));
    expect(PeriodHandler.getInstance().upperMoment("['2019-06-30','2019-07-01']", "hours")).toStrictEqual(moment("'2019-07-01'").utc(true));
});

test('PeriodHandler: hasUpper', () => {

    expect(PeriodHandler.getInstance().hasUpper(null, null)).toStrictEqual(false);
    expect(PeriodHandler.getInstance().hasUpper("['2019-06-30']")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().hasUpper("['2019-06-30','2019-07-01']")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().hasUpper("['2019-07-01','2019-06-30']")).toStrictEqual(true);
});

test('PeriodHandler: hasLower', () => {

    expect(PeriodHandler.getInstance().hasLower(null, null)).toStrictEqual(false);
    expect(PeriodHandler.getInstance().hasLower("['2019-06-30']")).toStrictEqual(false);
    expect(PeriodHandler.getInstance().hasLower("['2019-06-30','2019-07-01']")).toStrictEqual(true);
    expect(PeriodHandler.getInstance().hasLower("['2019-07-01','2019-06-30']")).toStrictEqual(true);
});

test('PeriodHandler: split', () => {

    expect(PeriodHandler.getInstance().split(null, null)).toStrictEqual(null);

    const res = PeriodHandler.getInstance().split("['2019-06-30','2019-07-01']");
    expect(res[0]).toStrictEqual("['2019-06-30','2019-07-01']");
    expect(res[1]).toStrictEqual("[");
    expect(res[2]).toStrictEqual("'2019-06-30'");
    expect(res[3]).toStrictEqual("'2019-07-01'");
    expect(res[4]).toStrictEqual("]");
    expect(res[5]).toStrictEqual(undefined);
    expect(PeriodHandler.getInstance().split(null)).toStrictEqual(null);
});

test('PeriodHandler: get_ts_range_from_period', () => {
    expect(PeriodHandler.getInstance().get_ts_range_from_period(null, null)).toStrictEqual(null);

    let expected = TSRange.createNew(moment("'2020-02-25'").utc(true).unix(), moment("'2020-03-17'").utc(true).add(-1, 'days').unix(), true, true, 1);
    expect(PeriodHandler.getInstance().get_ts_range_from_period("['2020-02-25','2020-03-17']", 1)).toStrictEqual(expected);

    expected = TSRange.createNew(moment("2020-02-25").utc(true).unix(), moment("2020-03-17").utc(true).add(-1, 'days').unix(), true, true, 1);
    expect(PeriodHandler.getInstance().get_ts_range_from_period("[2020-02-25,2020-03-17]", 1)).toStrictEqual(expected);
});
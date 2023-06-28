import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";

import DateHandler from '../../../src/shared/tools/DateHandler';
import moment from 'moment';

test('DateHandler: test humanizeDurationTo', () => {
    expect(DateHandler.getInstance().humanizeDurationTo(null)).toStrictEqual('');
    expect(DateHandler.getInstance().humanizeDurationTo(moment().startOf('day').utc(true).add(-1, 'year').unix())).toStrictEqual('a year');
    expect(DateHandler.getInstance().humanizeDurationTo(moment().endOf('day').utc(true).add(1, 'year').unix())).toStrictEqual('a year');
});
test('DateHandler: test formatDayForApi', () => {
    expect(DateHandler.getInstance().formatDayForApi(null)).toStrictEqual(null);
    expect(DateHandler.getInstance().formatDayForApi(moment('2020-02-01').startOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
    expect(DateHandler.getInstance().formatDayForApi(moment('2020-02-01').endOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
});
test('DateHandler: test formatDayForIndex', () => {
    expect(DateHandler.getInstance().formatDayForIndex(null)).toStrictEqual(null);
    expect(DateHandler.getInstance().formatDayForIndex(moment('2020-02-01').startOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
    expect(DateHandler.getInstance().formatDayForIndex(moment('2020-02-01').endOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
});
test('DateHandler: test formatDayForSQL', () => {
    expect(DateHandler.getInstance().formatDayForSQL(null)).toStrictEqual(null);
    expect(DateHandler.getInstance().formatDayForSQL(moment('2020-02-01').startOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
    expect(DateHandler.getInstance().formatDayForSQL(moment('2020-02-01').endOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
});
test('DateHandler: test formatDayForVO', () => {
    expect(DateHandler.getInstance().formatDayForVO(null)).toStrictEqual(null);
    expect(DateHandler.getInstance().formatDayForVO(moment('2020-02-01').startOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
    expect(DateHandler.getInstance().formatDayForVO(moment('2020-02-01').endOf('day').utc(true).unix())).toStrictEqual('2020-02-01');
});
test('DateHandler: test formatMonthFromVO', () => {
    expect(DateHandler.getInstance().formatMonthFromVO(null)).toStrictEqual(null);
    expect(DateHandler.getInstance().formatMonthFromVO(moment('2020-02-01').startOf('day').utc(true).unix())).toStrictEqual('2020-02');
    expect(DateHandler.getInstance().formatMonthFromVO(moment('2020-02-01').endOf('month').utc(true).unix())).toStrictEqual('2020-02');
});
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import TSRange from '../../../src/shared/modules/DataRender/vos/TSRange';

import DateHandler from '../../../src/shared/tools/DateHandler';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import RangeHandler from '../../../src/shared/tools/RangeHandler';

import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import moment from 'moment';
import Dates from '../../../src/shared/modules/FormatDatesNombres/Dates/Dates';

const zero: number = moment('2020-02-20').startOf('day').utc(true).unix();
const zero_cinq: number = zero + 12 * 60 * 60;
const moins_zero_cinq: number = zero - 12 * 60 * 60;
const un: number = zero + 1 * 60 * 60 * 24;
const deux: number = zero + 2 * 60 * 60 * 24;
const moins_un: number = zero - 1 * 60 * 60 * 24;
const moins_deux: number = zero - 2 * 60 * 60 * 24;

const zero_startofmonth: number = moment('2020-02-01').startOf('day').utc(true).unix();
const zero_startofnextmonth: number = moment('2020-03-01').startOf('day').utc(true).unix();

const zero_cinq_moins_un = zero + 11 * 60 * 60;
const zero_cinq_plus_un = zero + 13 * 60 * 60;
const bidon: number = zero + 10 * 60 * 60 * 24;

test('TSRangeHandler: is_max_range : test null', () => {
    expect(RangeHandler.is_one_max_range(null)).toStrictEqual(false);
});

test('TSRangeHandler: is_max_range : test bounded range', () => {
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_max_range : test left-open range', () => {
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);

    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_max_range : test right-open range', () => {
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);

    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_max_range : test unbounded range', () => {
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_one_max_range : test null', () => {
    expect(RangeHandler.is_one_max_range(null)).toStrictEqual(false);
});

test('TSRangeHandler: is_one_max_range : test bounded range', () => {
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_one_max_range : test left-open range', () => {
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_one_max_range : test right-open range', () => {
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_one_max_range : test unbounded range', () => {
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_left_open: test null', () => {
    expect(RangeHandler.is_left_open(null)).toStrictEqual(false);
});

test('TSRangeHandler: is_left_open: test bounded range', () => {
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_left_open: test left-open range', () => {
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_left_open: test right-open range', () => {
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_left_open: test unbounded range', () => {
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_right_open: test null', () => {
    expect(RangeHandler.is_right_open(null)).toStrictEqual(false);
});

test('TSRangeHandler: is_right_open: test bounded range', () => {
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_right_open: test left-open range', () => {
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(false);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(false);
});

test('TSRangeHandler: is_right_open: test right-open range', () => {
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);

    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: is_right_open: test unbounded range', () => {
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).toStrictEqual(true);
    expect(RangeHandler.is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).toStrictEqual(true);
});

test('TSRangeHandler: test get_ranges_according_to_segment_type', () => {
    expect(RangeHandler.get_ranges_according_to_segment_type(null, null)).toStrictEqual(null);
    expect(RangeHandler.get_ranges_according_to_segment_type([
        TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
    ], TimeSegment.TYPE_DAY)).toStrictEqual([
        TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)
    ]);

    // Le assign est juste à cause d'un pb de momentjs....
    const month_ranges = RangeHandler.get_ranges_according_to_segment_type([
        TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
    ], TimeSegment.TYPE_MONTH);
    // month_ranges[0].max['_i'] = "2020-03-01";
    // month_ranges[0].max['_pf'].parsedDateParts = [2020, 2, 1];
    // month_ranges[0].min['_i'] = "2020-02-01";
    // // comprends pas le lien entre month_ranges[0].min['_pf'] et month_ranges[0].max['_pf']... mais sans ça c'est le même obj...
    // month_ranges[0].min['_pf'] = Object.create(month_ranges[0].min['_pf']);
    // month_ranges[0].min['_pf'].parsedDateParts = [2020, 1, 1];

    expect(month_ranges).toStrictEqual([
        TSRange.createNew(zero_startofmonth, zero_startofnextmonth, true, false, TimeSegment.TYPE_MONTH)
    ]);
});

test('TSRangeHandler: test get_all_segmented_elements_from_range', () => {

    expect(RangeHandler.get_all_segmented_elements_from_range(null)).toStrictEqual(null);
    expect(RangeHandler.get_all_segmented_elements_from_range(TSRange.createNew(zero, zero, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.get_all_segmented_elements_from_range(TSRange.createNew(zero, zero, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.get_all_segmented_elements_from_range(TSRange.createNew(zero, zero, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(0, 0, true, true, 0))).toStrictEqual([0]);

    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual([0, 1]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual([1]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual([0]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).toStrictEqual([-1, 0]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).toStrictEqual([0]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).toStrictEqual([-1]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual([-2, -1, 0, 1, 2]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual([-1, 0, 1, 2]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual([-2, -1, 0, 1]);
    expect(RangeHandler.get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual([-1, 0, 1]);
});

// test('TSRangeHandler: test get_all_segmented_elements_from_ranges', () => {

//     expect(RangeHandler.get_all_segmented_elements_from_ranges(null)).toStrictEqual(null);
// });

test('TSRangeHandler: test isValid', () => {

    expect(RangeHandler.isValid(null)).toStrictEqual(false);
    expect(RangeHandler.isValid(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isValid(NumRange.createNew(2, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('TSRangeHandler: test range_includes_ranges', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT);
    expect(RangeHandler.range_includes_ranges(null, null)).toStrictEqual(true);
    expect(RangeHandler.range_includes_ranges(numRange1, [numRange2, numRange3])).toStrictEqual(false);
    expect(RangeHandler.range_includes_ranges(numRange2, [numRange1, numRange3])).toStrictEqual(false);
    expect(RangeHandler.range_includes_ranges(numRange2, [numRange3])).toStrictEqual(false);
    expect(RangeHandler.range_includes_ranges(numRange3, [numRange2])).toStrictEqual(false);
});

test('TSRangeHandler: test range_includes_range', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT);
    expect(RangeHandler.range_includes_range(null, null)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(numRange1, numRange2)).toStrictEqual(true);
    expect(RangeHandler.range_includes_range(numRange1, numRange3)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(numRange2, numRange1)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(numRange2, numRange3)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(numRange3, numRange2)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(numRange3, numRange1)).toStrictEqual(false);
});



test('TSRangeHandler: test getCardinal', () => {
    expect(RangeHandler.getCardinal(null)).toStrictEqual(null);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(1);

    expect(RangeHandler.getCardinal(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(2);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);

    expect(RangeHandler.getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(2);
    expect(RangeHandler.getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);

    expect(RangeHandler.getCardinal(TSRange.createNew(moins_deux, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(5);
    expect(RangeHandler.getCardinal(TSRange.createNew(moins_deux, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(4);
    expect(RangeHandler.getCardinal(TSRange.createNew(moins_deux, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(4);
    expect(RangeHandler.getCardinal(TSRange.createNew(moins_deux, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(3);

    expect(RangeHandler.getCardinal(TSRange.createNew(Dates.startOf(zero, TimeSegment.TYPE_MONTH), Dates.endOf(zero, TimeSegment.TYPE_MONTH), true, true, TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH)).toStrictEqual(1);
});

test('TSRangeHandler: test elt_intersects_any_range', () => {
    expect(RangeHandler.elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);


    expect(RangeHandler.elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(true);
});

test('TSRangeHandler: test elt_intersects_range', () => {
    expect(RangeHandler.elt_intersects_range(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(un, TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
});

test('TSRangeHandler: test cloneFrom', () => {
    expect(RangeHandler.cloneFrom(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

    expect(RangeHandler.cloneFrom(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));
});

test('TSRangeHandler: test createNew', () => {
    expect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)).toStrictEqual(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

    expect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)).toStrictEqual(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

    expect(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);

    expect(TSRange.createNew(moins_un, moins_un, true, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(moins_un, moins_un, false, true, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(moins_un, moins_un, false, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);

    expect(TSRange.createNew(un, un, true, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(un, un, false, true, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(un, un, false, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);

    expect(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)).toStrictEqual(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY));

    expect(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)).toStrictEqual(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

    expect(TSRange.createNew(zero_cinq, zero, false, true, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(zero_cinq, zero, true, true, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(zero_cinq, zero, true, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);
    expect(TSRange.createNew(zero_cinq, zero, false, false, TimeSegment.TYPE_DAY)).toStrictEqual(null);

    expect(TSRange.createNew(zero_cinq, bidon, false, false, TimeSegment.TYPE_DAY)).toStrictEqual(TSRange.createNew(un, bidon, true, false, TimeSegment.TYPE_DAY));
});

test('TSRangeHandler: test foreach', async () => {
    let res: number[] = [];
    await RangeHandler.foreach(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        zero
    ]);

    res = [];
    await RangeHandler.foreach(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];
    await RangeHandler.foreach(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];
    await await RangeHandler.foreach(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        zero
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        un
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        zero,
        un
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        moins_un,
        zero,
        un
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        moins_un,
        zero
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
        moins_un
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([

        zero
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([]);






    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([
        zero,
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([
        zero,
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, zero, zero);
    expect(res).toStrictEqual([
        zero,
    ]);


    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, moins_un, zero);
    expect(res).toStrictEqual([
        moins_un,
        zero]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, moins_un, zero);
    expect(res).toStrictEqual([
        moins_un,
        zero]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, moins_un, zero);
    expect(res).toStrictEqual([
        moins_un
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, moins_un, zero);
    expect(res).toStrictEqual([
        zero
    ]);

    res = [];

    await RangeHandler.foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), (date: number) => {
        res.push(date);
    }, TimeSegment.TYPE_DAY, moins_un, zero);
    expect(res).toStrictEqual([]);
});

test('TSRangeHandler: test foreach_ranges', async () => {
    let res: number[] = [];

    await RangeHandler.foreach_ranges([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)], (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([

        zero
    ]);

    res = [];

    await RangeHandler.foreach_ranges([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)], (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach_ranges([TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)], (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach_ranges([TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)], (date: number) => {
        res.push(date);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach_ranges([
        TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
    expect(res).toStrictEqual([

        zero
    ]);

    res = [];

    await RangeHandler.foreach_ranges([
        TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
    expect(res).toStrictEqual([

        zero,
        un
    ]);


    res = [];

    await RangeHandler.foreach_ranges([
        TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
    expect(res).toStrictEqual([

        zero,
        un,
        zero,
        un
    ]);


    res = [];

    await RangeHandler.foreach_ranges([
        TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
    expect(res).toStrictEqual([

        zero,
        un,
        zero,
        un,
        moins_un,
        zero,
        un,
        moins_un
    ]);
});

// test('TSRangeHandler: test getFormattedMaxForAPI', () => {
//     expect(RangeHandler.getFormattedMaxForAPI(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + un);
//     expect(RangeHandler.getFormattedMaxForAPI(TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + moins_un);
//     expect(RangeHandler.getFormattedMaxForAPI(TSRange.createNew(zero, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
//     expect(RangeHandler.getFormattedMaxForAPI(TSRange.createNew(moins_deux, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + zero);
//     expect(RangeHandler.getFormattedMaxForAPI(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
//     expect(RangeHandler.getFormattedMaxForAPI(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
// });

// test('TSRangeHandler: test getFormattedMinForAPI', () => {
//     expect(RangeHandler.getFormattedMinForAPI(TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + un);
//     expect(RangeHandler.getFormattedMinForAPI(TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + moins_deux);
//     expect(RangeHandler.getFormattedMinForAPI(TSRange.createNew(zero, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
//     expect(RangeHandler.getFormattedMinForAPI(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + zero);
//     expect(RangeHandler.getFormattedMinForAPI(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
//     expect(RangeHandler.getFormattedMinForAPI(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY))).toStrictEqual('' + moins_un);
// });

test('TSRangeHandler: test getCardinalFromArray', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.getCardinalFromArray(null)).toStrictEqual(null);
    expect(RangeHandler.getCardinalFromArray([numRange1, numRange3])).toStrictEqual(5);
    expect(RangeHandler.getCardinalFromArray([numRange2, numRange1])).toStrictEqual(4);
    expect(RangeHandler.getCardinalFromArray([numRange2, numRange3])).toStrictEqual(3);
});

test('TSRangeHandler: test getMinSurroundingRange', () => {
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(null);

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));







    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));





    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));

    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
    expect(RangeHandler.getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange));
});

test('TSRangeHandler: test getRangesUnion', () => {
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(null);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        }),
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(null);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);







    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)]
    );

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        null
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
    );

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        null
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
    );

    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        null
    );
    expect(RangeHandler.getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual(
        [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
    );





    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);

    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
    expect(RangeHandler.getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).toStrictEqual([
        Object.assign(TSRange.createNew(0, 0, true, true, TimeSegment.TYPE_DAY), {
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        })]);
});

test('TSRangeHandler: test getSegmentedMax', () => {

    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMax(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_plus_un).utc(false).format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_plus_un).utc(false).format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
});

test('TSRangeHandler: test getSegmentedMax_from_ranges', () => {
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));


    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));

    expect(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMax_from_ranges([
        TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
});

test('TSRangeHandler: test getSegmentedMin', () => {

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc(false).format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc(false).format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm', false)).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(null);

    // le test unitaire qui marche pas le 31/12 après midi ou le 01/01 avant midi...
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('year').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).toStrictEqual(null);
});

test('TSRangeHandler: test getSegmentedMin_from_ranges', () => {
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));


    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));

    expect(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ])).toStrictEqual(null);
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));

    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    expect(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
    ])).toStrictEqual(null);

    expect(Dates.format(RangeHandler.getSegmentedMin_from_ranges([
        TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR)
    ]), 'Y-MM-DD HH:mm', false)).toStrictEqual(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
});

test('TSRangeHandler: test isEndABeforeEndB_optimized_normalized', () => {
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isEndABeforeStartB_optimized_normalized', () => {
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isEndASameEndB_optimized_normalized', () => {
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isStartABeforeStartB_optimized_normalized', () => {
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isStartASameStartB_optimized_normalized', () => {
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);



    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});


test('TSRangeHandler: test isEndABeforeEndB', () => {
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isEndABeforeStartB', () => {
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isEndASameEndB', () => {
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isStartABeforeEndB', () => {
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);



    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isStartABeforeStartB', () => {
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isStartASameEndB', () => {
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test isStartASameStartB', () => {
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);




    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);



    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test create_single_elt_range', () => {

    const numRange1 = NumRange.createNew(6, 7, true, false, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT);

    expect(RangeHandler.create_single_elt_range(null, null, null)).toStrictEqual(null);
    expect(RangeHandler.create_single_elt_range(1, 6, 0)).toStrictEqual(numRange1);
    expect(RangeHandler.create_single_elt_range(1, 1, 0)).toStrictEqual(numRange2);
    expect(RangeHandler.create_single_elt_range(1, 0, 0)).toStrictEqual(numRange3);
});

test('TSRangeHandler: test is_elt_inf_min', () => {
    expect(RangeHandler.is_elt_inf_min(null, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(null, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(moins_un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
});

test('TSRangeHandler: test is_elt_sup_max', () => {
    expect(RangeHandler.is_elt_sup_max(null, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(null, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(deux, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test cloneArrayFrom', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    const numRange1Bis = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2Bis = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3Bis = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.cloneArrayFrom(null)).toStrictEqual(null);
    expect(RangeHandler.cloneArrayFrom([numRange1])).toStrictEqual([numRange1]);
    expect(RangeHandler.cloneArrayFrom([numRange1, numRange2])).toStrictEqual([numRange1Bis, numRange2Bis]);
    expect(RangeHandler.cloneArrayFrom([numRange1, numRange2, numRange3])).toStrictEqual([numRange1Bis, numRange3Bis, numRange2Bis]);
});

test('TSRangeHandler: test getIndex', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.getIndex(null)).toStrictEqual(null);
    expect(RangeHandler.getIndex(numRange1)).toStrictEqual("00&3");
    expect(RangeHandler.getIndex(numRange2)).toStrictEqual("03");
    expect(RangeHandler.getIndex(numRange3)).toStrictEqual("02&4");
});

test('TSRangeHandler: test humanize', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.humanize(null)).toStrictEqual(null);
    expect(RangeHandler.humanize(numRange1)).toStrictEqual('[0, 2]');
    expect(RangeHandler.humanize(numRange2)).toStrictEqual("3");
    expect(RangeHandler.humanize(numRange3)).toStrictEqual("2, 3");
});

test('TSRangeHandler: test getIndexRanges', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.getIndexRanges(null)).toStrictEqual(null);
    expect(RangeHandler.getIndexRanges([numRange1, numRange3])).toStrictEqual("00&4");
    expect(RangeHandler.getIndexRanges([numRange2, numRange1])).toStrictEqual("00&4");
    expect(RangeHandler.getIndexRanges([numRange2, numRange3])).toStrictEqual("02&4");
});

test('TSRangeHandler: test humanizeRanges', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.humanizeRanges(null)).toStrictEqual(null);
    // TODO FIXME d'ailleurs c'est assez naz vu comme ça comme humanize, on peut faire beaucoup mieux...
    expect(RangeHandler.humanizeRanges([numRange1, numRange3])).toStrictEqual("[0, 2], 2, 3");
    expect(RangeHandler.humanizeRanges([numRange2, numRange1])).toStrictEqual("3, [0, 2]");
    expect(RangeHandler.humanizeRanges([numRange2, numRange3])).toStrictEqual("3, 2, 3");
});

test('TSRangeHandler: test ranges_intersect_themselves', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.ranges_intersect_themselves(null)).toStrictEqual(false);
    expect(RangeHandler.ranges_intersect_themselves([numRange1, numRange3])).toStrictEqual(true);
    expect(RangeHandler.ranges_intersect_themselves([numRange2, numRange1])).toStrictEqual(false);
    expect(RangeHandler.ranges_intersect_themselves([numRange2, numRange3])).toStrictEqual(true);
});

test('TSRangeHandler: test any_range_intersects_any_range', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT);
    const numRange4 = NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.any_range_intersects_any_range(null, null)).toStrictEqual(false);
    expect(RangeHandler.any_range_intersects_any_range([numRange1, numRange2], [numRange3, numRange4])).toStrictEqual(true);
    expect(RangeHandler.any_range_intersects_any_range([numRange1, numRange3], [numRange2, numRange4])).toStrictEqual(false);
    expect(RangeHandler.any_range_intersects_any_range([numRange2, numRange3], [numRange1, numRange4])).toStrictEqual(true);
});

test('TSRangeHandler: test get_ranges_any_range_intersects_any_range', () => {

    const numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
    const numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
    const numRange3 = NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT);
    const numRange4 = NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT);

    expect(RangeHandler.get_ranges_any_range_intersects_any_range(null, null)).toStrictEqual(null);
    expect(RangeHandler.get_ranges_any_range_intersects_any_range([numRange1, numRange2], [numRange3, numRange4])).toStrictEqual([numRange1, numRange2]);
    expect(RangeHandler.get_ranges_any_range_intersects_any_range([numRange1, numRange3], [numRange2, numRange4])).toStrictEqual(null);
    expect(RangeHandler.get_ranges_any_range_intersects_any_range([numRange2, numRange3], [numRange1, numRange4])).toStrictEqual([numRange2, numRange3]);
});

test('TSRangeHandler: test range_intersects_range', () => {
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});


test('TSRangeHandler: test range_intersects_range_optimized_normalized', () => {
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});

test('TSRangeHandler: test range_intersects_any_range', () => {
    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), [
        TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), [
        TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);




    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);



    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), [
        TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
        TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
    ])).toStrictEqual(false);
});

test('TSRangeHandler: test ranges_are_contiguous_or_intersect', () => {
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).toStrictEqual(false);
});
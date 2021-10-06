import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';

import DateHandler from '../../../shared/tools/DateHandler';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import RangeHandler from '../../../shared/tools/RangeHandler';

import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import * as moment from 'moment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';

describe('TSRangeHandler', () => {


    let zero: number = moment('2020-02-20').startOf('day').utc(true).unix();
    let zero_cinq: number = zero + 12 * 60 * 60;
    let moins_zero_cinq: number = zero - 12 * 60 * 60;
    let un: number = zero + 1 * 60 * 60 * 24;
    let deux: number = zero + 2 * 60 * 60 * 24;
    let moins_un: number = zero - 1 * 60 * 60 * 24;
    let moins_deux: number = zero - 2 * 60 * 60 * 24;

    let zero_startofmonth: number = moment('2020-02-01').startOf('day').utc(true).unix();
    let zero_startofnextmonth: number = moment('2020-03-01').startOf('day').utc(true).unix();

    let zero_cinq_moins_un = zero + 11 * 60 * 60;
    let zero_cinq_plus_un = zero + 13 * 60 * 60;
    let bidon: number = zero + 10 * 60 * 60 * 24;

    describe('is_max_range', () => {
        it('test null', () => {
            expect(RangeHandler.getInstance().is_one_max_range(null)).to.equal(false);
        });

        it('test bounded range', () => {
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test left-open range', () => {
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);

            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test right-open range', () => {
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);

            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test unbounded range', () => {
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, false, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, false, true, TimeSegment.TYPE_SECOND))).to.equal(true);
        });
    });

    describe('is_one_max_range', () => {
        it('test null', () => {
            expect(RangeHandler.getInstance().is_one_max_range(null)).to.equal(false);
        });

        it('test bounded range', () => {
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test left-open range', () => {
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_SECOND))).to.equal(true);
        });

        it('test right-open range', () => {
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).to.equal(true);
        });

        it('test unbounded range', () => {
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_one_max_range(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);
        });
    });

    describe('is_left_open', () => {

        it('test null', () => {
            expect(RangeHandler.getInstance().is_left_open(null)).to.equal(false);
        });

        it('test bounded range', () => {
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test left-open range', () => {
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, deux, false, false, TimeSegment.TYPE_SECOND))).to.equal(true);
        });

        it('test right-open range', () => {
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test unbounded range', () => {
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_left_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);
        });
    });

    describe('is_right_open', () => {

        it('test null', () => {
            expect(RangeHandler.getInstance().is_right_open(null)).to.equal(false);
        });

        it('test bounded range', () => {
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test left-open range', () => {
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MONTH))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_WEEK))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_YEAR))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_HOUR))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_MINUTE))).to.equal(false);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, deux, true, false, TimeSegment.TYPE_SECOND))).to.equal(false);
        });

        it('test right-open range', () => {
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);

            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(zero, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_SECOND))).to.equal(true);
        });

        it('test unbounded range', () => {
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MONTH))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_WEEK))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_YEAR))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_HOUR))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_MINUTE))).to.equal(true);
            expect(RangeHandler.getInstance().is_right_open(TSRange.createNew(RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND))).to.equal(true);
        });
    });

    it('test get_ranges_according_to_segment_type', () => {
        expect(RangeHandler.getInstance().get_ranges_according_to_segment_type(null, null)).to.equal(null);
        expect(RangeHandler.getInstance().get_ranges_according_to_segment_type([
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ], TimeSegment.TYPE_DAY)).to.deep.equal([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)
        ]);

        // Le assign est juste à cause d'un pb de momentjs....
        let month_ranges = RangeHandler.getInstance().get_ranges_according_to_segment_type([
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ], TimeSegment.TYPE_MONTH);
        // month_ranges[0].max['_i'] = "2020-03-01";
        // month_ranges[0].max['_pf'].parsedDateParts = [2020, 2, 1];
        // month_ranges[0].min['_i'] = "2020-02-01";
        // // comprends pas le lien entre month_ranges[0].min['_pf'] et month_ranges[0].max['_pf']... mais sans ça c'est le même obj...
        // month_ranges[0].min['_pf'] = Object.create(month_ranges[0].min['_pf']);
        // month_ranges[0].min['_pf'].parsedDateParts = [2020, 1, 1];

        expect(month_ranges).to.deep.equal([
            TSRange.createNew(zero_startofmonth, zero_startofnextmonth, true, false, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('test get_all_segmented_elements_from_range', () => {

        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(null)).to.equal(null);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(TSRange.createNew(zero, zero, false, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(TSRange.createNew(zero, zero, false, true, NumSegment.TYPE_INT))).to.equal(null);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(TSRange.createNew(zero, zero, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(0, 0, true, true, 0))).to.deep.equal([0]);

        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.deep.equal([0, 1]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.deep.equal([1]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.deep.equal([0]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.deep.equal(null);

        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).to.deep.equal([-1, 0]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).to.deep.equal([0]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).to.deep.equal([-1]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).to.deep.equal(null);

        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal([-2, -1, 0, 1, 2]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT))).to.deep.equal([-1, 0, 1, 2]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT))).to.deep.equal([-2, -1, 0, 1]);
        expect(RangeHandler.getInstance().get_all_segmented_elements_from_range(NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT))).to.deep.equal([-1, 0, 1]);
    });

    // it('test get_all_segmented_elements_from_ranges', () => {

    //     expect(RangeHandler.getInstance().get_all_segmented_elements_from_ranges(null)).to.equal(null);
    // });

    it('test isValid', () => {

        expect(RangeHandler.getInstance().isValid(null)).to.equal(false);
        expect(RangeHandler.getInstance().isValid(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(RangeHandler.getInstance().isValid(NumRange.createNew(2, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test range_includes_ranges', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT);
        expect(RangeHandler.getInstance().range_includes_ranges(null, null)).to.equal(true);
        expect(RangeHandler.getInstance().range_includes_ranges(numRange1, [numRange2, numRange3])).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_ranges(numRange2, [numRange1, numRange3])).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_ranges(numRange2, [numRange3])).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_ranges(numRange3, [numRange2])).to.equal(false);
    });

    it('test range_includes_range', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT);
        expect(RangeHandler.getInstance().range_includes_range(null, null)).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_range(numRange1, numRange2)).to.equal(true);
        expect(RangeHandler.getInstance().range_includes_range(numRange1, numRange3)).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_range(numRange2, numRange1)).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_range(numRange2, numRange3)).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_range(numRange3, numRange2)).to.equal(false);
        expect(RangeHandler.getInstance().range_includes_range(numRange3, numRange1)).to.equal(false);
    });



    it('test getCardinal', () => {
        expect(RangeHandler.getInstance().getCardinal(null)).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(1);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(2);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY))).to.equal(2);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY))).to.equal(1);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(5);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(4);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(4);
        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(moins_deux, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(3);

        expect(RangeHandler.getInstance().getCardinal(TSRange.createNew(Dates.startOf(zero, TimeSegment.TYPE_MONTH), Dates.endOf(zero, TimeSegment.TYPE_MONTH), true, true, TimeSegment.TYPE_MONTH), TimeSegment.TYPE_MONTH)).to.equal(1);
    });

    it('test elt_intersects_any_range', () => {
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_un, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(un, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);


        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(moins_zero_cinq, [TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)])).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)])).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_any_range(zero_cinq, [TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)])).to.equal(true);
    });

    it('test elt_intersects_range', () => {
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_un, TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(un, TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(moins_zero_cinq, TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().elt_intersects_range(zero_cinq, TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
    });

    it('test cloneFrom', () => {
        expect(RangeHandler.getInstance().cloneFrom(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(RangeHandler.getInstance().cloneFrom(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));
    });

    it('test createNew', () => {
        expect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(moins_un, moins_un, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(moins_un, moins_un, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(moins_un, moins_un, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(un, un, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(un, un, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(un, un, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY));

        expect(TSRange.createNew(zero_cinq, zero, false, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, true, true, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, true, false, TimeSegment.TYPE_DAY)).to.equal(null);
        expect(TSRange.createNew(zero_cinq, zero, false, false, TimeSegment.TYPE_DAY)).to.equal(null);

        expect(TSRange.createNew(zero_cinq, bidon, false, false, TimeSegment.TYPE_DAY)).to.deep.equal(TSRange.createNew(un, bidon, true, false, TimeSegment.TYPE_DAY));
    });

    it('test foreach', async () => {
        let res: number[] = [];
        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            zero
        ]);

        res = [];
        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];
        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];
        await await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            zero
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            un
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            zero,
            un
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            moins_un,
            zero,
            un
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            moins_un,
            zero
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
            moins_un
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([

            zero
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([]);






        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([
            zero,
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([
            zero,
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, zero, zero);
        expect(res).to.deep.equal([
            zero,
        ]);


        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            moins_un,
            zero]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            moins_un,
            zero]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            moins_un
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([
            zero
        ]);

        res = [];

        await RangeHandler.getInstance().foreach(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), (date: number) => {
            res.push(date);
        }, TimeSegment.TYPE_DAY, moins_un, zero);
        expect(res).to.deep.equal([]);
    });

    it('test foreach_ranges', async () => {
        let res: number[] = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([

            zero
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY)], (date: number) => {
            res.push(date);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY)], (date: number) => {
                res.push(date);
            });
        expect(res).to.deep.equal([

            zero
        ]);

        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY)], (date: number) => {
                res.push(date);
            });
        expect(res).to.deep.equal([

            zero,
            un
        ]);


        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY)], (date: number) => {
                res.push(date);
            });
        expect(res).to.deep.equal([

            zero,
            un,
            zero,
            un
        ]);


        res = [];

        await RangeHandler.getInstance().foreach_ranges([
            TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)], (date: number) => {
                res.push(date);
            });
        expect(res).to.deep.equal([

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

    it('test getFormattedMaxForAPI', () => {
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal('' + un);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal('' + moins_un);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(moins_deux, zero, true, false, TimeSegment.TYPE_DAY))).to.equal('' + zero);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMaxForAPI(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
    });

    it('test getFormattedMinForAPI', () => {
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal('' + un);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal('' + moins_deux);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal('' + zero);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getFormattedMinForAPI(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY))).to.equal('' + moins_un);
    });

    it('test getCardinalFromArray', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().getCardinalFromArray(null)).to.equal(null);
        expect(RangeHandler.getInstance().getCardinalFromArray([numRange1, numRange3])).to.equal(5);
        expect(RangeHandler.getInstance().getCardinalFromArray([numRange2, numRange1])).to.equal(4);
        expect(RangeHandler.getInstance().getCardinalFromArray([numRange2, numRange3])).to.equal(3);
    });

    it('test getMinSurroundingRange', () => {
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY));

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);







        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);





        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);

        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
        expect(RangeHandler.getInstance().getMinSurroundingRange([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal({
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange);
    });

    it('test getRangesUnion', () => {
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY
        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([
            {
                min: moins_un,
                min_inclusiv: true,
                max: zero,
                max_inclusiv: false,
                range_type: 2,
                segment_type: TimeSegment.TYPE_DAY

            } as TSRange, {
                min: un,
                min_inclusiv: true,
                max: deux,
                max_inclusiv: false,
                range_type: 2,
                segment_type: TimeSegment.TYPE_DAY

            } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: zero,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(null);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);







        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)]
        );

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            null
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
        );

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            null
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
        );

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY)]
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            null
        );
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, moins_zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal(
            [TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY)]
        );





        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, true, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, true, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);

        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: deux,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: zero,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
        expect(RangeHandler.getInstance().getRangesUnion([TSRange.createNew(moins_zero_cinq, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero_cinq, false, false, TimeSegment.TYPE_DAY)])).to.deep.equal([{
            min: moins_un,
            min_inclusiv: true,
            max: un,
            max_inclusiv: false,
            range_type: 2,
            segment_type: TimeSegment.TYPE_DAY

        } as TSRange]);
    });

    it('test getSegmentedMax', () => {

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq_plus_un).utc(false).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq).utc().format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq_plus_un).utc(false).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq).utc().format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).to.equal(null);
    });

    it('test getSegmentedMax_from_ranges', () => {
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(un).utc(false).startOf('day').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));


        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_plus_un).utc(false).startOf('hour').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMax_from_ranges([
            TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    });

    it('test getSegmentedMin', () => {

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moment.unix(zero).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moment.unix(zero).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(null);
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(zero).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(zero).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(zero).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(zero).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq_moins_un).utc(false).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq_moins_un).utc().format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, true, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq).utc(false).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, false, false, TimeSegment.TYPE_HOUR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero_cinq).utc().format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm')).to.deep.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm')).to.deep.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_YEAR)), 'Y-MM-DD HH:mm')).to.deep.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY)), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(zero).utc().startOf('day').unix()).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY))).to.deep.equal(null);

        // le test unitaire qui marche pas le 31/12 après midi ou le 01/01 avant midi...
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(moins_un).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR), 'Y-MM-DD HH:mm')).to.deep.equal(moment.unix(moment.unix(zero).utc().startOf('year').unix()).format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TimeSegment.TYPE_YEAR)).to.deep.equal(null);
    });

    it('test getSegmentedMin_from_ranges', () => {
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero).utc().startOf('day').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY)
        ])).to.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(moins_un).utc().startOf('day').format('Y-MM-DD HH:mm'));


        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq_plus_un, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));

        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ])).to.equal(null);
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq).utc().startOf('hour').format('Y-MM-DD HH:mm'));

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
        expect(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, false, false, TimeSegment.TYPE_HOUR)
        ])).to.equal(null);

        expect(Dates.format(RangeHandler.getInstance().getSegmentedMin_from_ranges([
            TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR), TSRange.createNew(zero_cinq_moins_un, zero_cinq, true, true, TimeSegment.TYPE_HOUR)
        ]), 'Y-MM-DD HH:mm')).to.equal(moment.unix(zero_cinq_moins_un).utc().startOf('hour').format('Y-MM-DD HH:mm'));
    });

    it('test isEndABeforeEndB_optimized_normalized', () => {
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isEndABeforeStartB_optimized_normalized', () => {
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isEndASameEndB_optimized_normalized', () => {
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartABeforeStartB_optimized_normalized', () => {
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartASameStartB_optimized_normalized', () => {
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);



        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB_optimized_normalized(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });


    it('test isEndABeforeEndB', () => {
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isEndABeforeStartB', () => {
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isEndASameEndB', () => {
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isEndASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartABeforeEndB', () => {
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);



        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartABeforeStartB', () => {
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartABeforeStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartASameEndB', () => {
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameEndB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test isStartASameStartB', () => {
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);




        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_deux, moins_un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);



        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().isStartASameStartB(TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(moins_un, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test create_single_elt_range', () => {

        let numRange1 = NumRange.createNew(6, 7, true, false, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().create_single_elt_range(null, null, null)).to.equal(null);
        expect(RangeHandler.getInstance().create_single_elt_range(1, 6, 0)).to.deep.equal(numRange1);
        expect(RangeHandler.getInstance().create_single_elt_range(1, 1, 0)).to.deep.equal(numRange2);
        expect(RangeHandler.getInstance().create_single_elt_range(1, 0, 0)).to.deep.equal(numRange3);
    });

    it('test is_elt_inf_min', () => {
        expect(RangeHandler.getInstance().is_elt_inf_min(null, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(null, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_inf_min(moins_deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);
    });

    it('test is_elt_sup_max', () => {
        expect(RangeHandler.getInstance().is_elt_sup_max(null, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(null, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(zero, TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_un, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().is_elt_sup_max(moins_deux, TSRange.createNew(moins_un, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test cloneArrayFrom', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        let numRange1Bis = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2Bis = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3Bis = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().cloneArrayFrom(null)).to.equal(null);
        expect(RangeHandler.getInstance().cloneArrayFrom([numRange1])).to.deep.equal([numRange1]);
        expect(RangeHandler.getInstance().cloneArrayFrom([numRange1, numRange2])).to.deep.equal([numRange1Bis, numRange2Bis]);
        expect(RangeHandler.getInstance().cloneArrayFrom([numRange1, numRange2, numRange3])).to.deep.equal([numRange1Bis, numRange3Bis, numRange2Bis]);
    });

    it('test getIndex', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().getIndex(null)).to.equal(null);
        expect(RangeHandler.getInstance().getIndex(numRange1)).to.equal("[0,3)");
        expect(RangeHandler.getInstance().getIndex(numRange2)).to.equal("[3,4)");
        expect(RangeHandler.getInstance().getIndex(numRange3)).to.equal("[2,4)");
    });

    it('test humanize', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().humanize(null)).to.equal(null);
        expect(RangeHandler.getInstance().humanize(numRange1)).to.equal("[0,3)");
        expect(RangeHandler.getInstance().humanize(numRange2)).to.equal("[3,4)");
        expect(RangeHandler.getInstance().humanize(numRange3)).to.equal("[2,4)");
    });

    it('test getIndexRanges', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().getIndexRanges(null)).to.equal(null);
        expect(RangeHandler.getInstance().getIndexRanges([numRange1, numRange3])).to.equal("[[0,3),[2,4)]");
        expect(RangeHandler.getInstance().getIndexRanges([numRange2, numRange1])).to.equal("[[0,3),[3,4)]");
        expect(RangeHandler.getInstance().getIndexRanges([numRange2, numRange3])).to.equal("[[2,4),[3,4)]");
    });

    it('test humanizeRanges', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().humanizeRanges(null)).to.equal(null);
        expect(RangeHandler.getInstance().humanizeRanges([numRange1, numRange3])).to.equal("[[0,3),[2,4)]");
        expect(RangeHandler.getInstance().humanizeRanges([numRange2, numRange1])).to.equal("[[3,4),[0,3)]");
        expect(RangeHandler.getInstance().humanizeRanges([numRange2, numRange3])).to.equal("[[3,4),[2,4)]");
    });

    it('test ranges_intersect_themselves', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().ranges_intersect_themselves(null)).to.equal(false);
        expect(RangeHandler.getInstance().ranges_intersect_themselves([numRange1, numRange3])).to.equal(true);
        expect(RangeHandler.getInstance().ranges_intersect_themselves([numRange2, numRange1])).to.equal(false);
        expect(RangeHandler.getInstance().ranges_intersect_themselves([numRange2, numRange3])).to.equal(true);
    });

    it('test any_range_intersects_any_range', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT);
        let numRange4 = NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().any_range_intersects_any_range(null, null)).to.equal(false);
        expect(RangeHandler.getInstance().any_range_intersects_any_range([numRange1, numRange2], [numRange3, numRange4])).to.equal(true);
        expect(RangeHandler.getInstance().any_range_intersects_any_range([numRange1, numRange3], [numRange2, numRange4])).to.equal(false);
        expect(RangeHandler.getInstance().any_range_intersects_any_range([numRange2, numRange3], [numRange1, numRange4])).to.equal(true);
    });

    it('test get_ranges_any_range_intersects_any_range', () => {

        let numRange1 = NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT);
        let numRange2 = NumRange.createNew(2, 4, false, false, NumSegment.TYPE_INT);
        let numRange3 = NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT);
        let numRange4 = NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT);

        expect(RangeHandler.getInstance().get_ranges_any_range_intersects_any_range(null, null)).to.equal(null);
        expect(RangeHandler.getInstance().get_ranges_any_range_intersects_any_range([numRange1, numRange2], [numRange3, numRange4])).to.deep.equal([numRange1, numRange2]);
        expect(RangeHandler.getInstance().get_ranges_any_range_intersects_any_range([numRange1, numRange3], [numRange2, numRange4])).to.deep.equal(null);
        expect(RangeHandler.getInstance().get_ranges_any_range_intersects_any_range([numRange2, numRange3], [numRange1, numRange4])).to.deep.equal([numRange2, numRange3]);
    });

    it('test range_intersects_range', () => {
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });


    it('test range_intersects_range_optimized_normalized', () => {
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().range_intersects_range_optimized_normalized(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });

    it('test range_intersects_any_range', () => {
        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY)
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY)
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);




        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);



        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(true);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);

        expect(RangeHandler.getInstance().range_intersects_any_range(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), [
            TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY),
            TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY),
        ])).to.equal(false);
    });

    it('test ranges_are_contiguous_or_intersect', () => {
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero, zero, true, true, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(moins_zero_cinq, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(un, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(true);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, un, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, deux, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(true);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, true, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, true, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);

        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, true, false, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, true, TimeSegment.TYPE_DAY))).to.equal(false);
        expect(RangeHandler.getInstance().ranges_are_contiguous_or_intersect(TSRange.createNew(zero, zero_cinq, false, false, TimeSegment.TYPE_DAY), TSRange.createNew(zero_cinq, un, false, false, TimeSegment.TYPE_DAY))).to.equal(false);
    });
});
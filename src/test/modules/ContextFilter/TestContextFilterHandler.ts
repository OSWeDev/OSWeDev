import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, assert } from 'chai';
import 'mocha';
import ContextFilterHandler from '../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import RangeHandler from '../../../shared/tools/RangeHandler';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';

describe('TestContextFilterHandler: assert_context_filter_root_is_valid_and_get_filters', () => {
    it('should throw an error if context_filter_root is null', () => {
        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](null, 1)).to.throw('ContextFilterVO is null');
    });

    it('should throw an error if there are too many year filters', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(2020, NumSegment.TYPE_INT)];
        const andFilter = new ContextFilterVO();
        andFilter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        andFilter.left_hook = yearFilter;
        andFilter.right_hook = yearFilter;

        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_SECOND)).to.throw('Too many year filters');
    });

    it('should throw an error if there are too many month filters', () => {
        const monthFilter = new ContextFilterVO();
        monthFilter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        monthFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(8, NumSegment.TYPE_INT)];
        const andFilter = new ContextFilterVO();
        andFilter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        andFilter.left_hook = monthFilter;
        andFilter.right_hook = monthFilter;

        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_YEAR)).to.not.throw();
        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_SECOND)).to.throw('Too many month filters');
    });

    it('should throw an error if there are too many hour filters', () => {
        const hourFilter = new ContextFilterVO();
        hourFilter.filter_type = ContextFilterVO.TYPE_HOUR_INTERSECTS;
        hourFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(20, NumSegment.TYPE_INT)];
        const andFilter = new ContextFilterVO();
        andFilter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        andFilter.left_hook = hourFilter;
        andFilter.right_hook = hourFilter;

        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_YEAR)).to.not.throw();
        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_SECOND)).to.throw('Too many hour filters');
    });

    it('should throw an error if there are too many minute filters', () => {
        const minuteFilter = new ContextFilterVO();
        minuteFilter.filter_type = ContextFilterVO.TYPE_MINUTE_INTERSECTS;
        minuteFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(15, NumSegment.TYPE_INT)];
        const andFilter = new ContextFilterVO();
        andFilter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        andFilter.left_hook = minuteFilter;
        andFilter.right_hook = minuteFilter;

        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_YEAR)).to.not.throw();
        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_SECOND)).to.throw('Too many minute filters');
    });

    it('should throw an error if there are too many second filters', () => {
        const secondFilter = new ContextFilterVO();
        secondFilter.filter_type = ContextFilterVO.TYPE_SECOND_INTERSECTS;
        secondFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(20, NumSegment.TYPE_INT)];
        const andFilter = new ContextFilterVO();
        andFilter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        andFilter.left_hook = secondFilter;
        andFilter.right_hook = secondFilter;

        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_YEAR)).to.not.throw();
        expect(() => ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_SECOND)).to.throw('Too many second filters');
    });


    // Add more test cases for other error scenarios

    it('should return the correct filters', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(2020, NumSegment.TYPE_INT)];

        const monthFilter = new ContextFilterVO();
        monthFilter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        monthFilter.param_numranges = [RangeHandler.create_single_elt_NumRange(2, NumSegment.TYPE_INT)];

        const andFilter = new ContextFilterVO();
        andFilter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        andFilter.left_hook = yearFilter;
        andFilter.right_hook = monthFilter;

        const result = ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](andFilter, TimeSegment.TYPE_MONTH);

        expect(result).to.deep.equal({
            year_filter: yearFilter,
            month_filter: monthFilter,
            hour_filter: null,
            minute_filter: null,
            second_filter: null
        });
    });

    it('should return the correct filters - cas reel 1', () => {
        const left_hook = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":43,"param_numranges":[{"range_type":1,"max":2024,"max_inclusiv":false,"min":2023,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );
        const right_hook = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":42,"param_numranges":[{"range_type":1,"max":5,"max_inclusiv":false,"min":4,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );
        const root_filter = Object.assign(
            new ContextFilterVO(),
            {
                left_hook: left_hook,
                right_hook: right_hook
            },
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"vo_type":"__custom_filters__","field_id":"Dates","filter_type":1}')
        );

        const result = ContextFilterHandler.getInstance()['assert_context_filter_root_is_valid_and_get_filters'](root_filter, TimeSegment.TYPE_MINUTE);

        expect(result).to.deep.equal({
            year_filter: left_hook,
            month_filter: right_hook,
            hour_filter: null,
            minute_filter: null,
            second_filter: null
        });
    });


    // Add more test cases for various combinations of filters
});

describe('TestContextFilterHandler: get_ts_ranges_from_year_filter', () => {
    it('should return the correct ranges 1', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.create_single_elt_NumRange(2020, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2021, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2022, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 3, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 2', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 2020, 2022, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 3, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 3', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.create_single_elt_NumRange(2020, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2021, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2022, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 3, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 4', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 2020, 2022, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 3, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 5', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.create_single_elt_NumRange(2020, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2021, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2022, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 1, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 6', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 2020, 2022, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 1, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 7', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.create_single_elt_NumRange(2020, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2021, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_NumRange(2022, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 1, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges 8', () => {
        const yearFilter = new ContextFilterVO();
        yearFilter.filter_type = ContextFilterVO.TYPE_DATE_YEAR;
        yearFilter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 2020, 2022, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 1, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ]);
    });

    it('should return the correct ranges - cas reel 1', () => {
        const yearFilter = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":43,"param_numranges":[{"range_type":1,"max":2024,"max_inclusiv":false,"min":2023,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_year_filter'](yearFilter, 10, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1672531200, TimeSegment.TYPE_YEAR)
        ]);
    });

});

describe('TestContextFilterHandler: get_filter_ts_ranges_month_from_year', () => {
    it('should return the correct ranges 1', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 3, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 3, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1580515200, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1583020800, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 2', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 3, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 3, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1646092800, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1643673600, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 3', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 3, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1580515200, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 4', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 3, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1643673600, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1612137600, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 5', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 1, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 6', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 1, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1643673600, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges - cas reel 1', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1672531200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":42,"param_numranges":[{"range_type":1,"max":5,"max_inclusiv":false,"min":4,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_month_from_year'](year_ts_ranges, month_filter, 10, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1680307200, TimeSegment.TYPE_MONTH)
        ]);
    });

});

describe('TestContextFilterHandler: get_filter_ts_ranges_day_from_month', () => {
    it('should return the correct ranges 1', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 3, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 3, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1580515200, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1583020800, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 2', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 3, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 3, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1646092800, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1643673600, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 3', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 3, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1580515200, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 4', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 3, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1643673600, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_MONTH),
            RangeHandler.create_single_elt_TSRange(1612137600, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 5', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 1, true);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges 6', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1577836800, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1609459200, TimeSegment.TYPE_YEAR),
            RangeHandler.create_single_elt_TSRange(1640995200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = new ContextFilterVO();
        month_filter.filter_type = ContextFilterVO.TYPE_DATE_MONTH;
        month_filter.param_numranges = [
            RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 2, true, true, NumSegment.TYPE_INT)
        ];

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 1, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1643673600, TimeSegment.TYPE_MONTH)
        ]);
    });

    it('should return the correct ranges - cas reel 1', () => {

        const year_ts_ranges: TSRange[] = [
            RangeHandler.create_single_elt_TSRange(1672531200, TimeSegment.TYPE_YEAR)
        ];

        const month_filter = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":42,"param_numranges":[{"range_type":1,"max":5,"max_inclusiv":false,"min":4,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );

        const result = ContextFilterHandler.getInstance()['get_filter_ts_ranges_day_from_month'](year_ts_ranges, month_filter, 10, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1680307200, TimeSegment.TYPE_MONTH)
        ]);
    });

});


describe('TestContextFilterHandler: get_ts_ranges_from_context_filter_root', () => {
    it('Test cas reel 1', () => {

        const left_hook = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":43,"param_numranges":[{"range_type":1,"max":2024,"max_inclusiv":false,"min":2023,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );
        const right_hook = Object.assign(
            new ContextFilterVO(),
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"filter_type":42,"param_numranges":[{"range_type":1,"max":5,"max_inclusiv":false,"min":4,"min_inclusiv":true,"segment_type":0}],"vo_type":"__custom_filters__","field_id":"Dates"}')
        );
        const root_filter = Object.assign(
            new ContextFilterVO(),
            {
                left_hook: left_hook,
                right_hook: right_hook
            },
            JSON.parse('{"_type":"context_filter","text_ignore_case":true,"sub_query":null,"vo_type":"__custom_filters__","field_id":"Dates","filter_type":1}')
        );

        const result = ContextFilterHandler.getInstance()['get_ts_ranges_from_context_filter_root'](root_filter, TimeSegment.TYPE_MINUTE, 10, false);

        expect(result).to.deep.equal([
            RangeHandler.create_single_elt_TSRange(1682899140, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682899080, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682899020, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898960, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898900, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898840, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898780, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898720, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898660, TimeSegment.TYPE_MINUTE),
            RangeHandler.create_single_elt_TSRange(1682898600, TimeSegment.TYPE_MINUTE)
        ]);
    });
});

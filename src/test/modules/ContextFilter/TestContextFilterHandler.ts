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

    // Add more test cases for various combinations of filters
});

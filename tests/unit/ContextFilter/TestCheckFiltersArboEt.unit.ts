import { test, expect } from "playwright-test-coverage";
import ContextFilterVO, { filter } from "../../../src/shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryServerController from "../../../src/server/modules/ContextFilter/ContextQueryServerController";
import ConsoleHandler from "../../../src/shared/tools/ConsoleHandler";
import ContextQueryVO, { query } from '../../../src/shared/modules/ContextFilter/vos/ContextQueryVO';
import UserVO from '../../../src/shared/modules/AccessPolicy/vos/UserVO';
import SortByVO from '../../../src/shared/modules/ContextFilter/vos/SortByVO';

let instance: ContextQueryServerController;
ConsoleHandler.init();

test('check_filters_arbo_ET: should do nothing when filter type is not TYPE_FILTER_AND', () => {
    instance = ContextQueryServerController.getInstance();
    let q_ = query(UserVO.API_TYPE_ID);

    const f_ = new ContextFilterVO();
    f_.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    q_.add_filters([f_]);

    instance['check_filters_arbo_ET'](q_);
    expect(q_.filters).toStrictEqual([f_]);
});

test('check_filters_arbo_ET: should do nothing if the base is an OR', () => {
    instance = ContextQueryServerController.getInstance();

    let filters = [
        filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'))
            .or(filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('b').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('a')))
    ];

    let context_query: ContextQueryVO = query(UserVO.API_TYPE_ID)
        .field('firstname').field('lastname')
        .add_filters(filters).set_sort(new SortByVO(UserVO.API_TYPE_ID, 'name', true));

    instance['check_filters_arbo_ET'](context_query);
    expect(context_query.filters).toStrictEqual(filters);
});


test('check_filters_arbo_ET: should change the filters to an array when simple AND', () => {
    instance = ContextQueryServerController.getInstance();
    let q_ = query(UserVO.API_TYPE_ID);

    const f_ = new ContextFilterVO();
    f_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
    const leftHook = new ContextFilterVO();
    leftHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    f_.left_hook = leftHook;
    const rightHook = new ContextFilterVO();
    rightHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    f_.right_hook = rightHook;
    q_.add_filters([f_]);

    instance['check_filters_arbo_ET'](q_);
    expect(q_.filters).toStrictEqual([leftHook, rightHook]);
});

test('check_filters_arbo_ET: should do nnothing when an error is detected', () => {
    instance = ContextQueryServerController.getInstance();
    let q_ = query(UserVO.API_TYPE_ID);

    const f_ = new ContextFilterVO();
    f_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
    const rightHook = new ContextFilterVO();
    rightHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    f_.right_hook = rightHook;
    q_.add_filters([f_]);

    instance['check_filters_arbo_ET'](q_);
    expect(q_.filters).toStrictEqual([f_]);
});
import { test, expect } from "playwright-test-coverage";
import ContextQueryServerController from "../../../src/server/modules/ContextFilter/ContextQueryServerController";
import UserVO from '../../../src/shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVO, { filter } from "../../../src/shared/modules/ContextFilter/vos/ContextFilterVO";
import ConsoleHandler from "../../../src/shared/tools/ConsoleHandler";

let instance: ContextQueryServerController;
ConsoleHandler.init();

test('QueryFilterVO: Build a simple tree with and', () => {
    instance = ContextQueryServerController;

    const f_ = filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'));

    expect(f_.filter_type).toStrictEqual(ContextFilterVO.TYPE_FILTER_AND);
    expect(f_.left_hook).toStrictEqual(filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a'));
    expect(f_.right_hook).toStrictEqual(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'));
});


test('QueryFilterVO: Build a simple tree with or', () => {
    instance = ContextQueryServerController;

    const f_ = filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').or(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'));

    expect(f_.filter_type).toStrictEqual(ContextFilterVO.TYPE_FILTER_OR);
    expect(f_.left_hook).toStrictEqual(filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a'));
    expect(f_.right_hook).toStrictEqual(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b'));
});

test('QueryFilterVO: Build a tree with and in and', () => {
    instance = ContextQueryServerController;

    const f_ =
        filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b')).and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('a'));

    expect(f_.filter_type).toStrictEqual(ContextFilterVO.TYPE_FILTER_AND);
    expect(f_.left_hook).toStrictEqual(filter(UserVO.API_TYPE_ID, 'firstname').by_text_eq('a').and(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('b')));
    expect(f_.right_hook).toStrictEqual(filter(UserVO.API_TYPE_ID, 'lastname').by_text_eq('a'));
});

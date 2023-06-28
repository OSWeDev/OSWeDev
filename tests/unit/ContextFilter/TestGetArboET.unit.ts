import { test, expect } from "playwright-test-coverage";
import ContextFilterVO from "../../../src/shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryServerController from "../../../src/server/modules/ContextFilter/ContextQueryServerController";
import ConsoleHandler from "../../../src/shared/tools/ConsoleHandler";

let instance: ContextQueryServerController;
ConsoleHandler.init();

test('get_arbo_ET: should return null when filter type is not TYPE_FILTER_AND', () => {
    instance = ContextQueryServerController.getInstance();
    const filter = new ContextFilterVO();
    filter.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    const result = instance['get_arbo_ET'](filter);
    expect(result).toBeNull();
});

test('get_arbo_ET: should return path when simple AND, and prioritize right (convention)', () => {
    instance = ContextQueryServerController.getInstance();
    const filter = new ContextFilterVO();
    filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
    const leftHook = new ContextFilterVO();
    leftHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    filter.left_hook = leftHook;
    const rightHook = new ContextFilterVO();
    rightHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    filter.right_hook = rightHook;
    const result = instance['get_arbo_ET'](filter);
    expect(result).toStrictEqual([]);
});

test('get_arbo_ET: should return null when an error is detected', () => {
    instance = ContextQueryServerController.getInstance();
    const filter = new ContextFilterVO();
    filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
    const rightHook = new ContextFilterVO();
    rightHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    filter.right_hook = rightHook;
    const result = instance['get_arbo_ET'](filter);
    expect(result).toStrictEqual(null);
});
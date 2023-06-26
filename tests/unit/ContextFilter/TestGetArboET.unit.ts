import { expect, test } from '@playwright/test';
import ContextFilterVO from "../../../src/shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryServerController from "../../../src/server/modules/ContextFilter/ContextQueryServerController";

let instance: ContextQueryServerController;

test('get_arbo_ET: should return null when filter type is not TYPE_FILTER_AND', () => {
    instance = ContextQueryServerController.getInstance();
    const filter = new ContextFilterVO();
    filter.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    const result = instance['get_arbo_ET'](filter);
    expect(result).toBeNull();
});

test('get_arbo_ET: should return path when left_hook returns a valid path', () => {
    instance = ContextQueryServerController.getInstance();
    const filter = new ContextFilterVO();
    filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
    const leftHook = new ContextFilterVO();
    leftHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    filter.left_hook = leftHook;
    const result = instance['get_arbo_ET'](filter);
    expect(result).toStrictEqual([true]);
});

test('get_arbo_ET: should return path when right_hook returns a valid path', () => {
    instance = ContextQueryServerController.getInstance();
    const filter = new ContextFilterVO();
    filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
    const rightHook = new ContextFilterVO();
    rightHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
    filter.right_hook = rightHook;
    const result = instance['get_arbo_ET'](filter);
    expect(result).toStrictEqual([false]);
});
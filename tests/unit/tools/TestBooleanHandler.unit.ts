import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();
import { test, expect } from "playwright-test-coverage";

import BooleanHandler from '../../../src/shared/tools/BooleanHandler';

test('BooleanHandler : test OR', () => {
    expect(BooleanHandler.OR(null)).toStrictEqual(false);
    expect(BooleanHandler.OR(null, false)).toStrictEqual(false);
    expect(BooleanHandler.OR(null, true)).toStrictEqual(true);
    expect(BooleanHandler.OR([], true)).toStrictEqual(true);
    expect(BooleanHandler.OR([], false)).toStrictEqual(false);
    expect(BooleanHandler.OR([])).toStrictEqual(false);

    expect(BooleanHandler.OR([true])).toStrictEqual(true);
    expect(BooleanHandler.OR([false])).toStrictEqual(false);

    expect(BooleanHandler.OR([true, true])).toStrictEqual(true);
    expect(BooleanHandler.OR([true, false])).toStrictEqual(true);
    expect(BooleanHandler.OR([false, true])).toStrictEqual(true);
    expect(BooleanHandler.OR([false, false])).toStrictEqual(false);

    expect(BooleanHandler.OR([true, true, true])).toStrictEqual(true);
    expect(BooleanHandler.OR([true, true, false])).toStrictEqual(true);
    expect(BooleanHandler.OR([true, false, true])).toStrictEqual(true);
    expect(BooleanHandler.OR([true, false, false])).toStrictEqual(true);
    expect(BooleanHandler.OR([false, true, true])).toStrictEqual(true);
    expect(BooleanHandler.OR([false, true, false])).toStrictEqual(true);
    expect(BooleanHandler.OR([false, false, true])).toStrictEqual(true);
    expect(BooleanHandler.OR([false, false, false])).toStrictEqual(false);
});

test('BooleanHandler : test AND', () => {
    expect(BooleanHandler.AND(null)).toStrictEqual(false);
    expect(BooleanHandler.AND(null, false)).toStrictEqual(false);
    expect(BooleanHandler.AND(null, true)).toStrictEqual(true);
    expect(BooleanHandler.AND([], true)).toStrictEqual(true);
    expect(BooleanHandler.AND([], false)).toStrictEqual(false);
    expect(BooleanHandler.AND([])).toStrictEqual(false);

    expect(BooleanHandler.AND([true])).toStrictEqual(true);
    expect(BooleanHandler.AND([false])).toStrictEqual(false);

    expect(BooleanHandler.AND([true, true])).toStrictEqual(true);
    expect(BooleanHandler.AND([true, false])).toStrictEqual(false);
    expect(BooleanHandler.AND([false, true])).toStrictEqual(false);
    expect(BooleanHandler.AND([false, false])).toStrictEqual(false);

    expect(BooleanHandler.AND([true, true, true])).toStrictEqual(true);
    expect(BooleanHandler.AND([true, true, false])).toStrictEqual(false);
    expect(BooleanHandler.AND([true, false, true])).toStrictEqual(false);
    expect(BooleanHandler.AND([true, false, false])).toStrictEqual(false);
    expect(BooleanHandler.AND([false, true, true])).toStrictEqual(false);
    expect(BooleanHandler.AND([false, true, false])).toStrictEqual(false);
    expect(BooleanHandler.AND([false, false, true])).toStrictEqual(false);
    expect(BooleanHandler.AND([false, false, false])).toStrictEqual(false);
});
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();
import { test, expect } from "playwright-test-coverage";

import BooleanHandler from '../../../src/shared/tools/BooleanHandler';

test('BooleanHandler : test OR', () => {
    expect(BooleanHandler.getInstance().OR(null)).toStrictEqual(false);
    expect(BooleanHandler.getInstance().OR(null, false)).toStrictEqual(false);
    expect(BooleanHandler.getInstance().OR(null, true)).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([], true)).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([], false)).toStrictEqual(false);
    expect(BooleanHandler.getInstance().OR([])).toStrictEqual(false);

    expect(BooleanHandler.getInstance().OR([true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false])).toStrictEqual(false);

    expect(BooleanHandler.getInstance().OR([true, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([true, false])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false, false])).toStrictEqual(false);

    expect(BooleanHandler.getInstance().OR([true, true, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([true, true, false])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([true, false, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([true, false, false])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false, true, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false, true, false])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false, false, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().OR([false, false, false])).toStrictEqual(false);
});

test('BooleanHandler : test AND', () => {
    expect(BooleanHandler.getInstance().AND(null)).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND(null, false)).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND(null, true)).toStrictEqual(true);
    expect(BooleanHandler.getInstance().AND([], true)).toStrictEqual(true);
    expect(BooleanHandler.getInstance().AND([], false)).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([])).toStrictEqual(false);

    expect(BooleanHandler.getInstance().AND([true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().AND([false])).toStrictEqual(false);

    expect(BooleanHandler.getInstance().AND([true, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().AND([true, false])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([false, true])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([false, false])).toStrictEqual(false);

    expect(BooleanHandler.getInstance().AND([true, true, true])).toStrictEqual(true);
    expect(BooleanHandler.getInstance().AND([true, true, false])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([true, false, true])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([true, false, false])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([false, true, true])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([false, true, false])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([false, false, true])).toStrictEqual(false);
    expect(BooleanHandler.getInstance().AND([false, false, false])).toStrictEqual(false);
});
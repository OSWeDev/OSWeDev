import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import TypesHandler from '../../../src/shared/tools/TypesHandler';
import moment from 'moment';

test('TypesHandler : test isMoment', () => {
    expect(TypesHandler.getInstance().isMoment(moment())).toStrictEqual(true);
    expect(TypesHandler.getInstance().isMoment("notAMoment")).toStrictEqual(false);
    expect(TypesHandler.getInstance().isMoment(null)).toStrictEqual(null);
});
test('TypesHandler : test isDuration', () => {
    expect(TypesHandler.getInstance().isDuration(moment.duration())).toStrictEqual(true);
    expect(TypesHandler.getInstance().isDuration("notADuration")).toStrictEqual(false);
    expect(TypesHandler.getInstance().isDuration(null)).toStrictEqual(null);
});
test('TypesHandler : test isBoolean', () => {
    expect(TypesHandler.getInstance().isBoolean(true)).toStrictEqual(true);
    expect(TypesHandler.getInstance().isBoolean("notABoolean")).toStrictEqual(false);
    expect(TypesHandler.getInstance().isBoolean(null)).toStrictEqual(null);
});
test('TypesHandler : test isString', () => {
    expect(TypesHandler.getInstance().isString("String")).toStrictEqual(true);
    expect(TypesHandler.getInstance().isString(0)).toStrictEqual(false);
    expect(TypesHandler.getInstance().isString(null)).toStrictEqual(null);
});
test('TypesHandler : test isNumber', () => {
    expect(TypesHandler.getInstance().isNumber(0)).toStrictEqual(true);
    expect(TypesHandler.getInstance().isNumber("notANumber")).toStrictEqual(false);
    expect(TypesHandler.getInstance().isNumber(null)).toStrictEqual(null);
});
test('TypesHandler : test isArray', () => {
    expect(TypesHandler.getInstance().isArray([])).toStrictEqual(true);
    expect(TypesHandler.getInstance().isArray("notAnArray")).toStrictEqual(false);
    expect(TypesHandler.getInstance().isArray(null)).toStrictEqual(null);
});
test('TypesHandler : test isNull', () => {
    expect(TypesHandler.getInstance().isNull(null)).toStrictEqual(true);
    expect(TypesHandler.getInstance().isNull("notNull")).toStrictEqual(false);
});
/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import MainAggregateOperatorsHandlers from '../../../src/shared/modules/Var/MainAggregateOperatorsHandlers';

test('MainAggregateOperatorsHandlers: test aggregateValues_SUM', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1, null])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0, 10])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1, 10])).toStrictEqual(9);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1, 10])).toStrictEqual(11);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null, 10])).toStrictEqual(10);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0, 10, 0.5])).toStrictEqual(10.5);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1, 10, 0.5])).toStrictEqual(9.5);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1, 10, 0.5])).toStrictEqual(11.5);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null, 10, 0.5])).toStrictEqual(10.5);
});

test('MainAggregateOperatorsHandlers: test aggregateValues_TIMES', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1, null])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0, 10])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1, 10])).toStrictEqual(-10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1, 10])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null, 10])).toStrictEqual(10);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0, 10, 0.5])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1, 10, 0.5])).toStrictEqual(-5);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1, 10, 0.5])).toStrictEqual(5);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null, 10, 0.5])).toStrictEqual(5);
});

test('MainAggregateOperatorsHandlers: test aggregateValues_XOR', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1, 10])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1, 10])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null, 10])).toStrictEqual(1);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0, 10, 0.5])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null, 10, 0.5])).toStrictEqual(0);
});

test('MainAggregateOperatorsHandlers: test aggregateValues_OR', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null, 10])).toStrictEqual(1);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null, 10, 0.5])).toStrictEqual(1);
});

test('MainAggregateOperatorsHandlers: test aggregateValues_AND', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0, 10])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null, 10])).toStrictEqual(1);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0, 10, 0.5])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1, 10, 0.5])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null, 10, 0.5])).toStrictEqual(1);
});

test('MainAggregateOperatorsHandlers: test aggregateValues_MIN', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1, null])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0, 10])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1, 10])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1, 10])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null, 10])).toStrictEqual(10);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0, 10, 0.5])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1, 10, 0.5])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1, 10, 0.5])).toStrictEqual(0.5);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null, 10, 0.5])).toStrictEqual(0.5);
});

test('MainAggregateOperatorsHandlers: test aggregateValues_MAX', async () => {

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([])).toStrictEqual(undefined);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0, null])).toStrictEqual(0);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1, null])).toStrictEqual(-1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1, null])).toStrictEqual(1);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null, null])).toStrictEqual(null);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0, 10])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1, 10])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1, 10])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null, 10])).toStrictEqual(10);

    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0, 10, 0.5])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1, 10, 0.5])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1, 10, 0.5])).toStrictEqual(10);
    expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null, 10, 0.5])).toStrictEqual(10);
});
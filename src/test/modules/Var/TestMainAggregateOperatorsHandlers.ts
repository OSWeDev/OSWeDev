/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import MainAggregateOperatorsHandlers from '../../../shared/modules/Var/MainAggregateOperatorsHandlers';

describe('MainAggregateOperatorsHandlers', () => {

    it('test aggregateValues_SUM', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1, null])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0, 10])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1, 10])).to.equal(9);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1, 10])).to.equal(11);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null, 10])).to.equal(10);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([0, 10, 0.5])).to.equal(10.5);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([-1, 10, 0.5])).to.equal(9.5);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([1, 10, 0.5])).to.equal(11.5);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM([null, 10, 0.5])).to.equal(10.5);
    });

    it('test aggregateValues_TIMES', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1, null])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0, 10])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1, 10])).to.equal(-10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1, 10])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null, 10])).to.equal(10);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([0, 10, 0.5])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([-1, 10, 0.5])).to.equal(-5);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([1, 10, 0.5])).to.equal(5);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES([null, 10, 0.5])).to.equal(5);
    });

    it('test aggregateValues_XOR', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1, 10])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1, 10])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null, 10])).to.equal(1);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([0, 10, 0.5])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([-1, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([1, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR([null, 10, 0.5])).to.equal(0);
    });

    it('test aggregateValues_OR', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null, 10])).to.equal(1);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([0, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([-1, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([1, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR([null, 10, 0.5])).to.equal(1);
    });

    it('test aggregateValues_AND', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0, 10])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null, 10])).to.equal(1);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([0, 10, 0.5])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([-1, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([1, 10, 0.5])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND([null, 10, 0.5])).to.equal(1);
    });

    it('test aggregateValues_MIN', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1, null])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0, 10])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1, 10])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1, 10])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null, 10])).to.equal(10);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([0, 10, 0.5])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([-1, 10, 0.5])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([1, 10, 0.5])).to.equal(0.5);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN([null, 10, 0.5])).to.equal(0.5);
    });

    it('test aggregateValues_MAX', async () => {

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([])).to.equal(undefined);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0, null])).to.equal(0);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1, null])).to.equal(-1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1, null])).to.equal(1);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null, null])).to.equal(null);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0, 10])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1, 10])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1, 10])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null, 10])).to.equal(10);

        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([0, 10, 0.5])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([-1, 10, 0.5])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([1, 10, 0.5])).to.equal(10);
        expect(MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX([null, 10, 0.5])).to.equal(10);
    });
});
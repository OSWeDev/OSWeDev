import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import WeightHandler from '../../../src/shared/tools/WeightHandler';

test('WeightHandler : test: sortByWeight', () => {
    let a = { weight: 1 };
    let b = { weight: 2 };
    let c = { weight: 3 };

    let arrayTest = [a, b, c];
    WeightHandler.getInstance().sortByWeight(arrayTest);
    expect(arrayTest).toStrictEqual([a, b, c]);

    arrayTest = [b, a];
    WeightHandler.getInstance().sortByWeight(arrayTest);
    expect(arrayTest).toStrictEqual([a, b]);

    arrayTest = [c, b, a];
    WeightHandler.getInstance().sortByWeight(arrayTest);
    expect(arrayTest).toStrictEqual([a, b, c]);

    arrayTest = [a, a, a];
    WeightHandler.getInstance().sortByWeight(arrayTest);
    expect(arrayTest).toStrictEqual([a, a, a]);

    arrayTest = null;
    WeightHandler.getInstance().sortByWeight(arrayTest);
    expect(arrayTest).toStrictEqual(null);

});

test('WeightHandler : test: findNextHeavierItemByWeight', () => {
    let a = { weight: 1 };
    let b = { weight: 2 };
    let c = { weight: 3 };
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight(null, null)).toStrictEqual(null);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], null)).toStrictEqual(null);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight(null, 1)).toStrictEqual(null);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 2)).toStrictEqual(c);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 1)).toStrictEqual(b);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 0)).toStrictEqual(a);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], -5)).toStrictEqual(a);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 1000)).toStrictEqual(null);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([b, b, b], 2)).toStrictEqual(null);
    expect(WeightHandler.getInstance().findNextHeavierItemByWeight([c, c, c], 2)).toStrictEqual(c);

});
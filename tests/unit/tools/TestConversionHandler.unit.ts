import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import ConversionHandler from '../../../src/shared/tools/ConversionHandler';

test('ConversionHandler: test forceNumber', () => {
    expect(ConversionHandler.forceNumber(1)).toStrictEqual(1);
    expect(ConversionHandler.forceNumber('1')).toStrictEqual(1);
    expect(ConversionHandler.forceNumber(49.5)).toStrictEqual(49.5);
    expect(ConversionHandler.forceNumber('49.5')).toStrictEqual(49.5);
    expect(ConversionHandler.forceNumber(null)).toStrictEqual(null);
    expect(ConversionHandler.forceNumber("notANumber")).toStrictEqual(null);
    /*expect(ConversionHandler.forceNumber('49,5')).toStrictEqual(49.5);*/
});
test('ConversionHandler: test forceNumbers', () => {
    expect(ConversionHandler.forceNumbers(null)).toStrictEqual(null);
    expect(ConversionHandler.forceNumbers([])).toStrictEqual(null);
    expect(ConversionHandler.forceNumbers([1, 2, 3])).toStrictEqual([1, 2, 3]);
    expect(ConversionHandler.forceNumbers(['1', '2', '3'])).toStrictEqual([1, 2, 3]);
    expect(ConversionHandler.forceNumbers([1.25, 2, 3])).toStrictEqual([1.25, 2, 3]);
    expect(ConversionHandler.forceNumbers(['1.25', '2', '3'])).toStrictEqual([1.25, 2, 3]);
    expect(ConversionHandler.forceNumbers(["notANumber"])).toStrictEqual([null]);
    expect(ConversionHandler.forceNumbers(["notANumber", 3])).toStrictEqual([null, 3]);
    expect(ConversionHandler.forceNumbers([1, "2"])).toStrictEqual([1, 2]);
});

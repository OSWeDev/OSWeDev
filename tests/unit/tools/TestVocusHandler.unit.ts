import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import VocusHandler from '../../../src/shared/tools/VocusHandler';

test('VocusHandler: name: getVocusLink', () => {
    expect(VocusHandler.getVocusLink(null, null)).toStrictEqual(null);
    expect(VocusHandler.getVocusLink('10', null)).toStrictEqual(null);
    expect(VocusHandler.getVocusLink(null, 31)).toStrictEqual(null);
    expect(VocusHandler.getVocusLink('10', 31)).toStrictEqual('/vocus/10/31');
    expect(VocusHandler.getVocusLink("notANumber", 31)).toStrictEqual('/vocus/notANumber/31');
});
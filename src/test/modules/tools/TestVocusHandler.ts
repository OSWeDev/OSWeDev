import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import VocusHandler from '../../../shared/tools/VocusHandler';

describe('VocusHandler', () => {
    it('name: getVocusLink', () => {
        expect(VocusHandler.getVocusLink(null, null)).to.equal(null);
        expect(VocusHandler.getVocusLink('10', null)).to.equal(null);
        expect(VocusHandler.getVocusLink(null, 31)).to.equal(null);
        expect(VocusHandler.getVocusLink('10', 31)).to.equal('/vocus/10/31');
        expect(VocusHandler.getVocusLink("notANumber", 31)).to.equal('/vocus/notANumber/31');
    });
});

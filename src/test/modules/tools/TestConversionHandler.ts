import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import ConversionHandler from '../../../shared/tools/ConversionHandler';

describe('ConversionHandler', () => {
    it('test forceNumber', () => {
        expect(ConversionHandler.forceNumber(1)).to.equal(1);
        expect(ConversionHandler.forceNumber('1')).to.equal(1);
        expect(ConversionHandler.forceNumber(49.5)).to.equal(49.5);
        expect(ConversionHandler.forceNumber('49.5')).to.equal(49.5);
        expect(ConversionHandler.forceNumber(null)).to.equal(null);
        expect(ConversionHandler.forceNumber("notANumber")).to.equal(null);
        /*expect(ConversionHandler.forceNumber('49,5')).to.equal(49.5);*/
    });
    it('test forceNumbers', () => {
        expect(ConversionHandler.forceNumbers(null)).to.equal(null);
        expect(ConversionHandler.forceNumbers([])).to.equal(null);
        expect(ConversionHandler.forceNumbers([1, 2, 3])).to.deep.equal([1, 2, 3]);
        expect(ConversionHandler.forceNumbers(['1', '2', '3'])).to.deep.equal([1, 2, 3]);
        expect(ConversionHandler.forceNumbers([1.25, 2, 3])).to.deep.equal([1.25, 2, 3]);
        expect(ConversionHandler.forceNumbers(['1.25', '2', '3'])).to.deep.equal([1.25, 2, 3]);
        expect(ConversionHandler.forceNumbers(["notANumber"])).to.equal(null);
        expect(ConversionHandler.forceNumbers(["notANumber", 3])).to.equal(null);
        expect(ConversionHandler.forceNumbers([1, "2"])).to.deep.equal([1, 2]);
    });

    // it('test urlBase64ToUint8Array', () => {
    //     expect(ConversionHandler.urlBase64ToUint8Array(null)).to.equal(null);
    //     // expect(ConversionHandler.urlBase64ToUint8Array("2be2")).to.equal([0xd9, 0xb7, 0xb6]);

    // });

});



import { expect } from 'chai';
import 'mocha';
import ConversionHandler from '../../../shared/tools/ConversionHandler';

describe('ConversionHandler', () => {
    it('test forceNumber', () => {
        expect(ConversionHandler.getInstance().forceNumber(1)).to.equal(1);
        expect(ConversionHandler.getInstance().forceNumber('1')).to.equal(1);
        expect(ConversionHandler.getInstance().forceNumber(49.5)).to.equal(49.5);
        expect(ConversionHandler.getInstance().forceNumber('49.5')).to.equal(49.5);
        expect(ConversionHandler.getInstance().forceNumber(null)).to.equal(null);
        expect(ConversionHandler.getInstance().forceNumber("notANumber")).to.equal(null);
    });
    it('test forceNumbers', () => {
        expect(ConversionHandler.getInstance().forceNumbers(null)).to.equal(null);
        expect(ConversionHandler.getInstance().forceNumbers([])).to.equal(null);
        expect(ConversionHandler.getInstance().forceNumbers([1, 2, 3])).to.deep.equal([1, 2, 3]);
        expect(ConversionHandler.getInstance().forceNumbers(['1', '2', '3'])).to.deep.equal([1, 2, 3]);
        expect(ConversionHandler.getInstance().forceNumbers([1.25, 2, 3])).to.deep.equal([1.25, 2, 3]);
        expect(ConversionHandler.getInstance().forceNumbers(['1.25', '2', '3'])).to.deep.equal([1.25, 2, 3]);
        expect(ConversionHandler.getInstance().forceNumbers(["notANumber"])).to.equal(null);
        expect(ConversionHandler.getInstance().forceNumbers(["notANumber", 3])).to.equal(null);
        expect(ConversionHandler.getInstance().forceNumbers([1, "2"])).to.deep.equal([1, 2]);
    });

});



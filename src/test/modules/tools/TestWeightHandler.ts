import { expect } from 'chai';
import 'mocha';
import WeightHandler from '../../../shared/tools/WeightHandler';

describe('WeightHandler', () => {
    it('test: findNextHeavierItemByWeight', () => {
        let a = { weight: 1 };
        let b = { weight: 2 };
        let c = { weight: 3 };
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight(null, null)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], null)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight(null, 1)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 2)).to.equal(c);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 1000)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([c, a, b], 2)).to.equal(null); //cas où le tableau n'est pas classé
    });
});
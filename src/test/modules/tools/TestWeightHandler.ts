import { expect } from 'chai';
import 'mocha';
import WeightHandler from '../../../shared/tools/WeightHandler';

describe('WeightHandler', () => {
    it('test: sortByWeight', () => {
        let a = { weight: 1 };
        let b = { weight: 2 };
        let c = { weight: 3 };

        let arrayTest = [a, b, c];
        WeightHandler.getInstance().sortByWeight(arrayTest);
        expect(arrayTest).to.deep.equal([a, b, c]);

        arrayTest = [b, a];
        WeightHandler.getInstance().sortByWeight(arrayTest);
        expect(arrayTest).to.deep.equal([a, b]);

        arrayTest = [c, b, a];
        WeightHandler.getInstance().sortByWeight(arrayTest);
        expect(arrayTest).to.deep.equal([a, b, c]);

        arrayTest = [a, a, a];
        WeightHandler.getInstance().sortByWeight(arrayTest);
        expect(arrayTest).to.deep.equal([a, a, a]);

        arrayTest = null;
        WeightHandler.getInstance().sortByWeight(arrayTest);
        expect(arrayTest).to.deep.equal(null);

    });

    it('test: findNextHeavierItemByWeight', () => {
        let a = { weight: 1 };
        let b = { weight: 2 };
        let c = { weight: 3 };
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight(null, null)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], null)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight(null, 1)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 2)).to.equal(c);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 1)).to.equal(b);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 0)).to.equal(a);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], -5)).to.equal(a);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([a, b, c], 1000)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([b, b, b], 2)).to.equal(null);
        expect(WeightHandler.getInstance().findNextHeavierItemByWeight([c, c, c], 2)).to.equal(c);

    });
});
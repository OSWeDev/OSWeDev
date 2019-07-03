import { expect } from 'chai';
import 'mocha';
import NumRangeHandler from '../../../src/shared/tools/NumRangeHandler';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import RangesCutResult from '../../../src/shared/modules/Matroid/vos/RangesCutResult';

describe('NumRangeHandler', () => {

    it('test cut_range', () => {
        expect(NumRangeHandler.getInstance().cut_range(null, null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(null, NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true), null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, false))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, false))).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, true))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, true))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, true), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(0, 0, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));


        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, true, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, true, true)],
            [NumRange.createNew(0, 2, true, false), NumRange.createNew(3, 4, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, true, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, true, false)],
            [NumRange.createNew(0, 2, true, false), NumRange.createNew(3, 4, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, false, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, false, true)],
            [NumRange.createNew(0, 2, true, true), NumRange.createNew(3, 4, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, false, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 4, true, true)]
        ));


        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, true)],
            [NumRange.createNew(1, 4, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, false)],
            [NumRange.createNew(1, 4, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, true)],
            [NumRange.createNew(1, 4, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, false)],
            [NumRange.createNew(1, 4, true, true)]
        ));


        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true)],
            [NumRange.createNew(0, 3, true, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true)],
            [NumRange.createNew(0, 3, true, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true)],
            [NumRange.createNew(0, 3, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true)],
            [NumRange.createNew(0, 3, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true), NumRange.createNew(0, 4, true, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false)],
            [NumRange.createNew(0, 3, true, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false), NumRange.createNew(0, 4, true, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false)],
            [NumRange.createNew(0, 3, true, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true), NumRange.createNew(0, 4, true, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false)],
            [NumRange.createNew(0, 3, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false), NumRange.createNew(0, 4, true, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false)],
            [NumRange.createNew(0, 3, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true), NumRange.createNew(0, 4, false, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true)],
            [NumRange.createNew(0, 3, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false), NumRange.createNew(0, 4, false, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true)],
            [NumRange.createNew(0, 3, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true), NumRange.createNew(0, 4, false, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true)],
            [NumRange.createNew(0, 3, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false), NumRange.createNew(0, 4, false, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true)],
            [NumRange.createNew(0, 3, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true), NumRange.createNew(0, 4, false, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false)],
            [NumRange.createNew(0, 3, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false), NumRange.createNew(0, 4, false, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false)],
            [NumRange.createNew(0, 3, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true), NumRange.createNew(0, 4, false, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false)],
            [NumRange.createNew(0, 3, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false), NumRange.createNew(0, 4, false, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false)],
            [NumRange.createNew(0, 3, false, true)]
        ));





        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, true, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, true, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, false, true), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, false, false), NumRange.createNew(0, 4, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true)],
            null
        ));




        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true), NumRange.createNew(1, 2, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true)],
            [NumRange.createNew(1, 2, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(1, 2, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(1, 2, true, true))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true)],
            [NumRange.createNew(1, 2, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(1, 2, true, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, true)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true), NumRange.createNew(1, 2, true, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true)],
            [NumRange.createNew(1, 2, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(1, 2, true, false))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(1, 2, true, false))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true)],
            [NumRange.createNew(1, 2, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(1, 2, true, false))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, false)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true), NumRange.createNew(1, 2, false, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(1, 2, false, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(1, 2, false, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(1, 2, false, true))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true), NumRange.createNew(1, 2, false, false))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(1, 2, false, false))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(1, 2, false, false))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(1, 2, false, false))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false)]
        ));
    });

    it('test cuts_ranges', () => {
        expect(NumRangeHandler.getInstance().cuts_ranges(null, null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges(null, [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true)], null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true)], [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false)], [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true)], [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false)], [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true)], [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false)], [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true)], [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false)], [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true)], [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false)], [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true)], [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false)], [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true)], [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false)], [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true)], [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false)], [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(-1, 5, true, true)], [NumRange.createNew(0, 4, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true)],
            null
        ));

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(-1, 5, true, true)], [NumRange.createNew(0, 0, true, true), NumRange.createNew(1, 4, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true), NumRange.createNew(1, 4, true, true)],
            null
        ));


        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(-1, 0, true, true), NumRange.createNew(2, 3, true, false), NumRange.createNew(3, 4, true, false)], [NumRange.createNew(0, 0, true, true), NumRange.createNew(1, 4, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true), NumRange.createNew(2, 4, true, false)],
            [NumRange.createNew(1, 2, true, false), NumRange.createNew(4, 4, true, true)]
        ));
    });

    it('test cut_ranges', () => {
        expect(NumRangeHandler.getInstance().cut_ranges(null, null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(null, [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true), null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true), [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false), [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true), [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false), [NumRange.createNew(0, 0, true, true)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true)]
        ));

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true), [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false), [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true), [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false), [NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true), [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false), [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true), [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false), [NumRange.createNew(0, 0, false, true)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true), [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false), [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true), [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false), [NumRange.createNew(0, 0, false, false)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(-1, 5, true, true), [NumRange.createNew(0, 4, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true)],
            null
        ));

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(-1, 5, true, true), [NumRange.createNew(0, 0, true, true), NumRange.createNew(1, 4, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true), NumRange.createNew(1, 4, true, true)],
            null
        ));

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(1, 1, true, true), [NumRange.createNew(1, 2, true, true)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true)],
            [NumRange.createNew(1, 2, false, true)]
        ));
    });


    it('test getCardinal', () => {
        expect(NumRangeHandler.getInstance().getCardinal(null)).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, false, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, false, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, true, true))).to.equal(1);

        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, true, true))).to.equal(2);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, false, true))).to.equal(1);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, true, false))).to.equal(1);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, false, false))).to.equal(null);

        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, true, true))).to.equal(1);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, false, true))).to.equal(1);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, true, false))).to.equal(1);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, false, false))).to.equal(1);

        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, true, true))).to.equal(5);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, false, true))).to.equal(4);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, true, false))).to.equal(4);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, false, false))).to.equal(3);
    });

    it('test elt_intersects_any_range', () => {
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, true)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, true)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, true, true)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, true)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, true, true)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, true)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, true, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, true, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, true)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false), NumRange.createNew(0, 1, true, false)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false), NumRange.createNew(0, 1, true, true)])).to.equal(true);


        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, true)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, true, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, true, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, true)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, true, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, true, true)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false), NumRange.createNew(0, 1, true, false)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false), NumRange.createNew(0, 1, true, true)])).to.equal(true);
    });

    it('test elt_intersects_range', () => {
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, true, true))).to.equal(true);
    });

    it('test cloneFrom', () => {
        expect(NumRangeHandler.getInstance().cloneFrom(NumRange.createNew(0, 1, true, false))).to.deep.equal({
            min: 0,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false
        });

        expect(NumRangeHandler.getInstance().cloneFrom(NumRange.createNew(0, 0, true, true))).to.deep.equal({
            min: 0,
            max: 0,
            min_inclusiv: true,
            max_inclusiv: true
        });
    });

    it('test createNew', () => {
        expect(NumRange.createNew(0, 1, true, false)).to.deep.equal({
            min: 0,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false
        });

        expect(NumRange.createNew(0, 0, true, true)).to.deep.equal({
            min: 0,
            max: 0,
            min_inclusiv: true,
            max_inclusiv: true
        });

        expect(NumRange.createNew(0, 0, true, false)).to.equal(null);
        expect(NumRange.createNew(0, 0, false, true)).to.equal(null);
        expect(NumRange.createNew(0, 0, false, false)).to.equal(null);

        expect(NumRange.createNew(-1, -1, true, false)).to.equal(null);
        expect(NumRange.createNew(-1, -1, false, true)).to.equal(null);
        expect(NumRange.createNew(-1, -1, false, false)).to.equal(null);

        expect(NumRange.createNew(1, 1, true, false)).to.equal(null);
        expect(NumRange.createNew(1, 1, false, true)).to.equal(null);
        expect(NumRange.createNew(1, 1, false, false)).to.equal(null);

        expect(NumRange.createNew(-1, 1, true, false)).to.deep.equal({
            min: -1,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false
        });

        expect(NumRange.createNew(-1, 0, false, true)).to.deep.equal({
            min: -1,
            max: 0,
            min_inclusiv: false,
            max_inclusiv: true
        });

        expect(NumRange.createNew(0.5, 0, false, true)).to.equal(null);
        expect(NumRange.createNew(0.5, 0, true, true)).to.equal(null);
        expect(NumRange.createNew(0.5, 0, true, false)).to.equal(null);
        expect(NumRange.createNew(0.5, 0, false, false)).to.equal(null);

        expect(NumRange.createNew(0.5, 10.001, false, false)).to.deep.equal({
            min: 0.5,
            max: 10.001,
            min_inclusiv: false,
            max_inclusiv: false
        });
    });

    it('test foreach', () => {
        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, true, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, true, false), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, false, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, false, false), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, true, false), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, false, false), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, false, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([1]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, true, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0, 1]);


        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(-1, 1, true, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([-1, 0, 1]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, true, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, true, false), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, false, true), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, false, false), (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);
    });

    it('test foreach_ranges', () => {
        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, true, true)], (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, true, false)], (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, false, true)], (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, false, false)], (num: number) => {
                res.push(num);
            });
            return res;
        })()).to.deep.equal([]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([
                NumRange.createNew(0, 1, true, false),
                NumRange.createNew(0, 1, false, false)], (num: number) => {
                    res.push(num);
                });
            return res;
        })()).to.deep.equal([0]);

        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([
                NumRange.createNew(0, 1, true, false),
                NumRange.createNew(0, 1, false, false),
                NumRange.createNew(0, 1, false, true)], (num: number) => {
                    res.push(num);
                });
            return res;
        })()).to.deep.equal([0, 1]);


        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([
                NumRange.createNew(0, 1, true, false),
                NumRange.createNew(0, 1, false, false),
                NumRange.createNew(0, 1, false, true),
                NumRange.createNew(0, 1, true, true)], (num: number) => {
                    res.push(num);
                });
            return res;
        })()).to.deep.equal([0, 1, 0, 1]);


        expect((() => {
            let res: number[] = [];
            NumRangeHandler.getInstance().foreach_ranges([
                NumRange.createNew(0, 1, true, false),
                NumRange.createNew(0, 1, false, false),
                NumRange.createNew(0, 1, false, true),
                NumRange.createNew(0, 1, true, true),
                NumRange.createNew(-1, 1, true, true),
                NumRange.createNew(-0.5, 0.5, true, false),
                NumRange.createNew(-0.5, 0.5, false, false)], (num: number) => {
                    res.push(num);
                });
            return res;
        })()).to.deep.equal([0, 1, 0, 1, -1, 0, 1, 0, 0]);
    });

    it('test getFormattedMaxForAPI', () => {
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, 1, true, false))).to.equal('1');
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(-2, -1, true, false))).to.equal('-1');
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, -1, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(-2, 0, true, false))).to.equal('0');
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, 0, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, 0.5, true, false))).to.equal('0.5');
    });

    it('test getFormattedMinForAPI', () => {
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(1, 2, true, false))).to.equal('1');
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(-2, -1, true, false))).to.equal('-2');
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(0, -1, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(0, 1, true, false))).to.equal('0');
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(0, 0, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(-0.5, 0.5, true, false))).to.equal('-0.5');
    });

    it('test getMinSurroundingRange', () => {
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, true)])).to.deep.equal(NumRange.createNew(0, 0, true, true));

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false)])).to.deep.equal(NumRange.createNew(0, 0, true, true));
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true)])).to.deep.equal(NumRange.createNew(0, 0, true, true));

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);







        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);





        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange);
    });

    it('test getRangesUnion', () => {
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, false)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, true)])).to.deep.equal([NumRange.createNew(0, 0, true, true)]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false)])).to.deep.equal([NumRange.createNew(0, 0, true, true)]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true)])).to.deep.equal([NumRange.createNew(0, 0, true, true)]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, true, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, true, false)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange, {
            min: -1,
            min_inclusiv: true,
            max: 0,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, true, false)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange, {
            min: -1,
            min_inclusiv: true,
            max: 0,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, true, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true), NumRange.createNew(-1, 0, false, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true), NumRange.createNew(-1, 0, false, false)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange, {
            min: -1,
            min_inclusiv: false,
            max: 0,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false), NumRange.createNew(-1, 0, false, false)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange, {
            min: -1,
            min_inclusiv: false,
            max: 0,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false), NumRange.createNew(-1, 0, false, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);







        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, true, true)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, true, true)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, true, true)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, true, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, true, true)]
        );

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, false, true)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, false, true)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, false, true)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, false, true)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, false, true)]
        );

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, true, false)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, true, false)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, true, false)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, true, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, true, false)]
        );

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true), NumRange.createNew(-1, -0.5, false, false)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true), NumRange.createNew(-1, -0.5, false, false)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false), NumRange.createNew(-1, -0.5, false, false)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, false, false)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false), NumRange.createNew(-1, -0.5, false, false)]
        );





        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, true, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, false, true)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, true, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false), NumRange.createNew(-1, 0.5, false, false)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false
        } as NumRange]);
    });

    it('test getSegmentedMax', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, true, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, false, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, false, false))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, true, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, false, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, false, false))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, true, true))).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, true, false))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, false, true))).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, false, false))).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, true, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, true, false))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, false, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, false, false))).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 0, false, false))).to.equal(null);
    });

    it('test getSegmentedMax_from_ranges', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, true, true), NumRange.createNew(-1, 1, true, true)
        ])).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 1, true, true)
        ])).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 1, true, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 1, true, false)
        ])).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 1, true, true)
        ])).to.equal(1);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, true), NumRange.createNew(-1, 0, false, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, true), NumRange.createNew(-1, 0, false, true)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, false, false)
        ])).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, true, false), NumRange.createNew(-1, 0, false, false)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, true, false), NumRange.createNew(-1, 0, true, false)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, true, false)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false)
        ])).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(-0.5, 0.5, true, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(-0.5, 0.5, true, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(-0.5, 0.5, false, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(-0.5, 0.5, false, false)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(-0.5, 0.5, true, true)
        ])).to.equal(0);
    });

    it('test getSegmentedMin', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, true, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, false, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, false, false))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, true, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, true, false))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, false, true))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, false, false))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, true, true))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, true, false))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, false, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, false, false))).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, true, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, true, false))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, false, true))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, false, false))).to.equal(0);
    });

    it('test getSegmentedMin_from_ranges', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, true, true), NumRange.createNew(-1, 1, true, true)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 1, true, true)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 1, true, false)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 1, true, false)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 1, true, true)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, true), NumRange.createNew(-1, 0, false, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, true), NumRange.createNew(-1, 0, false, true)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, false, false)
        ])).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, true, false), NumRange.createNew(-1, 0, false, false)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, true, false), NumRange.createNew(-1, 0, true, false)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, false), NumRange.createNew(-1, 0, true, false)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false)
        ])).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(-0.5, 0.5, true, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(-0.5, 0.5, true, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(-0.5, 0.5, false, false)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(-0.5, 0.5, false, false)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(-0.5, 0.5, true, true)
        ])).to.equal(0);
    });

    it('test getValueFromFormattedMinOrMaxAPI', () => {
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI('0')).to.equal(0);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI('a')).to.equal(null);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(undefined)).to.equal(null);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI(null)).to.equal(null);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI('-1')).to.equal(-1);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI('-1000')).to.equal(-1000);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI('1')).to.equal(1);
        expect(NumRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPI('0.5')).to.equal(0.5);
    });

    it('test isEndABeforeEndB', () => {
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(false);




        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
    });

    it('test isEndABeforeStartB', () => {
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(false);




        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
    });

    it('test isEndASameEndB', () => {
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(true);




        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
    });

    it('test isStartABeforeEndB', () => {
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(true);



        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
    });

    it('test isStartABeforeStartB', () => {
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(true);




        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, false, false))).to.equal(false);
    });

    it('test isStartASameEndB', () => {
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(false);




        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
    });

    it('test isStartASameStartB', () => {
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, false), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, false), NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(0, 1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(0, 1, false, false))).to.equal(false);




        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-2, -1, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-2, -1, false, false))).to.equal(false);



        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, false, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true), NumRange.createNew(-1, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false), NumRange.createNew(-1, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true), NumRange.createNew(-1, 0, false, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false), NumRange.createNew(-1, 0, false, false))).to.equal(true);
    });

    it('test is_elt_inf_min', () => {
        expect(NumRangeHandler.getInstance().is_elt_inf_min(null, NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(null, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(0, 0, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, false, false))).to.equal(true);
    });

    it('test is_elt_sup_max', () => {
        expect(NumRangeHandler.getInstance().is_elt_sup_max(null, NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(null, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(0, 0, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, false, false))).to.equal(false);
    });

    it('test range_intersects_range', () => {
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, false, false))).to.equal(false);
    });

    it('test range_intersects_any_range', () => {
        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0, true, true), [
            NumRange.createNew(0, 0, false, false),
            NumRange.createNew(0, 0, true, false),
            NumRange.createNew(0, 0, false, true)
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0, true, true), [
            NumRange.createNew(0, 0, false, false),
            NumRange.createNew(0, 0, true, false),
            NumRange.createNew(0, 0, false, true),
            NumRange.createNew(0, 0, true, true)
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, true, true), [
            NumRange.createNew(1, 2, true, true),
            NumRange.createNew(1, 2, true, false),
            NumRange.createNew(1, 2, false, true),
            NumRange.createNew(1, 2, false, false),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, true, false), [
            NumRange.createNew(1, 2, true, true),
            NumRange.createNew(1, 2, true, false),
            NumRange.createNew(1, 2, false, true),
            NumRange.createNew(1, 2, false, false),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, false, true), [
            NumRange.createNew(1, 2, true, true),
            NumRange.createNew(1, 2, true, false),
            NumRange.createNew(1, 2, false, true),
            NumRange.createNew(1, 2, false, false),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, false, false), [
            NumRange.createNew(1, 2, true, true),
            NumRange.createNew(1, 2, true, false),
            NumRange.createNew(1, 2, false, true),
            NumRange.createNew(1, 2, false, false),
        ])).to.equal(false);




        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, true, true), [
            NumRange.createNew(0.5, 2, true, true),
            NumRange.createNew(0.5, 2, true, false),
            NumRange.createNew(0.5, 2, false, true),
            NumRange.createNew(0.5, 2, false, false),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, true, false), [
            NumRange.createNew(0.5, 2, true, true),
            NumRange.createNew(0.5, 2, true, false),
            NumRange.createNew(0.5, 2, false, true),
            NumRange.createNew(0.5, 2, false, false),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, false, true), [
            NumRange.createNew(0.5, 2, true, true),
            NumRange.createNew(0.5, 2, true, false),
            NumRange.createNew(0.5, 2, false, true),
            NumRange.createNew(0.5, 2, false, false),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, false, false), [
            NumRange.createNew(0.5, 2, true, true),
            NumRange.createNew(0.5, 2, true, false),
            NumRange.createNew(0.5, 2, false, true),
            NumRange.createNew(0.5, 2, false, false),
        ])).to.equal(true);



        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, true, true), [
            NumRange.createNew(0.5, 1, true, true),
            NumRange.createNew(0.5, 1, true, false),
            NumRange.createNew(0.5, 1, false, true),
            NumRange.createNew(0.5, 1, false, false),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, true, false), [
            NumRange.createNew(0.5, 1, true, true),
            NumRange.createNew(0.5, 1, true, false),
            NumRange.createNew(0.5, 1, false, true),
            NumRange.createNew(0.5, 1, false, false),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, false, true), [
            NumRange.createNew(0.5, 1, true, true),
            NumRange.createNew(0.5, 1, true, false),
            NumRange.createNew(0.5, 1, false, true),
            NumRange.createNew(0.5, 1, false, false),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, false, false), [
            NumRange.createNew(0.5, 1, true, true),
            NumRange.createNew(0.5, 1, true, false),
            NumRange.createNew(0.5, 1, false, true),
            NumRange.createNew(0.5, 1, false, false),
        ])).to.equal(false);
    });

    it('test ranges_are_contiguous_or_intersect', () => {
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, false, true), NumRange.createNew(0, 0, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, true, true), NumRange.createNew(0, 0, true, true))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, true, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, true, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, true, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, true, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, false, true))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true), NumRange.createNew(1, 2, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false), NumRange.createNew(1, 2, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true), NumRange.createNew(1, 2, false, false))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false), NumRange.createNew(1, 2, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false), NumRange.createNew(0.5, 2, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true), NumRange.createNew(0.5, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false), NumRange.createNew(0.5, 1, false, false))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, false, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true), NumRange.createNew(0.5, 1, false, false))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, true, true))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, true, false))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, false, true))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false), NumRange.createNew(0.5, 1, false, false))).to.equal(false);
    });
});
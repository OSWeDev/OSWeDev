import { expect } from 'chai';
import 'mocha';
import NumRangeHandler from '../../../src/shared/tools/NumRangeHandler';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import RangesCutResult from '../../../src/shared/modules/Matroid/vos/RangesCutResult';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';

describe('NumRangeHandler', () => {

    it('test cut_range', () => {
        expect(NumRangeHandler.getInstance().cut_range(null, null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));


        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT), NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT), NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, false, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(2, 3, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(2, 3, false, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)]
        ));


        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 4, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 4, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)]
        ));


        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(3, 4, false, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(0, 3, false, true, NumSegment.TYPE_INT)]
        ));





        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(-1, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));




        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));

        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT)]
        ));
    });

    it('test cuts_ranges', () => {
        expect(NumRangeHandler.getInstance().cuts_ranges(null, null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges(null, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], null)).to.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
            null
        ));

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));

        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));


        expect(NumRangeHandler.getInstance().cuts_ranges([NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT), NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 4, true, false, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT), NumRange.createNew(4, 4, true, true, NumSegment.TYPE_INT)]
        ));
    });

    it('test cut_ranges', () => {
        expect(NumRangeHandler.getInstance().cut_ranges(null, null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(null, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), null)).to.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
            null
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            null,
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
        ));

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);
        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)],
            null
        ));

        expect(NumRangeHandler.getInstance().cut_ranges(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal(new RangesCutResult(
            [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
            [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
        ));
    });


    it('test getCardinal', () => {
        expect(NumRangeHandler.getInstance().getCardinal(null)).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(1);

        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(2);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(2);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(1);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(1);

        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).to.equal(2);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).to.equal(2);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).to.equal(2);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).to.equal(2);

        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT))).to.equal(5);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT))).to.equal(5);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT))).to.equal(4);
        expect(NumRangeHandler.getInstance().getCardinal(NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT))).to.equal(4);
    });

    it('test elt_intersects_any_range', () => {
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).to.equal(true);


        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).to.equal(true);
    });

    it('test elt_intersects_range', () => {
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-1, NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().elt_intersects_range(1, NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(-0.5, NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().elt_intersects_range(0.5, NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
    });

    it('test cloneFrom', () => {
        expect(NumRangeHandler.getInstance().cloneFrom(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.deep.equal({
            min: 0,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        });

        expect(NumRangeHandler.getInstance().cloneFrom(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            min: 0,
            max: 0,
            min_inclusiv: true,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        });
    });

    it('test createNew', () => {
        expect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)).to.deep.equal({
            min: 0,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        });

        expect(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)).to.deep.equal({
            min: 0,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        });

        expect(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)).to.equal(null);

        expect(NumRange.createNew(-1, -1, true, false, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(-1, -1, false, true, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(-1, -1, false, false, NumSegment.TYPE_INT)).to.equal(null);

        expect(NumRange.createNew(1, 1, true, false, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(1, 1, false, true, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(1, 1, false, false, NumSegment.TYPE_INT)).to.equal(null);

        expect(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)).to.deep.equal({
            min: -1,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        });

        expect(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)).to.deep.equal({
            min: -1,
            max: 1,
            min_inclusiv: true,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        });

        expect(NumRange.createNew(0.5, 0, false, true, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(0.5, 0, true, true, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(0.5, 0, true, false, NumSegment.TYPE_INT)).to.equal(null);
        expect(NumRange.createNew(0.5, 0, false, false, NumSegment.TYPE_INT)).to.equal(null);

        expect(NumRange.createNew(0.5, 10.001, false, false, NumSegment.TYPE_INT)).to.deep.equal({
            min: 0,
            max: 11,
            min_inclusiv: true,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        });
    });


    it('test get_combinaisons', async () => {
        let res: NumRange[][] = [];

        NumRangeHandler.getInstance().get_combinaisons(res, [], [], 0, 1);
        expect(res).to.deep.equal([]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1], 0, 1);
        expect(res).to.deep.equal([
            [NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT)]
        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1], 0, 2);
        expect(res).to.deep.equal([]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5], 0, 2);
        expect(res).to.deep.equal([
            [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT)
            ]
        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5], 0, 1);
        expect(res).to.deep.equal([
            [NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT)],
            [NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT)]
        ]);
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5], 0, 2);
        expect(res).to.deep.equal([
            [NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT)],
            [NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT)],
            [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT)
            ]
        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5, 10, 20, 50], 0, 1);
        expect(res).to.deep.equal([
            [NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT)],
            [NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT)],
            [NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT)],
            [NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)],
            [NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)]
        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5, 10, 20, 50], 0, 2);
        expect(res).to.deep.equal([
            [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ],
        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5, 10, 20, 50], 0, 3);
        expect(res).to.deep.equal([
            [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ]
        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5, 10, 20, 50], 0, 4);
        expect(res).to.deep.equal([
            [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ], [
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ],

        ]);

        res = [];
        NumRangeHandler.getInstance().get_combinaisons(res, [], [1, 5, 10, 20, 50], 0, 5);
        expect(res).to.deep.equal([
            [
                NumRangeHandler.getInstance().create_single_element_range(1, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(5, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(10, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(20, NumSegment.TYPE_INT),
                NumRangeHandler.getInstance().create_single_element_range(50, NumSegment.TYPE_INT)
            ]
        ]);

        res = [];
    });

    it('test foreach', async () => {
        let res: number[] = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            0]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            0]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            0]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            0, 1]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            0, 1]);


        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            -1, 0, 1]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            -1, 0]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            -1, 0]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            -1, 0]);

        res = [];

        await NumRangeHandler.getInstance().foreach(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            -1, 0]);
    });

    it('test foreach_ranges', async () => {
        let res: number[] = [];

        await NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
            0]);

        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
        expect(res).to.deep.equal([
        ]);

        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([
            NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT)], (num: number) => {
                res.push(num);
            });
        expect(res).to.deep.equal([
            0, 0]);

        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([
            NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)], (num: number) => {
                res.push(num);
            });
        expect(res).to.deep.equal([
            0, 0, 0, 1]);


        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([
            NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)], (num: number) => {
                res.push(num);
            });
        expect(res).to.deep.equal([
            0, 0, 0, 1, 0, 1]);


        res = [];

        await NumRangeHandler.getInstance().foreach_ranges([
            NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)], (num: number) => {
                res.push(num);
            });
        expect(res).to.deep.equal([
            0, 0, 0, 1, 0, 1, -1, 0, 1, -1, 0, -1, 0]);
    });

    it('test getFormattedMaxForAPI', () => {
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal('1');
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal('-1');
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, -1, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(-2, 0, true, false, NumSegment.TYPE_INT))).to.equal('0');
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMaxForAPI(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT))).to.equal('0.5');
    });

    it('test getFormattedMinForAPI', () => {
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal('1');
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal('-2');
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(0, -1, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal('0');
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getFormattedMinForAPI(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).to.equal('-0.5');
    });

    it('test getMinSurroundingRange', () => {
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);







        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);





        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);

        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
        expect(NumRangeHandler.getInstance().getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal({
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange);
    });

    it('test getRangesUnion', () => {
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal(null);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: 1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange, {
            min: -1,
            min_inclusiv: true,
            max: 0,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange, {
            min: -1,
            min_inclusiv: true,
            max: 0,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange, {
            min: -1,
            min_inclusiv: false,
            max: 0,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: 0,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange, {
            min: -1,
            min_inclusiv: false,
            max: 0,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);







        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)]
        );

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)]
        );

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)]
        );

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)]
        );
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal(
            [NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)]
        );





        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: true,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);

        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: true,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
        expect(NumRangeHandler.getInstance().getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).to.deep.equal([{
            min: -1,
            min_inclusiv: false,
            max: 1,
            max_inclusiv: false,
            segment_type: NumSegment.TYPE_INT
        } as NumRange]);
    });

    it('test getSegmentedMax', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, true, true, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, false, true, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0.2, 0.2, false, false, NumSegment.TYPE_INT))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(-1);
    });

    it('test getSegmentedMax_from_ranges', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
        ])).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
        ])).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
        ])).to.equal(1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
        ])).to.equal(1);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)
        ])).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
        ])).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMax_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT)
        ])).to.equal(0);
    });

    it('test getSegmentedMin', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, true, true, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, false, true, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0.2, 0.2, false, false, NumSegment.TYPE_INT))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(0);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(null);

        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).to.equal(-1);
    });

    it('test getSegmentedMin_from_ranges', () => {
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)
        ])).to.equal(null);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)
        ])).to.equal(0);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);
        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
        ])).to.equal(-1);

        expect(NumRangeHandler.getInstance().getSegmentedMin_from_ranges([
            NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT)
        ])).to.equal(-1);
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
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);




        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test isEndABeforeStartB', () => {
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);




        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test isEndASameEndB', () => {
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);




        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test isStartABeforeEndB', () => {
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);



        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test isStartABeforeStartB', () => {
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);




        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test isStartASameEndB', () => {
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);




        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test isStartASameStartB', () => {
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);




        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).to.equal(false);



        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).to.equal(true);
    });

    it('test is_elt_inf_min', () => {
        expect(NumRangeHandler.getInstance().is_elt_inf_min(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(null, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(0, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_inf_min(-2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);
    });

    it('test is_elt_sup_max', () => {
        expect(NumRangeHandler.getInstance().is_elt_sup_max(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(null, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(0, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().is_elt_sup_max(-2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test range_intersects_range', () => {
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });

    it('test range_intersects_any_range', () => {
        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [
            NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [
            NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), [
            NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), [
            NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), [
            NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), [
            NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(false);




        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
        ])).to.equal(true);



        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
        ])).to.equal(false);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
        ])).to.equal(true);

        expect(NumRangeHandler.getInstance().range_intersects_any_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), [
            NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
            NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
        ])).to.equal(false);
    });

    it('test ranges_are_contiguous_or_intersect', () => {
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(true);

        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).to.equal(true);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).to.equal(false);
        expect(NumRangeHandler.getInstance().ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).to.equal(false);
    });
});
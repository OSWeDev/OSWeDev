import { expect } from 'chai';
import 'mocha';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import { range } from 'lodash';

describe('ObjectHandler', () => {


    it('test sortObjectByKey', () => {
        expect(ObjectHandler.getInstance().sortObjectByKey(
            { 2: 'j', 7: 'b', 3: 'a' }, (n1: any, n2: any) => n1 < n2)
        ).to.deep.equal(
            { 2: "j", 3: "a", 7: "b" }
        );

        expect(ObjectHandler.getInstance().sortObjectByKey(null, (n1: any, n2: any) => n1 < n2)).to.deep.equal({});
        expect(ObjectHandler.getInstance().sortObjectByKey({ null: 1, 7: 'b', 3: 'a' }, (n1: any, n2: any) => n1 < n2)).to.deep.equal({ 3: "a", 7: "b", null: 1 });

    });

    it('test arrayFromMap', () => {
        expect(ObjectHandler.getInstance().arrayFromMap(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).to.deep.equal(
            ['j', 'a', 'b']
        );

        expect(ObjectHandler.getInstance().arrayFromMap(null)).to.deep.equal([]);
        expect(ObjectHandler.getInstance().arrayFromMap({ 47: null, 7: 'b', 3: 'a' })).to.deep.equal(['a', 'b', null]);

    });

    it('test mapFromIdsArray', () => {
        expect(ObjectHandler.getInstance().mapFromIdsArray(
            [1, 2, 3, 4])
        ).to.deep.equal(
            { 1: true, 2: true, 3: true, 4: true }
        );

        expect(ObjectHandler.getInstance().mapFromIdsArray(null)).to.deep.equal({});
        expect(ObjectHandler.getInstance().mapFromIdsArray([47, 7, 3])).to.deep.equal({ 3: true, 7: true, 47: true });

    });

    it('test getIdsList', () => {
        let vos = [{ id: 3, name: 's', _type: "osef" }, { id: 46, name: 's', _type: "osef" }, { id: null, name: 's', _type: "osef" }];

        expect(ObjectHandler.getInstance().getIdsList(
            vos)
        ).to.deep.equal(
            [3, 46, null]
        );

        vos = [{ id: 3, name: 's', _type: null }, { id: 46, name: 's', _type: "osef" }, { id: null, name: 's', _type: "osef" }];
        expect(ObjectHandler.getInstance().getIdsList(null)).to.deep.equal([]);
        expect(ObjectHandler.getInstance().getIdsList(vos)).to.deep.equal([3, 46, null]);

    });

    it('test getNumberMapIndexes', () => {
        expect(ObjectHandler.getInstance().getNumberMapIndexes(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).to.deep.equal(
            [2, 3, 7]
        );

        expect(ObjectHandler.getInstance().getNumberMapIndexes(null)).to.deep.equal([]);
        expect(ObjectHandler.getInstance().getNumberMapIndexes({ 47: null, 7: 'b', 3: 'a' })).to.deep.equal([3, 7, 47]);

    });

    it('test hasData', () => {
        expect(ObjectHandler.getInstance().hasData(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal(true);

        expect(ObjectHandler.getInstance().hasData(null)).equal(false);
        expect(ObjectHandler.getInstance().hasData({})).equal(true);
        expect(ObjectHandler.getInstance().hasData([null])).equal(true);

    });

    it('test hasAtLeastOneAttribute', () => {
        expect(ObjectHandler.getInstance().hasData(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal(true);

        expect(ObjectHandler.getInstance().hasAtLeastOneAttribute(null)).equal(false);
        expect(ObjectHandler.getInstance().hasAtLeastOneAttribute({})).equal(false);
        expect(ObjectHandler.getInstance().hasAtLeastOneAttribute([null])).equal(true);

    });

    it('test hasOneAndOnlyOneAttribute', () => {
        expect(ObjectHandler.getInstance().hasOneAndOnlyOneAttribute(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal(false);

        expect(ObjectHandler.getInstance().hasOneAndOnlyOneAttribute(null)).equal(false);
        expect(ObjectHandler.getInstance().hasOneAndOnlyOneAttribute({})).equal(false);
        expect(ObjectHandler.getInstance().hasOneAndOnlyOneAttribute([null])).equal(true);

    });

    it('test shiftAttribute', () => {
        expect(ObjectHandler.getInstance().shiftAttribute(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal('j');

        expect(ObjectHandler.getInstance().shiftAttribute(null)).equal(null);
        expect(ObjectHandler.getInstance().shiftAttribute({})).equal(null);
        expect(ObjectHandler.getInstance().shiftAttribute([null])).equal(null);

    });

    it('test getFirstAttributeName', () => {
        expect(ObjectHandler.getInstance().getFirstAttributeName(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).to.deep.equal('2');

        expect(ObjectHandler.getInstance().getFirstAttributeName(null)).equal(null);
        expect(ObjectHandler.getInstance().getFirstAttributeName({})).equal(null);
        expect(ObjectHandler.getInstance().getFirstAttributeName([null])).to.deep.equal('0');

    });


    it('test filterVosIdsByNumRange', () => {
        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: 'a',
            2: 'b',
            3: 'c'
        }, NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: 'a'
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: 'a',
            2: 'b',
            3: 'c'
        }, NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: 'a',
            2: 'b'
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: 'a',
            2: 'b',
            3: 'c'
        }, NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: 'a',
            2: 'b',
            3: 'c'
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: null
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: null,
            2: null
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: null,
            2: null,
            3: 'c'
        });
    });

    it('test filterVosIdsByNumRanges', () => {
        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a'
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b'
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b',
            3: 'c'
        });



        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b'
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b',
            3: 'c'
        });




        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null,
            3: 'c'
        });



        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null,
            3: 'c'
        });
    });
    // it('test filterVosDateIndexesByTSRange', () => {
    // });
    // it('test filterVosDateIndexesByTSRanges', () => {
    // });
});
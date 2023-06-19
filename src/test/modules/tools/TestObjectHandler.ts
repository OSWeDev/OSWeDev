import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';

describe('ObjectHandler', () => {


    it('test sortObjectByKey', () => {
        expect(ObjectHandler.sortObjectByKey(
            { 2: 'j', 7: 'b', 3: 'a' }, (n1: any, n2: any) => n1 < n2)
        ).to.deep.equal(
            { 2: "j", 3: "a", 7: "b" }
        );

        expect(ObjectHandler.sortObjectByKey(null, (n1: any, n2: any) => n1 < n2)).to.deep.equal({});
        expect(ObjectHandler.sortObjectByKey({ null: 1, 7: 'b', 3: 'a' }, (n1: any, n2: any) => n1 < n2)).to.deep.equal({ 3: "a", 7: "b", null: 1 });

    });

    it('test mapFromIdsArray', () => {
        expect(ObjectHandler.mapFromIdsArray(
            [1, 2, 3, 4])
        ).to.deep.equal(
            { 1: true, 2: true, 3: true, 4: true }
        );

        expect(ObjectHandler.mapFromIdsArray(null)).to.deep.equal({});
        expect(ObjectHandler.mapFromIdsArray([47, 7, 3])).to.deep.equal({ 3: true, 7: true, 47: true });

    });

    it('test getIdsList', () => {
        let vos = [{ id: 3, name: 's', _type: "osef" }, { id: 46, name: 's', _type: "osef" }, { id: null, name: 's', _type: "osef" }];

        expect(ObjectHandler.getIdsList(
            vos)
        ).to.deep.equal(
            [3, 46, null]
        );

        vos = [{ id: 3, name: 's', _type: null }, { id: 46, name: 's', _type: "osef" }, { id: null, name: 's', _type: "osef" }];
        expect(ObjectHandler.getIdsList(null)).to.deep.equal([]);
        expect(ObjectHandler.getIdsList(vos)).to.deep.equal([3, 46, null]);

    });

    it('test getNumberMapIndexes', () => {
        expect(ObjectHandler.getNumberMapIndexes(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).to.deep.equal(
            [2, 3, 7]
        );

        expect(ObjectHandler.getNumberMapIndexes(null)).to.deep.equal([]);
        expect(ObjectHandler.getNumberMapIndexes({ 47: null, 7: 'b', 3: 'a' })).to.deep.equal([3, 7, 47]);

    });

    it('test hasData', () => {
        expect(ObjectHandler.hasData(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal(true);

        expect(ObjectHandler.hasData(null)).equal(false);
        expect(ObjectHandler.hasData({})).equal(true);
        expect(ObjectHandler.hasData([null])).equal(true);

    });

    it('test hasAtLeastOneAttribute', () => {
        expect(ObjectHandler.hasData(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal(true);

        expect(ObjectHandler.hasAtLeastOneAttribute(null)).equal(false);
        expect(ObjectHandler.hasAtLeastOneAttribute({})).equal(false);
        expect(ObjectHandler.hasAtLeastOneAttribute([null])).equal(true);

    });

    it('test hasOneAndOnlyOneAttribute', () => {
        expect(ObjectHandler.hasOneAndOnlyOneAttribute(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal(false);

        expect(ObjectHandler.hasOneAndOnlyOneAttribute(null)).equal(false);
        expect(ObjectHandler.hasOneAndOnlyOneAttribute({})).equal(false);
        expect(ObjectHandler.hasOneAndOnlyOneAttribute([null])).equal(true);

    });

    it('test shiftAttribute', () => {
        expect(ObjectHandler.shiftAttribute(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).equal('j');

        expect(ObjectHandler.shiftAttribute(null)).equal(null);
        expect(ObjectHandler.shiftAttribute({})).equal(null);
        expect(ObjectHandler.shiftAttribute([null])).equal(null);

    });

    it('test getFirstAttributeName', () => {
        expect(ObjectHandler.getFirstAttributeName(
            { 2: 'j', 7: 'b', 3: 'a' })
        ).to.deep.equal('2');

        expect(ObjectHandler.getFirstAttributeName(null)).equal(null);
        expect(ObjectHandler.getFirstAttributeName({})).equal(null);
        expect(ObjectHandler.getFirstAttributeName([null])).to.deep.equal('0');

    });


    it('test filterVosIdsByNumRange', () => {
        expect(ObjectHandler.filterVosIdsByNumRange({
            1: 'a',
            2: 'b',
            3: 'c'
        }, NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: 'a'
        });

        expect(ObjectHandler.filterVosIdsByNumRange({
            1: 'a',
            2: 'b',
            3: 'c'
        }, NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: 'a',
            2: 'b'
        });

        expect(ObjectHandler.filterVosIdsByNumRange({
            1: 'a',
            2: 'b',
            3: 'c'
        }, NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: 'a',
            2: 'b',
            3: 'c'
        });

        expect(ObjectHandler.filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: null
        });

        expect(ObjectHandler.filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            1: null,
            2: null
        });

        expect(ObjectHandler.filterVosIdsByNumRange({
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
        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a'
        });

        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b'
        });

        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b',
            3: 'c'
        });



        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b'
        });

        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: 'a',
            2: 'b',
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: 'a',
            2: 'b',
            3: 'c'
        });




        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null
        });

        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null
        });

        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null,
            3: 'c'
        });



        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null
        });

        expect(ObjectHandler.filterVosIdsByNumRanges({
            1: null,
            2: null,
            3: 'c'
        }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT)])).to.deep.equal({
            1: null,
            2: null,
            3: 'c'
        });
    });
});
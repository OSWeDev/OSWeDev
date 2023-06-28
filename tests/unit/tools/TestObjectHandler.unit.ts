import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import ObjectHandler from '../../../src/shared/tools/ObjectHandler';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';

test('ObjectHandler: test sortObjectByKey', () => {
    expect(ObjectHandler.sortObjectByKey(
        { 2: 'j', 7: 'b', 3: 'a' }, (n1: any, n2: any) => n1 < n2)
    ).toStrictEqual(
        { 2: "j", 3: "a", 7: "b" }
    );

    expect(ObjectHandler.sortObjectByKey(null, (n1: any, n2: any) => n1 < n2)).toStrictEqual({});
    expect(ObjectHandler.sortObjectByKey({ null: 1, 7: 'b', 3: 'a' }, (n1: any, n2: any) => n1 < n2)).toStrictEqual({ 3: "a", 7: "b", null: 1 });

});

test('ObjectHandler: test mapFromIdsArray', () => {
    expect(ObjectHandler.mapFromIdsArray(
        [1, 2, 3, 4])
    ).toStrictEqual(
        { 1: true, 2: true, 3: true, 4: true }
    );

    expect(ObjectHandler.mapFromIdsArray(null)).toStrictEqual({});
    expect(ObjectHandler.mapFromIdsArray([47, 7, 3])).toStrictEqual({ 3: true, 7: true, 47: true });

});

test('ObjectHandler: test getIdsList', () => {
    let vos = [{ id: 3, name: 's', _type: "osef" }, { id: 46, name: 's', _type: "osef" }, { id: null, name: 's', _type: "osef" }];

    expect(ObjectHandler.getIdsList(
        vos)
    ).toStrictEqual(
        [3, 46, null]
    );

    vos = [{ id: 3, name: 's', _type: null }, { id: 46, name: 's', _type: "osef" }, { id: null, name: 's', _type: "osef" }];
    expect(ObjectHandler.getIdsList(null)).toStrictEqual([]);
    expect(ObjectHandler.getIdsList(vos)).toStrictEqual([3, 46, null]);

});

test('ObjectHandler: test getNumberMapIndexes', () => {
    expect(ObjectHandler.getNumberMapIndexes(
        { 2: 'j', 7: 'b', 3: 'a' })
    ).toStrictEqual(
        [2, 3, 7]
    );

    expect(ObjectHandler.getNumberMapIndexes(null)).toStrictEqual([]);
    expect(ObjectHandler.getNumberMapIndexes({ 47: null, 7: 'b', 3: 'a' })).toStrictEqual([3, 7, 47]);

});

test('ObjectHandler: test hasData', () => {
    expect(ObjectHandler.hasData(
        { 2: 'j', 7: 'b', 3: 'a' })
    ).toStrictEqual(true);

    expect(ObjectHandler.hasData(null)).toStrictEqual(false);
    expect(ObjectHandler.hasData({})).toStrictEqual(true);
    expect(ObjectHandler.hasData([null])).toStrictEqual(true);

});

test('ObjectHandler: test hasAtLeastOneAttribute', () => {
    expect(ObjectHandler.hasData(
        { 2: 'j', 7: 'b', 3: 'a' })
    ).toStrictEqual(true);

    expect(ObjectHandler.hasAtLeastOneAttribute(null)).toStrictEqual(false);
    expect(ObjectHandler.hasAtLeastOneAttribute({})).toStrictEqual(false);
    expect(ObjectHandler.hasAtLeastOneAttribute([null])).toStrictEqual(true);

});

test('ObjectHandler: test hasOneAndOnlyOneAttribute', () => {
    expect(ObjectHandler.hasOneAndOnlyOneAttribute(
        { 2: 'j', 7: 'b', 3: 'a' })
    ).toStrictEqual(false);

    expect(ObjectHandler.hasOneAndOnlyOneAttribute(null)).toStrictEqual(false);
    expect(ObjectHandler.hasOneAndOnlyOneAttribute({})).toStrictEqual(false);
    expect(ObjectHandler.hasOneAndOnlyOneAttribute([null])).toStrictEqual(true);

});

test('ObjectHandler: test shiftAttribute', () => {
    expect(ObjectHandler.shiftAttribute(
        { 2: 'j', 7: 'b', 3: 'a' })
    ).toStrictEqual('j');

    expect(ObjectHandler.shiftAttribute(null)).toStrictEqual(null);
    expect(ObjectHandler.shiftAttribute({})).toStrictEqual(null);
    expect(ObjectHandler.shiftAttribute([null])).toStrictEqual(null);

});

test('ObjectHandler: test getFirstAttributeName', () => {
    expect(ObjectHandler.getFirstAttributeName(
        { 2: 'j', 7: 'b', 3: 'a' })
    ).toStrictEqual('2');

    expect(ObjectHandler.getFirstAttributeName(null)).toStrictEqual(null);
    expect(ObjectHandler.getFirstAttributeName({})).toStrictEqual(null);
    expect(ObjectHandler.getFirstAttributeName([null])).toStrictEqual('0');

});


test('ObjectHandler: test filterVosIdsByNumRange', () => {
    expect(ObjectHandler.filterVosIdsByNumRange({
        1: 'a',
        2: 'b',
        3: 'c'
    }, NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual({
        1: 'a'
    });

    expect(ObjectHandler.filterVosIdsByNumRange({
        1: 'a',
        2: 'b',
        3: 'c'
    }, NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual({
        1: 'a',
        2: 'b'
    });

    expect(ObjectHandler.filterVosIdsByNumRange({
        1: 'a',
        2: 'b',
        3: 'c'
    }, NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT))).toStrictEqual({
        1: 'a',
        2: 'b',
        3: 'c'
    });

    expect(ObjectHandler.filterVosIdsByNumRange({
        1: null,
        2: null,
        3: 'c'
    }, NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual({
        1: null
    });

    expect(ObjectHandler.filterVosIdsByNumRange({
        1: null,
        2: null,
        3: 'c'
    }, NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual({
        1: null,
        2: null
    });

    expect(ObjectHandler.filterVosIdsByNumRange({
        1: null,
        2: null,
        3: 'c'
    }, NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT))).toStrictEqual({
        1: null,
        2: null,
        3: 'c'
    });
});

test('ObjectHandler: test filterVosIdsByNumRanges', () => {
    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: 'a',
        2: 'b',
        3: 'c'
    }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: 'a'
    });

    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: 'a',
        2: 'b',
        3: 'c'
    }, [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: 'a',
        2: 'b'
    });

    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: 'a',
        2: 'b',
        3: 'c'
    }, [NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: 'a',
        2: 'b',
        3: 'c'
    });



    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: 'a',
        2: 'b',
        3: 'c'
    }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: 'a',
        2: 'b'
    });

    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: 'a',
        2: 'b',
        3: 'c'
    }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: 'a',
        2: 'b',
        3: 'c'
    });




    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: null,
        2: null,
        3: 'c'
    }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: null
    });

    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: null,
        2: null,
        3: 'c'
    }, [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: null,
        2: null
    });

    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: null,
        2: null,
        3: 'c'
    }, [NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: null,
        2: null,
        3: 'c'
    });



    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: null,
        2: null,
        3: 'c'
    }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: null,
        2: null
    });

    expect(ObjectHandler.filterVosIdsByNumRanges({
        1: null,
        2: null,
        3: 'c'
    }, [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT)])).toStrictEqual({
        1: null,
        2: null,
        3: 'c'
    });
});
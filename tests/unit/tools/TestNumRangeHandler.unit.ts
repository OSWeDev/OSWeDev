import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';
import RangesCutResult from '../../../src/shared/modules/Matroid/vos/RangesCutResult';
import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../src/shared/tools/RangeHandler';

test('NumRangeHandler: test range_includes_range', () => {
    expect(RangeHandler.range_includes_range(null, null)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_includes_range(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), null)).toStrictEqual(true);
    expect(RangeHandler.range_includes_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), null)).toStrictEqual(true);
    expect(RangeHandler.range_includes_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), null)).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(1, 23, true, false, NumSegment.TYPE_INT), NumRange.createNew(12, 13, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_includes_range(NumRange.createNew(1, 12, true, false, NumSegment.TYPE_INT), NumRange.createNew(12, 13, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(12, 13, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 23, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(1, 23, true, false, NumSegment.TYPE_INT), NumRange.createNew(12, 25, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(1, 23, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 25, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_includes_range(NumRange.createNew(1, 23, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 10, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test cut_range', () => {
    expect(RangeHandler.cut_range(null, null)).toStrictEqual(null);
    expect(RangeHandler.cut_range(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), null)).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));

    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));


    expect(RangeHandler.cut_range(NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(2, 3, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT), NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT), NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(2, 3, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(2, 3, false, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 2, true, true, NumSegment.TYPE_INT), NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(2, 3, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 5, true, false, NumSegment.TYPE_INT)]
    ));


    expect(RangeHandler.cut_range(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 4, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 4, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)]
    ));


    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 3, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, false, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 3, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(0, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 4, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(4, 5, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 4, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(4, 5, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 4, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 3, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 4, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(3, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, false, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 4, true, false, NumSegment.TYPE_INT)]
    ));





    expect(RangeHandler.cut_range(NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(-1, 5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(-1, 5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(-1, 5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));




    expect(RangeHandler.cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)]
    ));

    expect(RangeHandler.cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
    ));

    expect(RangeHandler.cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));

    expect(RangeHandler.cut_range(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.cut_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
});

test('NumRangeHandler: test cuts_ranges', () => {
    expect(RangeHandler.cuts_ranges(null, null)).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges(null, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], null)).toStrictEqual(null);

    expect(RangeHandler.cuts_ranges([NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
        null
    ));

    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));

    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cuts_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.cuts_ranges([NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));

    expect(RangeHandler.cuts_ranges([NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 5, true, false, NumSegment.TYPE_INT)],
        null
    ));


    expect(RangeHandler.cuts_ranges([NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 3, true, false, NumSegment.TYPE_INT), NumRange.createNew(3, 4, true, false, NumSegment.TYPE_INT)], [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(2, 4, true, false, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT), NumRange.createNew(4, 4, true, true, NumSegment.TYPE_INT)]
    ));
});

test('NumRangeHandler: test cut_ranges', () => {
    expect(RangeHandler.cut_ranges(null, null)).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(null, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), null)).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)],
        null
    ));
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        null,
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]
    ));

    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.cut_ranges(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.cut_ranges(NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));

    expect(RangeHandler.cut_ranges(NumRange.createNew(-1, 5, true, true, NumSegment.TYPE_INT), [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 4, true, true, NumSegment.TYPE_INT)],
        null
    ));

    expect(RangeHandler.cut_ranges(NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT), [NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT)])).toStrictEqual(new RangesCutResult(
        [NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)],
        [NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT)]
    ));
});


test('NumRangeHandler: test getCardinal', () => {
    expect(RangeHandler.getCardinal(null)).toStrictEqual(null);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(1);

    expect(RangeHandler.getCardinal(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(2);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getCardinal(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).toStrictEqual(2);
    expect(RangeHandler.getCardinal(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).toStrictEqual(1);
    expect(RangeHandler.getCardinal(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getCardinal(NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(5);
    expect(RangeHandler.getCardinal(NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(4);
    expect(RangeHandler.getCardinal(NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(4);
    expect(RangeHandler.getCardinal(NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(3);
});

test('NumRangeHandler: test elt_intersects_any_range', () => {
    expect(RangeHandler.elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(0, [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(0, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(0, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(-1, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(1, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);


    expect(RangeHandler.elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(-0.5, [NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)])).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)])).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_any_range(0.5, [NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual(true);
});

test('NumRangeHandler: test elt_intersects_range', () => {
    expect(RangeHandler.elt_intersects_range(0, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(0, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(0, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_range(0, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(-1, NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(1, NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(-0.5, NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-0.5, NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(-0.5, NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(-0.5, NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.elt_intersects_range(0.5, NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(0.5, NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.elt_intersects_range(0.5, NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.elt_intersects_range(0.5, NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
});

test('NumRangeHandler: test cloneFrom', () => {
    expect(RangeHandler.cloneFrom(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(
        NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT));

    expect(RangeHandler.cloneFrom(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(
        NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));
});

test('NumRangeHandler: test createNew', () => {
    expect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                max: 1,
                min_inclusiv: true,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            }));

    expect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                max: 2,
                min_inclusiv: true,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            }));

    expect(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                max: 1,
                min_inclusiv: true,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            }));

    expect(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)).toStrictEqual(null);

    expect(NumRange.createNew(-1, -1, true, false, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(-1, -1, false, true, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(-1, -1, false, false, NumSegment.TYPE_INT)).toStrictEqual(null);

    expect(NumRange.createNew(1, 1, true, false, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(1, 1, false, true, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(1, 1, false, false, NumSegment.TYPE_INT)).toStrictEqual(null);

    expect(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                max: 1,
                min_inclusiv: true,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            }));

    expect(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                max: 1,
                min_inclusiv: true,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            }));

    expect(NumRange.createNew(0.5, 0, false, true, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(0.5, 0, true, true, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(0.5, 0, true, false, NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumRange.createNew(0.5, 0, false, false, NumSegment.TYPE_INT)).toStrictEqual(null);

    expect(NumRange.createNew(0.5, 10.001, false, false, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                max: 10,
                min_inclusiv: true,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            }));
});

test('NumRangeHandler: test rangesFromIndex', () => {

    let ranges = [
        RangeHandler.createNew(NumRange.RANGE_TYPE, 0, 1, true, false, NumSegment.TYPE_INT),
        RangeHandler.createNew(NumRange.RANGE_TYPE, 0, 2, true, false, NumSegment.TYPE_INT),
        RangeHandler.createNew(NumRange.RANGE_TYPE, 1, 5, true, false, NumSegment.TYPE_INT),
        RangeHandler.createNew(NumRange.RANGE_TYPE, -1, 1, true, false, NumSegment.TYPE_INT),
    ];
    expect(RangeHandler.rangesFromIndex(RangeHandler.getIndexRanges(ranges), NumRange.RANGE_TYPE)).toStrictEqual(
        [RangeHandler.createNew(NumRange.RANGE_TYPE, -1, 5, true, false, NumSegment.TYPE_INT)]
    );
});

test('NumRangeHandler: test get_combinaisons', async () => {
    let res: NumRange[][] = [];

    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [], 0, 1);
    expect(res).toStrictEqual([]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1], 0, 1);
    expect(res).toStrictEqual([
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT)]
    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1], 0, 2);
    expect(res).toStrictEqual([]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5], 0, 2);
    expect(res).toStrictEqual([
        [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT)
        ]
    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5], 0, 1);
    expect(res).toStrictEqual([
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT)],
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT)]
    ]);
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5], 0, 2);
    expect(res).toStrictEqual([
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT)],
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT)],
        [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT)
        ]
    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5, 10, 20, 50], 0, 1);
    expect(res).toStrictEqual([
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT)],
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT)],
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT)],
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)],
        [RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)]
    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5, 10, 20, 50], 0, 2);
    expect(res).toStrictEqual([
        [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ],
    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5, 10, 20, 50], 0, 3);
    expect(res).toStrictEqual([
        [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ]
    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5, 10, 20, 50], 0, 4);
    expect(res).toStrictEqual([
        [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ], [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ],

    ]);

    res = [];
    RangeHandler.get_combinaisons(NumRange.RANGE_TYPE, res, [], [1, 5, 10, 20, 50], 0, 5);
    expect(res).toStrictEqual([
        [
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 1, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 5, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 10, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 20, NumSegment.TYPE_INT),
            RangeHandler.create_single_elt_range(NumRange.RANGE_TYPE, 50, NumSegment.TYPE_INT)
        ]
    ]);

    res = [];
});

test('NumRangeHandler: test foreach', async () => {
    let res: number[] = [];

    await RangeHandler.foreach(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        0]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        0]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([1]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        0, 1]);


    res = [];

    await RangeHandler.foreach(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        -1, 0, 1]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        -1, 0]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        -1]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        0]);

    res = [];

    await RangeHandler.foreach(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([]);
});

test('NumRangeHandler: test foreach_ranges', async () => {
    let res: number[] = [];

    await RangeHandler.foreach_ranges([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)], (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
        0]);

    res = [];

    await RangeHandler.foreach_ranges([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)], (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach_ranges([NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)], (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach_ranges([NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT)], (num: number) => {
        res.push(num);
    });
    expect(res).toStrictEqual([
    ]);

    res = [];

    await RangeHandler.foreach_ranges([
        NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
    expect(res).toStrictEqual([
        0]);

    res = [];

    await RangeHandler.foreach_ranges([
        NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
    expect(res).toStrictEqual([
        0, 1]);


    res = [];

    await RangeHandler.foreach_ranges([
        NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
    expect(res).toStrictEqual([
        0, 1, 0, 1]);


    res = [];

    await RangeHandler.foreach_ranges([
        NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)], (num: number) => {
            res.push(num);
        });
    expect(res).toStrictEqual([
        0, 1, 0, 1, -1, 0, 1, -1]);
});

test('NumRangeHandler: test getMinSurroundingRange', () => {
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 0,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));







    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 0,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));





    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));

    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
    expect(RangeHandler.getMinSurroundingRange([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange));
});

test('NumRangeHandler: test getRangesUnion', () => {
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual(null);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual([NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 0,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange),
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 0,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual(null);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);







    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(-1, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)]
    );

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        null
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)]
    );

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        null
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)]
    );

    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(0, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT)]
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        null
    );
    expect(RangeHandler.getRangesUnion([NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, -0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual(
        [NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT)]
    );





    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, true, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, true, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);

    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 2,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: 0,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
    expect(RangeHandler.getRangesUnion([NumRange.createNew(-0.5, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0.5, false, false, NumSegment.TYPE_INT)])).toStrictEqual([
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            {
                range_type: NumRange.RANGE_TYPE,
                min: -1,
                min_inclusiv: true,
                max: 1,
                max_inclusiv: false,
                segment_type: NumSegment.TYPE_INT
            } as NumRange)]);
});

test('NumRangeHandler: test getSegmentedMax', () => {
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0.2, 0.2, true, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0.2, 0.2, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0.2, 0.2, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0.2, 0.2, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(1);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(1);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(0);

    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMax(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
});

test('NumRangeHandler: test getSegmentedMax_from_ranges', () => {
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(1);

    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);

    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);

    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMax_from_ranges([
        NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);
});

test('NumRangeHandler: test getSegmentedMin', () => {
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0.2, 0.2, true, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0.2, 0.2, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0.2, 0.2, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0.2, 0.2, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(0);

    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT))).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT))).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT))).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMin(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT))).toStrictEqual(null);
});

test('NumRangeHandler: test getSegmentedMin_from_ranges', () => {
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);

    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);

    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(null);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(0);

    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT)
    ])).toStrictEqual(null);

    expect(RangeHandler.getSegmentedMin_from_ranges([
        NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(-1);
});

test('NumRangeHandler: test isEndABeforeEndB', () => {
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test isEndABeforeStartB', () => {
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test isEndASameEndB', () => {
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isEndASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test isStartABeforeEndB', () => {
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);



    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});


test('NumRangeHandler: test isStartABeforeOrSameStartB_optimized_normalized', () => {
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameStartB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});


test('NumRangeHandler: test isStartABeforeOrSameEndB_optimized_normalized', () => {
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeOrSameEndB_optimized_normalized(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test isStartABeforeStartB', () => {
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartABeforeStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test isStartASameEndB', () => {
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameEndB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test isStartASameStartB', () => {
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);




    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-2, -1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);



    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.isStartASameStartB(NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(-1, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test is_elt_inf_min', () => {
    expect(RangeHandler.is_elt_inf_min(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(null, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(-1, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(0, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(0, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(0, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(0, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_inf_min(-1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(-1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_inf_min(-1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(-1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.is_elt_inf_min(-2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(-2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(-2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_inf_min(-2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);
});

test('NumRangeHandler: test is_elt_sup_max', () => {
    expect(RangeHandler.is_elt_sup_max(null, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(null, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(2, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_sup_max(0, NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(0, NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(0, NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(0, NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_sup_max(2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.is_elt_sup_max(1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.is_elt_sup_max(1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.is_elt_sup_max(-1, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(-1, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(-1, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(-1, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.is_elt_sup_max(-2, NumRange.createNew(-1, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(-2, NumRange.createNew(-1, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(-2, NumRange.createNew(-1, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.is_elt_sup_max(-2, NumRange.createNew(-1, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test range_intersects_range', () => {
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test range_intersects_range_optimized_normalized', () => {
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.range_intersects_range_optimized_normalized(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});

test('NumRangeHandler: test range_intersects_any_range', () => {
    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [
        NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), [
        NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT)
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), [
        NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);




    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);



    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(true);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);

    expect(RangeHandler.range_intersects_any_range(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), [
        NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT),
        NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT),
    ])).toStrictEqual(false);
});

test('NumRangeHandler: test ranges_are_contiguous_or_intersect', () => {
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(1, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(true);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 1, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 2, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(true);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, true, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, true, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);

    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, true, false, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, true, NumSegment.TYPE_INT))).toStrictEqual(false);
    expect(RangeHandler.ranges_are_contiguous_or_intersect(NumRange.createNew(0, 0.5, false, false, NumSegment.TYPE_INT), NumRange.createNew(0.5, 1, false, false, NumSegment.TYPE_INT))).toStrictEqual(false);
});
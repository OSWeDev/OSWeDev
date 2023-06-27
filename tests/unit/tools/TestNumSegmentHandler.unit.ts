import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';

import NumSegment from '../../../src/shared/modules/DataRender/vos/NumSegment';
import NumSegmentHandler from '../../../src/shared/tools/NumSegmentHandler';
import NumRange from '../../../src/shared/modules/DataRender/vos/NumRange';

test('NumSegmentHandler: test decNumSegment', () => {
    expect(NumSegmentHandler.decNumSegment(null, NumSegment.TYPE_INT)).toStrictEqual(null);

    let numSeg = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
    let numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);

    NumSegmentHandler.decNumSegment(null, NumSegment.TYPE_INT, 0);
    expect(numSeg).toStrictEqual(numSegTest);

    numSegTest = NumSegment.fromNumAndType(1, NumSegment.TYPE_INT);
    NumSegmentHandler.decNumSegment(numSeg, NumSegment.TYPE_INT, 1);
    expect(numSeg).toStrictEqual(numSegTest);

    numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
    NumSegmentHandler.decNumSegment(numSeg, NumSegment.TYPE_INT, -1);
    expect(numSeg).toStrictEqual(numSegTest);

});

test('NumSegmentHandler: test incNumSegment', () => {
    expect(NumSegmentHandler.incNumSegment(null, NumSegment.TYPE_INT)).toStrictEqual(null);

    let numSeg = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
    let numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);

    NumSegmentHandler.incNumSegment(null, NumSegment.TYPE_INT, 0);
    expect(numSeg).toStrictEqual(numSegTest);

    numSegTest = NumSegment.fromNumAndType(1, NumSegment.TYPE_INT);
    NumSegmentHandler.incNumSegment(numSeg, NumSegment.TYPE_INT, -1);
    expect(numSeg).toStrictEqual(numSegTest);

    numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
    NumSegmentHandler.incNumSegment(numSeg, NumSegment.TYPE_INT, 1);
    expect(numSeg).toStrictEqual(numSegTest);
});

test('NumSegmentHandler: test isEltInSegment', () => {
    let segment = { index: 1, type: NumSegment.TYPE_INT };
    expect(NumSegmentHandler.isEltInSegment(2, null)).toStrictEqual(false);
    expect(NumSegmentHandler.isEltInSegment(null, segment)).toStrictEqual(false);
    expect(NumSegmentHandler.isEltInSegment(2, segment)).toStrictEqual(false);
    expect(NumSegmentHandler.isEltInSegment(1, segment)).toStrictEqual(true);
});

test('NumSegmentHandler: test incNum', () => {
    let segment = { index: 1, type: NumSegment.TYPE_INT };
    expect(NumSegmentHandler.incNum(2, null, 3)).toStrictEqual(5);
    expect(NumSegmentHandler.incNum(2, NumSegment.TYPE_INT, null)).toStrictEqual(2);
    expect(NumSegmentHandler.incNum(null, NumSegment.TYPE_INT, 13)).toStrictEqual(13);
    expect(NumSegmentHandler.incNum(1, NumSegment.TYPE_INT, -24)).toStrictEqual(-23);
});

test('NumSegmentHandler: test decNum', () => {
    let segment = { index: 1, type: NumSegment.TYPE_INT };
    expect(NumSegmentHandler.decNum(2, null, 3)).toStrictEqual(-1);
    expect(NumSegmentHandler.decNum(2, NumSegment.TYPE_INT, null)).toStrictEqual(2);
    expect(NumSegmentHandler.decNum(null, NumSegment.TYPE_INT, 13)).toStrictEqual(-13);
    expect(NumSegmentHandler.decNum(1, NumSegment.TYPE_INT, -24)).toStrictEqual(25);
});

test('NumSegmentHandler: test get_segment_from_range_start', () => {
    expect(NumSegmentHandler.get_segment_from_range_start(
        null,
        NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 0,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);


    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -1,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -1,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 0,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);


    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -2,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -1,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -2,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_start(
        NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -1,
                    type: NumSegment.TYPE_INT
                }));
});


test('NumSegmentHandler: test get_segment_from_range_end', () => {
    expect(NumSegmentHandler.get_segment_from_range_end(
        null,
        NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 0,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);


    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 0,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: -1,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 0,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(null);


    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 2,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 2,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 1,
                    type: NumSegment.TYPE_INT
                }));
    expect(NumSegmentHandler.get_segment_from_range_end(
        NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT),
        NumSegment.TYPE_INT)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 1,
                    type: NumSegment.TYPE_INT
                }));
});

test('NumSegmentHandler: test getAllDataNumSegments', () => {
    expect(NumSegmentHandler.getAllDataNumSegments(null, null, null)).toStrictEqual(null);
    expect(NumSegmentHandler.getAllDataNumSegments(1, 2, NumSegment.TYPE_INT)).toStrictEqual([
        Object.assign(new NumSegment(),
            {
                index: 1,
                type: NumSegment.TYPE_INT
            }),
        Object.assign(new NumSegment(),
            {
                index: 2,
                type: NumSegment.TYPE_INT
            })
    ]);
    expect(NumSegmentHandler.getAllDataNumSegments(1, 2, NumSegment.TYPE_INT, true)).toStrictEqual([
        Object.assign(new NumSegment(),
            {
                index: 1,
                type: NumSegment.TYPE_INT
            })
    ]);
});

test('NumSegmentHandler: test getCorrespondingNumSegments', () => {
    expect(NumSegmentHandler.getCorrespondingNumSegments(
        [0.5, 2, null], NumSegment.TYPE_INT, 2
    )).toStrictEqual(
        [
            Object.assign(new NumSegment(),
                { index: 2, type: NumSegment.TYPE_INT }),
            Object.assign(new NumSegment(),
                { index: 4, type: NumSegment.TYPE_INT }),
            Object.assign(new NumSegment(),
                { index: 2, type: NumSegment.TYPE_INT })]
    );

    expect(NumSegmentHandler.getCorrespondingNumSegments(
        null, NumSegment.TYPE_INT, 2
    )).toStrictEqual(
        []
    );
});

test('NumSegmentHandler: test getCorrespondingNumSegment', () => {
    expect(NumSegmentHandler.getCorrespondingNumSegment(
        0.5,
        NumSegment.TYPE_INT, 2)).toStrictEqual(
            Object.assign(new NumSegment(),
                {
                    index: 2,
                    type: NumSegment.TYPE_INT
                }));

    expect(NumSegmentHandler.getCorrespondingNumSegment(1, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 1,
                type: NumSegment.TYPE_INT
            }));

    expect(NumSegmentHandler.getCorrespondingNumSegment(3, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 3,
                type: NumSegment.TYPE_INT
            }));
    expect(NumSegmentHandler.getCorrespondingNumSegment(3, NumSegment.TYPE_INT, 1)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 4,
                type: NumSegment.TYPE_INT
            }));
    expect(NumSegmentHandler.getCorrespondingNumSegment(3, NumSegment.TYPE_INT, -1)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 2,
                type: NumSegment.TYPE_INT
            }));
});

test('NumSegmentHandler: test get_nums', () => {
    expect(NumSegmentHandler.get_nums(
        [{ index: 2, type: NumSegment.TYPE_INT }, { index: 4, type: NumSegment.TYPE_INT }, { index: 56, type: NumSegment.TYPE_INT }]
    )).toStrictEqual(
        [2, 4, 56]
    );

    expect(NumSegmentHandler.get_nums(
        null
    )).toStrictEqual(
        []
    );
});


test('NumSegmentHandler: test getEndNumSegment', () => {
    expect(NumSegmentHandler.getEndNumSegment(null)).toStrictEqual(null);
    expect(NumSegmentHandler.getEndNumSegment({ index: 1, type: NumSegment.TYPE_INT })).toStrictEqual(2);
});

test('NumSegmentHandler: test getPreviousNumSegment', () => {
    expect(NumSegmentHandler.getPreviousNumSegment({
        index: 15,
        type: NumSegment.TYPE_INT
    }, NumSegment.TYPE_INT)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 14,
                type: NumSegment.TYPE_INT
            }));

    expect(NumSegmentHandler.getPreviousNumSegment({
        index: 15,
        type: NumSegment.TYPE_INT
    }, NumSegment.TYPE_INT, 2)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 13,
                type: NumSegment.TYPE_INT
            }));

    expect(NumSegmentHandler.getPreviousNumSegment({
        index: 15,
        type: NumSegment.TYPE_INT
    }, NumSegment.TYPE_INT, -1)).toStrictEqual(
        Object.assign(new NumSegment(),
            {
                index: 16,
                type: NumSegment.TYPE_INT
            }));
});

test('NumSegmentHandler: test getPreviousNumSegments', () => {
    expect(NumSegmentHandler.getPreviousNumSegments(
        [{ index: 16, type: NumSegment.TYPE_INT }, { index: 18, type: NumSegment.TYPE_INT }, { index: 14, type: NumSegment.TYPE_INT }], NumSegment.TYPE_INT
    )).toStrictEqual(
        [
            Object.assign(new NumSegment(),
                { index: 15, type: NumSegment.TYPE_INT }),
            Object.assign(new NumSegment(),
                { index: 17, type: NumSegment.TYPE_INT }),
            Object.assign(new NumSegment(),
                { index: 13, type: NumSegment.TYPE_INT })]
    );

    expect(NumSegmentHandler.getPreviousNumSegments([], NumSegment.TYPE_INT)).toStrictEqual([]);
    expect(NumSegmentHandler.getPreviousNumSegments(null, NumSegment.TYPE_INT)).toStrictEqual(null);


});

test('NumSegmentHandler: test getStartNumSegment', () => {
    expect(NumSegmentHandler.getStartNumSegment({
        index: 15,
        type: NumSegment.TYPE_INT
    })).toStrictEqual(15);
});

test('NumSegmentHandler: test get_num_ranges', () => {
    expect(NumSegmentHandler.get_num_ranges(
        [{
            index: 2, type: NumSegment.TYPE_INT
        }, {
            index: 4, type: NumSegment.TYPE_INT
        }, {
            index: 0, type: NumSegment.TYPE_INT
        }]
    )).toStrictEqual(
        [
            Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
                {
                    max: 1, max_inclusiv: false, min: 0, min_inclusiv: true, range_type: 1, segment_type: 0
                }),
            Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
                {
                    max: 3, max_inclusiv: false, min: 2, min_inclusiv: true, range_type: 1, segment_type: 0
                }),
            Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
                {
                    max: 5, max_inclusiv: false, min: 4, min_inclusiv: true, range_type: 1, segment_type: 0
                })]);

    expect(NumSegmentHandler.get_num_ranges(null)).toStrictEqual(null);
});

test('NumSegmentHandler: test get_num_ranges_', () => {
    expect(NumSegmentHandler["get_num_ranges_"](
        [
            {
                index: 2, type: NumSegment.TYPE_INT
            }, {
                index: 4, type: NumSegment.TYPE_INT
            }, {
                index: 0, type: NumSegment.TYPE_INT
            }]
    )).toStrictEqual(
        [
            Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), {
                max: 3, max_inclusiv: false, min: 2, min_inclusiv: true, range_type: 1, segment_type: 0
            }), Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), {
                max: 5, max_inclusiv: false, min: 4, min_inclusiv: true, range_type: 1, segment_type: 0
            }), Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), {
                max: 1, max_inclusiv: false, min: 0, min_inclusiv: true, range_type: 1, segment_type: 0
            })]);

    expect(NumSegmentHandler["get_num_ranges_"](null)).toStrictEqual([]);
});

test('NumSegmentHandler: test get_surrounding_ts_range', () => {
    expect(NumSegmentHandler.get_surrounding_ts_range(
        [{ index: 2, type: NumSegment.TYPE_INT }, { index: 4, type: NumSegment.TYPE_INT }, { index: 0, type: NumSegment.TYPE_INT }]
    )).toStrictEqual(
        Object.assign(NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT), {
            max: 5, max_inclusiv: false, min: 0, min_inclusiv: true, range_type: 1, segment_type: 0
        }));

    expect(NumSegmentHandler.get_num_ranges(null)).toStrictEqual(null);
});
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';

import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import NumSegmentHandler from '../../../shared/tools/NumSegmentHandler';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';

describe('NumSegmentHandler', () => {


    it('test decNumSegment', () => {
        expect(NumSegmentHandler.decNumSegment(null, NumSegment.TYPE_INT)).equal(null);

        let numSeg = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
        let numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);

        NumSegmentHandler.decNumSegment(null, NumSegment.TYPE_INT, 0);
        expect(numSeg).to.deep.equal(numSegTest);

        numSegTest = NumSegment.fromNumAndType(1, NumSegment.TYPE_INT);
        NumSegmentHandler.decNumSegment(numSeg, NumSegment.TYPE_INT, 1);
        expect(numSeg).to.deep.equal(numSegTest);

        numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
        NumSegmentHandler.decNumSegment(numSeg, NumSegment.TYPE_INT, -1);
        expect(numSeg).to.deep.equal(numSegTest);

    });

    it('test incNumSegment', () => {
        expect(NumSegmentHandler.incNumSegment(null, NumSegment.TYPE_INT)).equal(null);

        let numSeg = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
        let numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);

        NumSegmentHandler.incNumSegment(null, NumSegment.TYPE_INT, 0);
        expect(numSeg).to.deep.equal(numSegTest);

        numSegTest = NumSegment.fromNumAndType(1, NumSegment.TYPE_INT);
        NumSegmentHandler.incNumSegment(numSeg, NumSegment.TYPE_INT, -1);
        expect(numSeg).to.deep.equal(numSegTest);

        numSegTest = NumSegment.fromNumAndType(2, NumSegment.TYPE_INT);
        NumSegmentHandler.incNumSegment(numSeg, NumSegment.TYPE_INT, 1);
        expect(numSeg).to.deep.equal(numSegTest);
    });

    it('test isEltInSegment', () => {
        let segment = { index: 1, type: NumSegment.TYPE_INT };
        expect(NumSegmentHandler.isEltInSegment(2, null)).equal(false);
        expect(NumSegmentHandler.isEltInSegment(null, segment)).equal(false);
        expect(NumSegmentHandler.isEltInSegment(2, segment)).equal(false);
        expect(NumSegmentHandler.isEltInSegment(1, segment)).equal(true);
    });

    it('test incNum', () => {
        let segment = { index: 1, type: NumSegment.TYPE_INT };
        expect(NumSegmentHandler.incNum(2, null, 3)).equal(5);
        expect(NumSegmentHandler.incNum(2, NumSegment.TYPE_INT, null)).equal(2);
        expect(NumSegmentHandler.incNum(null, NumSegment.TYPE_INT, 13)).equal(13);
        expect(NumSegmentHandler.incNum(1, NumSegment.TYPE_INT, -24)).equal(-23);
    });

    it('test decNum', () => {
        let segment = { index: 1, type: NumSegment.TYPE_INT };
        expect(NumSegmentHandler.decNum(2, null, 3)).equal(-1);
        expect(NumSegmentHandler.decNum(2, NumSegment.TYPE_INT, null)).equal(2);
        expect(NumSegmentHandler.decNum(null, NumSegment.TYPE_INT, 13)).equal(-13);
        expect(NumSegmentHandler.decNum(1, NumSegment.TYPE_INT, -24)).equal(25);
    });

    it('test get_segment_from_range_start', () => {
        expect(NumSegmentHandler.get_segment_from_range_start(
            null,
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_start(
            NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
    });


    it('test get_segment_from_range_end', () => {
        expect(NumSegmentHandler.get_segment_from_range_end(
            null,
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.get_segment_from_range_end(
            NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 1,
                type: NumSegment.TYPE_INT
            });
    });

    it('test getAllDataNumSegments', () => {
        expect(NumSegmentHandler.getAllDataNumSegments(null, null, null)).to.equal(null);
        expect(NumSegmentHandler.getAllDataNumSegments(1, 2, NumSegment.TYPE_INT)).to.deep.equal([
            {
                index: 1,
                type: NumSegment.TYPE_INT
            },
            {
                index: 2,
                type: NumSegment.TYPE_INT
            }
        ]);
        expect(NumSegmentHandler.getAllDataNumSegments(1, 2, NumSegment.TYPE_INT, true)).to.deep.equal([
            {
                index: 1,
                type: NumSegment.TYPE_INT
            }
        ]);
    });

    it('test getCorrespondingNumSegments', () => {
        expect(NumSegmentHandler.getCorrespondingNumSegments(
            [0.5, 2, null], NumSegment.TYPE_INT, 2
        )).to.deep.equal(
            [{ index: 2, type: NumSegment.TYPE_INT }, { index: 4, type: NumSegment.TYPE_INT }, { index: 2, type: NumSegment.TYPE_INT }]
        );

        expect(NumSegmentHandler.getCorrespondingNumSegments(
            null, NumSegment.TYPE_INT, 2
        )).to.deep.equal(
            []
        );
    });

    it('test getCorrespondingNumSegment', () => {
        expect(NumSegmentHandler.getCorrespondingNumSegment(
            0.5,
            NumSegment.TYPE_INT, 2)).to.deep.equal({
                index: 2,
                type: NumSegment.TYPE_INT
            });

        expect(NumSegmentHandler.getCorrespondingNumSegment(1, NumSegment.TYPE_INT)).to.deep.equal({
            index: 1,
            type: NumSegment.TYPE_INT
        });

        expect(NumSegmentHandler.getCorrespondingNumSegment(3, NumSegment.TYPE_INT)).to.deep.equal({
            index: 3,
            type: NumSegment.TYPE_INT
        });
        expect(NumSegmentHandler.getCorrespondingNumSegment(3, NumSegment.TYPE_INT, 1)).to.deep.equal({
            index: 4,
            type: NumSegment.TYPE_INT
        });
        expect(NumSegmentHandler.getCorrespondingNumSegment(3, NumSegment.TYPE_INT, -1)).to.deep.equal({
            index: 2,
            type: NumSegment.TYPE_INT
        });
    });

    it('test get_nums', () => {
        expect(NumSegmentHandler.get_nums(
            [{ index: 2, type: NumSegment.TYPE_INT }, { index: 4, type: NumSegment.TYPE_INT }, { index: 56, type: NumSegment.TYPE_INT }]
        )).to.deep.equal(
            [2, 4, 56]
        );

        expect(NumSegmentHandler.get_nums(
            null
        )).to.deep.equal(
            []
        );
    });


    it('test getEndNumSegment', () => {
        expect(NumSegmentHandler.getEndNumSegment(null)).to.equal(null);
        expect(NumSegmentHandler.getEndNumSegment({ index: 1, type: NumSegment.TYPE_INT })).to.equal(2);
    });

    it('test getPreviousNumSegment', () => {
        expect(NumSegmentHandler.getPreviousNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        }, NumSegment.TYPE_INT)).to.deep.equal({
            index: 14,
            type: NumSegment.TYPE_INT
        });

        expect(NumSegmentHandler.getPreviousNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        }, NumSegment.TYPE_INT, 2)).to.deep.equal({
            index: 13,
            type: NumSegment.TYPE_INT
        });

        expect(NumSegmentHandler.getPreviousNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        }, NumSegment.TYPE_INT, -1)).to.deep.equal({
            index: 16,
            type: NumSegment.TYPE_INT
        });
    });

    it('test getPreviousNumSegments', () => {
        expect(NumSegmentHandler.getPreviousNumSegments(
            [{ index: 16, type: NumSegment.TYPE_INT }, { index: 18, type: NumSegment.TYPE_INT }, { index: 14, type: NumSegment.TYPE_INT }], NumSegment.TYPE_INT
        )).to.deep.equal(
            [{ index: 15, type: NumSegment.TYPE_INT }, { index: 17, type: NumSegment.TYPE_INT }, { index: 13, type: NumSegment.TYPE_INT }]
        );

        expect(NumSegmentHandler.getPreviousNumSegments([], NumSegment.TYPE_INT)).to.deep.equal([]);
        expect(NumSegmentHandler.getPreviousNumSegments(null, NumSegment.TYPE_INT)).equal(null);


    });

    it('test getStartNumSegment', () => {
        expect(NumSegmentHandler.getStartNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        })).to.deep.equal(15);
    });

    it('test get_num_ranges', () => {
        expect(NumSegmentHandler.get_num_ranges(
            [{
                index: 2, type: NumSegment.TYPE_INT
            }, {
                index: 4, type: NumSegment.TYPE_INT
            }, {
                index: 0, type: NumSegment.TYPE_INT
            }]
        )).to.deep.equal(
            [{
                max: 1, max_inclusiv: false, min: 0, min_inclusiv: true, range_type: 1, segment_type: 0
            },
            {
                max: 3, max_inclusiv: false, min: 2, min_inclusiv: true, range_type: 1, segment_type: 0
            }, {
                max: 5, max_inclusiv: false, min: 4, min_inclusiv: true, range_type: 1, segment_type: 0
            }]);

        expect(NumSegmentHandler.get_num_ranges(null)).to.deep.equal(null);
    });

    it('test get_num_ranges_', () => {
        expect(NumSegmentHandler["get_num_ranges_"](
            [{
                index: 2, type: NumSegment.TYPE_INT
            }, {
                index: 4, type: NumSegment.TYPE_INT
            }, {
                index: 0, type: NumSegment.TYPE_INT
            }]
        )).to.deep.equal(
            [{
                max: 3, max_inclusiv: false, min: 2, min_inclusiv: true, range_type: 1, segment_type: 0
            }, {
                max: 5, max_inclusiv: false, min: 4, min_inclusiv: true, range_type: 1, segment_type: 0
            }, {
                max: 1, max_inclusiv: false, min: 0, min_inclusiv: true, range_type: 1, segment_type: 0
            }]);

        expect(NumSegmentHandler["get_num_ranges_"](null)).to.deep.equal([]);
    });

    it('test get_surrounding_ts_range', () => {
        expect(NumSegmentHandler.get_surrounding_ts_range(
            [{ index: 2, type: NumSegment.TYPE_INT }, { index: 4, type: NumSegment.TYPE_INT }, { index: 0, type: NumSegment.TYPE_INT }]
        )).to.deep.equal(
            {
                max: 5, max_inclusiv: false, min: 0, min_inclusiv: true, range_type: 1, segment_type: 0
            });

        expect(NumSegmentHandler.get_num_ranges(null)).to.deep.equal(null);
    });


});
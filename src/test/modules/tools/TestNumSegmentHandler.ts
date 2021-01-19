import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import NumSegmentHandler from '../../../shared/tools/NumSegmentHandler';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';

describe('NumSegmentHandler', () => {


    it('test get_segment_from_range_start', () => {
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            null,
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_start(
            NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
    });


    it('test get_segment_from_range_end', () => {
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            null,
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(0, 0, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(0, 0, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(0, 0, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(0, 0, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: -1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 0,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-0.5, 0.5, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal(null);


        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-2, 2, true, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-2, 2, false, true, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 2,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-2, 2, true, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 1,
                type: NumSegment.TYPE_INT
            });
        expect(NumSegmentHandler.getInstance().get_segment_from_range_end(
            NumRange.createNew(-2, 2, false, false, NumSegment.TYPE_INT),
            NumSegment.TYPE_INT)).to.deep.equal({
                index: 1,
                type: NumSegment.TYPE_INT
            });
    });

    it('test getAllDataNumSegments', () => {
        expect(NumSegmentHandler.getInstance().getAllDataNumSegments(null, null, null)).to.equal(null);
        expect(NumSegmentHandler.getInstance().getAllDataNumSegments(1, 2, NumSegment.TYPE_INT)).to.deep.equal([
            {
                index: 1,
                type: NumSegment.TYPE_INT
            },
            {
                index: 2,
                type: NumSegment.TYPE_INT
            }
        ]);
        expect(NumSegmentHandler.getInstance().getAllDataNumSegments(1, 2, NumSegment.TYPE_INT, true)).to.deep.equal([
            {
                index: 1,
                type: NumSegment.TYPE_INT
            }
        ]);
    });

    it('test getCorrespondingNumSegment', () => {
        expect(NumSegmentHandler.getInstance().getCorrespondingNumSegment(
            0.5,
            NumSegment.TYPE_INT, 2)).to.deep.equal({
                index: 2,
                type: NumSegment.TYPE_INT
            });

        expect(NumSegmentHandler.getInstance().getCorrespondingNumSegment(1, NumSegment.TYPE_INT)).to.deep.equal({
            index: 1,
            type: NumSegment.TYPE_INT
        });

        expect(NumSegmentHandler.getInstance().getCorrespondingNumSegment(3, NumSegment.TYPE_INT)).to.deep.equal({
            index: 3,
            type: NumSegment.TYPE_INT
        });
        expect(NumSegmentHandler.getInstance().getCorrespondingNumSegment(3, NumSegment.TYPE_INT, 1)).to.deep.equal({
            index: 4,
            type: NumSegment.TYPE_INT
        });
        expect(NumSegmentHandler.getInstance().getCorrespondingNumSegment(3, NumSegment.TYPE_INT, -1)).to.deep.equal({
            index: 2,
            type: NumSegment.TYPE_INT
        });
    });

    it('test getEndNumSegment', () => {
        expect(NumSegmentHandler.getInstance().getEndNumSegment(null)).to.equal(null);
        expect(NumSegmentHandler.getInstance().getEndNumSegment({
            index: 1,
            type: NumSegment.TYPE_INT
        })).to.equal(2);
    });

    it('test getPreviousNumSegment', () => {
        expect(NumSegmentHandler.getInstance().getPreviousNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        }, NumSegment.TYPE_INT)).to.deep.equal({
            index: 14,
            type: NumSegment.TYPE_INT
        });

        expect(NumSegmentHandler.getInstance().getPreviousNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        }, NumSegment.TYPE_INT, 2)).to.deep.equal({
            index: 13,
            type: NumSegment.TYPE_INT
        });

        expect(NumSegmentHandler.getInstance().getPreviousNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        }, NumSegment.TYPE_INT, -1)).to.deep.equal({
            index: 16,
            type: NumSegment.TYPE_INT
        });
    });

    it('test getStartNumSegment', () => {
        expect(NumSegmentHandler.getInstance().getStartNumSegment({
            index: 15,
            type: NumSegment.TYPE_INT
        })).to.deep.equal(15);
    });
});
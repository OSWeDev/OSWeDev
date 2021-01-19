import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';

describe('ObjectHandler', () => {

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



        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(2, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            2: null
        });

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange({
            1: null,
            2: null,
            3: 'c'
        }, NumRange.createNew(3, 3, true, true, NumSegment.TYPE_INT))).to.deep.equal({
            3: 'c'
        });



        expect(ObjectHandler.getInstance().filterVosIdsByNumRange([undefined, undefined, undefined, 'c'], NumRange.createNew(1, 1, true, true, NumSegment.TYPE_INT))).to.deep.equal({});

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange([undefined, undefined, undefined, 'c'], NumRange.createNew(1, 2, true, true, NumSegment.TYPE_INT))).to.deep.equal({});

        expect(ObjectHandler.getInstance().filterVosIdsByNumRange([undefined, undefined, undefined, 'c'], NumRange.createNew(1, 3, true, true, NumSegment.TYPE_INT))).to.deep.equal({
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
    it('test filterVosDateIndexesByTSRange', () => {
    });
    it('test filterVosDateIndexesByTSRanges', () => {
    });
});
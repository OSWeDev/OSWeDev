import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import FakeDataVO from '../vos/FakeDataVO';

export default class FakeGVarController extends VarServerControllerBase<FakeDataVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeGVarController {
        if (!FakeGVarController.instance) {
            FakeGVarController.instance = new FakeGVarController();
        }
        return FakeGVarController.instance;
    }

    protected static instance: FakeGVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeGVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 7),
            {}, {}, {}, {}
        );
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        return 7;
    }
}
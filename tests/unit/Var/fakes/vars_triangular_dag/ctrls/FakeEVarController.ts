import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import FakeDataVO from '../vos/FakeDataVO';

export default class FakeEVarController extends VarServerControllerBase<FakeDataVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeEVarController {
        if (!FakeEVarController.instance) {
            FakeEVarController.instance = new FakeEVarController();
        }
        return FakeEVarController.instance;
    }

    protected static instance: FakeEVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeEVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 5),
            {}, {}, {}, {}
        );
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        return 5;
    }
}
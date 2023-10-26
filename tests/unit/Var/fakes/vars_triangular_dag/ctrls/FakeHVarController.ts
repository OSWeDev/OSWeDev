import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/shared/modules/Var/graph/VarDAGNode';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import FakeDataVO from '../vos/FakeDataVO';

export default class FakeHVarController extends VarServerControllerBase<FakeDataVO> {

    public static getInstance(): FakeHVarController {
        if (!FakeHVarController.instance) {
            FakeHVarController.instance = new FakeHVarController();
        }
        return FakeHVarController.instance;
    }

    protected static instance: FakeHVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeHVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 8),
            {}, {}, {}, {}
        );

        this.optimization__has_no_imports = true;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        return 8;
    }
}
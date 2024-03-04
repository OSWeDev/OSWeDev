import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/server/modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import FakeDataVO from '../vos/FakeDataVO';

export default class FakeFVarController extends VarServerControllerBase<FakeDataVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): FakeFVarController {
        if (!FakeFVarController.instance) {
            FakeFVarController.instance = new FakeFVarController();
        }
        return FakeFVarController.instance;
    }

    protected static instance: FakeFVarController = null;

    protected constructor() {
        super(
            new VarConfVO('FakeFVarController', FakeDataVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_DAY
            }, 6),
            {}, {}, {}, {}
        );

        this.optimization__has_no_imports = true;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        return 6;
    }
}
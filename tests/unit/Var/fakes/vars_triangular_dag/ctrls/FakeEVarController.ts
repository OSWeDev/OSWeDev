import VarServerControllerBase from '../../../../../../src/server/modules/Var/VarServerControllerBase';
import TimeSegment from '../../../../../../src/shared/modules/DataRender/vos/TimeSegment';
import VarDAGNode from '../../../../../../src/shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../../../src/shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../../../src/shared/modules/Var/vos/VarConfVO';
import FakeDataVO from '../vos/FakeDataVO';

export default class FakeEVarController extends VarServerControllerBase<FakeDataVO> {

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

        this.optimization__has_no_imports = true;
    }

    public getVarCacheConf(): VarCacheConfVO {
        let res: VarCacheConfVO = new VarCacheConfVO();
        res.id = 5;
        res.var_id = this.varConf.id;
        return res;
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        return 5;
    }
}
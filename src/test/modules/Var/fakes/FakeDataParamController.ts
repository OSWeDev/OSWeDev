import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import VarDataParamControllerBase from '../../../../shared/modules/Var/VarDataParamControllerBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import FakeDataParamVO from './vos/FakeDataParamVO';
import FakeDataVO from './vos/FakeDataVO';

export default class FakeDataParamController extends VarDataParamControllerBase<FakeDataVO, FakeDataParamVO> {

    public static getInstance() {
        if (!FakeDataParamController.instance) {
            FakeDataParamController.instance = new FakeDataParamController();
        }

        return FakeDataParamController.instance;
    }

    private static instance: FakeDataParamController = null;

    public segment_type: number = TimeSegment.TYPE_DAY;

    protected constructor() {
        super();
    }

    public cloneParam(param: FakeDataParamVO): FakeDataParamVO {
        let res: FakeDataParamVO = new FakeDataParamVO();

        res.ts_ranges = RangeHandler.getInstance().cloneArrayFrom(param.ts_ranges);
        res.var_id = param.var_id;

        return res;
    }

    public getIndex(param: FakeDataParamVO): string {
        let res: string = "";

        res += param.var_id;

        res += "_" + RangeHandler.getInstance().getIndexRanges(param.ts_ranges);

        return res;
    }
}
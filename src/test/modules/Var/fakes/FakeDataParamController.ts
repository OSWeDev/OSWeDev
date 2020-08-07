import * as moment from 'moment';
import { Moment } from 'moment';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import VarDataParamControllerBase from '../../../../shared/modules/Var/VarDataParamControllerBase';
import FakeDataParamVO from './vos/FakeDataParamVO';
import FakeDataVO from './vos/FakeDataVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';

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

    public getImpactedParamsList(paramUpdated: FakeDataParamVO, paramsRegisteredByIndex: { [index: string]: FakeDataParamVO }): FakeDataParamVO[] {
        if ((!paramUpdated) || (!paramUpdated.ts_ranges) || (!paramsRegisteredByIndex)) {
            return null;
        }

        let res: FakeDataParamVO[] = [];

        for (let index in paramsRegisteredByIndex) {
            let paramRegistered: FakeDataParamVO = paramsRegisteredByIndex[index];

            if ((paramRegistered.var_id == paramUpdated.var_id) &&
                RangeHandler.getInstance().any_range_intersects_any_range(paramRegistered.ts_ranges, paramUpdated.ts_ranges)) {
                res.push(paramRegistered);
            }
        }
        return res;
    }

    public getIndex(param: FakeDataParamVO): string {
        let res: string = "";

        res += param.var_id;

        res += "_" + RangeHandler.getInstance().getIndexRanges(param.ts_ranges);

        return res;
    }
}
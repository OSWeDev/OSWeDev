import * as moment from 'moment';
import { Moment } from 'moment';
import FakeDataParamVO from './vos/FakeDataParamVO';
import VarDataParamControllerBase from '../../../../src/shared/modules/Var/VarDataParamControllerBase';
import VarsController from '../../../../src/shared/modules/Var/VarsController';
import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';

export default class FakeDataParamController extends VarDataParamControllerBase<FakeDataParamVO> {

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

    public getImpactedParamsList(paramUpdated: FakeDataParamVO, paramsRegisteredByIndex: { [index: string]: FakeDataParamVO }): FakeDataParamVO[] {
        if ((!paramUpdated) || (!paramUpdated.date_index) || (!paramsRegisteredByIndex)) {
            return null;
        }

        let res: FakeDataParamVO[] = [];

        for (let index in paramsRegisteredByIndex) {
            let paramRegistered: FakeDataParamVO = paramsRegisteredByIndex[index];

            if ((paramRegistered.var_id == paramUpdated.var_id) &&
                (paramUpdated.fake_y_id == paramRegistered.fake_y_id) &&
                (paramUpdated.fake_z_id == paramRegistered.fake_z_id) &&
                moment(paramRegistered.date_index).isAfter(moment(paramUpdated.date_index))) {
                res.push(paramRegistered);
            }
        }
        return res;
    }

    public getIndex(param: FakeDataParamVO): string {
        let res: string = "";

        res += param.var_id;

        res += "_" + (param.date_index ? param.date_index : "");
        res += "_" + (param.fake_y_id ? param.fake_y_id : "");
        res += "_" + (param.fake_z_id ? param.fake_z_id : "");

        return res;
    }

    protected compareParams(paramA: FakeDataParamVO, paramB: FakeDataParamVO) {

        if ((!paramA) || (!paramB)) {
            return null;
        }

        let diff: number = paramA.fake_y_id - paramB.fake_y_id;

        if (diff) {
            return diff;
        }

        diff = paramA.fake_z_id - paramB.fake_z_id;

        if (diff) {
            return diff;
        }

        let momentA: Moment = moment(paramA.date_index);
        let momentB: Moment = moment(paramB.date_index);

        return momentA.diff(momentB);
    }
}
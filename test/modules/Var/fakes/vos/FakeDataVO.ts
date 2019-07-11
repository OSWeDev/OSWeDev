import ISimpleNumberVarData from '../../../../../src/shared/modules/Var/interfaces/ISimpleNumberVarData';
import FakeDataParamVO from './FakeDataParamVO';
import { Moment } from 'moment';

export default class FakeDataVO extends FakeDataParamVO implements ISimpleNumberVarData {

    public static API_TYPE_ID: string = "fake_data";

    public _type: string = FakeDataVO.API_TYPE_ID;
    public datafound: boolean;

    public value: number;

    public value_type: number;
    public value_ts: Moment;
    public missing_datas_infos: string[];
}
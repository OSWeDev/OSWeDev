import { Moment } from 'moment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import VarDataBaseVO from '../../../../../shared/modules/Var/params/VarDataBaseVO';

export default class FakeDataVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "fake_data";

    public id: number;
    public var_id: number;
    public _type: string = FakeDataVO.API_TYPE_ID;

    public value: number;
    public ts_ranges: TSRange[];

    public value_type: number;
    public value_ts: Moment;
    public missing_datas_infos: string[];
}
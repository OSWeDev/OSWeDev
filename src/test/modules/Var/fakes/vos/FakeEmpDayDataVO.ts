
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';

export default class FakeEmpDayDataVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "fake_empdaydata";

    public id: number;
    public _type: string = FakeEmpDayDataVO.API_TYPE_ID;

    public var_id: number;

    public value: number;
    public ts_ranges: TSRange[];
    public employee_id_ranges: NumRange[];

    public value_type: number;
    public value_ts: number;
}
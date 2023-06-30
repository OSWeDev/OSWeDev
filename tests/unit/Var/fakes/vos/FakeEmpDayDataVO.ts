import NumRange from "../../../../../src/shared/modules/DataRender/vos/NumRange";
import TSRange from "../../../../../src/shared/modules/DataRender/vos/TSRange";
import VarDataBaseVO from "../../../../../src/shared/modules/Var/vos/VarDataBaseVO";


export default class FakeEmpDayDataVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "fake_empdaydata";

    public id: number;
    public _type: string = FakeEmpDayDataVO.API_TYPE_ID;

    public value: number;
    public _ts_ranges: TSRange[];
    public _employee_id_ranges: NumRange[];

    public value_type: number;
    public value_ts: number;

    get ts_ranges(): TSRange[] { return this._ts_ranges; }
    set ts_ranges(ts_ranges: TSRange[]) {
        this.set_field('ts_ranges', ts_ranges);
    }

    get employee_id_ranges(): NumRange[] { return this._employee_id_ranges; }
    set employee_id_ranges(employee_id_ranges: NumRange[]) {
        this.set_field('employee_id_ranges', employee_id_ranges);
    }
}
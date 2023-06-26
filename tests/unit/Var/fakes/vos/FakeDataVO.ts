import TSRange from "../../../../../src/shared/modules/DataRender/vos/TSRange";
import VarDataBaseVO from "../../../../../src/shared/modules/Var/vos/VarDataBaseVO";


export default class FakeDataVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "fake_data";

    public id: number;
    public _type: string = FakeDataVO.API_TYPE_ID;

    public value: number;
    public _ts_ranges: TSRange[];

    public value_type: number;
    public value_ts: number;

    get ts_ranges(): TSRange[] { return this._ts_ranges; }
    set ts_ranges(ts_ranges: TSRange[]) {
        this.set_field('ts_ranges', ts_ranges);
    }
}
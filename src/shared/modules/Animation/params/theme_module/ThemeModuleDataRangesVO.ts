import { Moment } from "moment";
import NumRange from "../../../DataRender/vos/NumRange";
import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";

export default class ThemeModuleDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "theme_module_data_ranges";

    public static createNew<T extends VarDataBaseVO>(var_name: string, clone_fields: boolean = true, theme_id_ranges: NumRange[], module_id_ranges: NumRange[], user_id_ranges: NumRange[]): T {
        return VarDataBaseVO.createNew(
            var_name,
            clone_fields,
            theme_id_ranges,
            module_id_ranges,
            user_id_ranges
        );
    }

    public _type: string = ThemeModuleDataRangesVO.API_TYPE_ID;

    public value: number;
    public value_type: number;
    public value_ts: Moment;

    public id: number;
    public var_id: number;

    public theme_id_ranges: NumRange[];
    public module_id_ranges: NumRange[];
    public user_id_ranges: NumRange[];
}
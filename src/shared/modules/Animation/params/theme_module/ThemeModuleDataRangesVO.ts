import { Moment } from "moment";
import NumRange from "../../../DataRender/vos/NumRange";
import VarsController from "../../../Var/VarsController";
import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";

export default class ThemeModuleDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "theme_module_data_ranges";

    public static createNew<T extends VarDataBaseVO>(var_name: string, clone_fields: boolean = true, theme_id_ranges: NumRange[], module_id_ranges: NumRange[], user_id_ranges: NumRange[]): T {
        let res = new ThemeModuleDataRangesVO();

        res.var_id = VarsController.getInstance().var_conf_by_name[var_name].id;

        if (theme_id_ranges) {
            for (let i in theme_id_ranges) {
                if (!theme_id_ranges[i]) {
                    return null;
                }
            }
        }

        if (module_id_ranges) {
            for (let i in module_id_ranges) {
                if (!module_id_ranges[i]) {
                    return null;
                }
            }
        }

        if (user_id_ranges) {
            for (let i in user_id_ranges) {
                if (!user_id_ranges[i]) {
                    return null;
                }
            }
        }

        res.theme_id_ranges = theme_id_ranges;
        res.module_id_ranges = module_id_ranges;
        res.user_id_ranges = user_id_ranges;

        return res as any as T;
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
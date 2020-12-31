import NumRange from "../../../DataRender/vos/NumRange";
import IVarDataParamVOBase from '../../../Var/interfaces/IVarDataParamVOBase';

export default class ThemeModuleDataParamRangesVO implements IVarDataParamVOBase {

    public static API_TYPE_ID: string = "theme_module_param_ranges";

    public static createNew(var_id: number, theme_id_ranges: NumRange[], module_id_ranges: NumRange[]): ThemeModuleDataParamRangesVO {
        let res = new ThemeModuleDataParamRangesVO();

        res.var_id = var_id;

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

        res.theme_id_ranges = theme_id_ranges;
        res.module_id_ranges = module_id_ranges;

        return res;
    }

    public id: number;
    public _type: string = ThemeModuleDataParamRangesVO.API_TYPE_ID;

    public var_id: number;

    public theme_id_ranges: NumRange[];
    public module_id_ranges: NumRange[];
}
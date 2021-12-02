import NumRange from "../../../DataRender/vos/NumRange";
import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";

/**
 * Paramètre pour le calcul de variables animation
 * @see variables {@link VarDayTempsPasseAnimationController: temps passé},
 * {@link VarDayPrctReussiteAnimationController: pourcentage réussite},
 * {@link VarDayPrctAvancementAnimationController: avancement},
 * {@link VarDayPrctAtteinteSeuilAnimationController: pourcentage modules validés}
 */
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
    public value_ts: number;

    public id: number;

    public _theme_id_ranges: NumRange[];
    public _module_id_ranges: NumRange[];
    public _user_id_ranges: NumRange[];

    get theme_id_ranges(): NumRange[] { return this._theme_id_ranges; }
    set theme_id_ranges(theme_id_ranges: NumRange[]) {
        this.set_field('theme_id_ranges', theme_id_ranges);
    }

    get module_id_ranges(): NumRange[] { return this._module_id_ranges; }
    set module_id_ranges(module_id_ranges: NumRange[]) {
        this.set_field('module_id_ranges', module_id_ranges);
    }

    get user_id_ranges(): NumRange[] { return this._user_id_ranges; }
    set user_id_ranges(user_id_ranges: NumRange[]) {
        this.set_field('user_id_ranges', user_id_ranges);
    }
}
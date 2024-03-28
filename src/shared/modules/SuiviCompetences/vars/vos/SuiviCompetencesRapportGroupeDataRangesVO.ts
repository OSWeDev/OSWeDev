import ConsoleHandler from "../../../../tools/ConsoleHandler";
import NumRange from "../../../DataRender/vos/NumRange";
import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";


export default class SuiviCompetencesRapportGroupeDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "suivi_comp_r_g_dr";

    public static createNew<T extends VarDataBaseVO>(
        var_name: string,
        clone_fields: boolean,
        suivi_comp_rapport_id_ranges: NumRange[],
        suivi_comp_groupe_id_ranges: NumRange[],
    ): T {

        if (
            (!suivi_comp_rapport_id_ranges) ||
            (!suivi_comp_groupe_id_ranges) ||

            (!suivi_comp_rapport_id_ranges.length) ||
            (!suivi_comp_groupe_id_ranges.length)
        ) {
            ConsoleHandler.error('Creating wrong param:' +
                JSON.stringify({
                    var_name,
                    suivi_comp_rapport_id_ranges,
                    suivi_comp_groupe_id_ranges,
                }));
            return null;
        }

        return super.createNew<T>(
            var_name,
            clone_fields,
            suivi_comp_rapport_id_ranges,
            suivi_comp_groupe_id_ranges,
        );
    }

    public _type: string = SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID;

    public _suivi_comp_rapport_id_ranges: NumRange[];
    public _suivi_comp_groupe_id_ranges: NumRange[];

    get suivi_comp_rapport_id_ranges(): NumRange[] { return this._suivi_comp_rapport_id_ranges; }
    set suivi_comp_rapport_id_ranges(suivi_comp_rapport_id_ranges: NumRange[]) {
        this.set_field('suivi_comp_rapport_id_ranges', suivi_comp_rapport_id_ranges);
    }

    get suivi_comp_groupe_id_ranges(): NumRange[] { return this._suivi_comp_groupe_id_ranges; }
    set suivi_comp_groupe_id_ranges(suivi_comp_groupe_id_ranges: NumRange[]) {
        this.set_field('suivi_comp_groupe_id_ranges', suivi_comp_groupe_id_ranges);
    }
}
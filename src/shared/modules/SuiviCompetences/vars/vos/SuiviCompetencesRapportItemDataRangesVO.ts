import ConsoleHandler from "../../../../tools/ConsoleHandler";
import NumRange from "../../../DataRender/vos/NumRange";
import TSRange from "../../../DataRender/vos/TSRange";
import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";

export default class SuiviCompetencesRapportItemDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "suivi_comp_r_item_dr";

    public static createNew<T extends VarDataBaseVO>(
        var_name: string,
        clone_fields: boolean,
        suivi_comp_rapport_id_ranges: NumRange[],
        suivi_comp_item_id_ranges: NumRange[],
        ts_ranges: TSRange[],
    ): T {

        if (
            (!suivi_comp_rapport_id_ranges) ||
            (!suivi_comp_item_id_ranges) ||
            (!ts_ranges) ||

            (!suivi_comp_rapport_id_ranges.length) ||
            (!suivi_comp_item_id_ranges.length) ||
            (!ts_ranges.length)
        ) {
            ConsoleHandler.error('Creating wrong param:' +
                JSON.stringify({
                    var_name,
                    suivi_comp_rapport_id_ranges,
                    suivi_comp_item_id_ranges,
                    ts_ranges,
                }));
            return null;
        }

        return super.createNew<T>(
            var_name,
            clone_fields,
            suivi_comp_rapport_id_ranges,
            suivi_comp_item_id_ranges,
            ts_ranges,
        );
    }

    public _type: string = SuiviCompetencesRapportItemDataRangesVO.API_TYPE_ID;

    public _suivi_comp_rapport_id_ranges: NumRange[];
    public _suivi_comp_item_id_ranges: NumRange[];
    public _ts_ranges: TSRange[];

    get suivi_comp_rapport_id_ranges(): NumRange[] { return this._suivi_comp_rapport_id_ranges; }
    set suivi_comp_rapport_id_ranges(suivi_comp_rapport_id_ranges: NumRange[]) {
        this.set_field('suivi_comp_rapport_id_ranges', suivi_comp_rapport_id_ranges);
    }

    get suivi_comp_item_id_ranges(): NumRange[] { return this._suivi_comp_item_id_ranges; }
    set suivi_comp_item_id_ranges(suivi_comp_item_id_ranges: NumRange[]) {
        this.set_field('suivi_comp_item_id_ranges', suivi_comp_item_id_ranges);
    }

    get ts_ranges(): TSRange[] { return this._ts_ranges; }
    set ts_ranges(ts_ranges: TSRange[]) {
        this.set_field('ts_ranges', ts_ranges);
    }
}
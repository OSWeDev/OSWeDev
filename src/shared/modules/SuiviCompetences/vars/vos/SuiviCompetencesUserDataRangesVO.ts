import ConsoleHandler from "../../../../tools/ConsoleHandler";
import NumRange from "../../../DataRender/vos/NumRange";
import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";

export default class SuiviCompetencesUserDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "suivi_comp_u_dr";

    public static createNew<T extends VarDataBaseVO>(
        var_name: string,
        clone_fields: boolean,
        user_id_ranges: NumRange[],
    ): T {

        if (
            (!user_id_ranges) ||

            (!user_id_ranges.length)
        ) {
            ConsoleHandler.error('Creating wrong param:' +
                JSON.stringify({
                    var_name,
                    user_id_ranges,
                }));
            return null;
        }

        return super.createNew<T>(
            var_name,
            clone_fields,
            user_id_ranges,
        );
    }

    public _type: string = SuiviCompetencesUserDataRangesVO.API_TYPE_ID;

    public _user_id_ranges: NumRange[];

    get user_id_ranges(): NumRange[] { return this._user_id_ranges; }
    set user_id_ranges(user_id_ranges: NumRange[]) {
        this.set_field('user_id_ranges', user_id_ranges);
    }
}
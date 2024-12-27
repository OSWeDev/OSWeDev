import VarDataBaseVO from "../../../Var/vos/VarDataBaseVO";
import ConsoleHandler from "../../../../tools/ConsoleHandler";
import NumRange from "../../../DataRender/vos/NumRange";


export default class SupervisionProbeStateDataRangesVO extends VarDataBaseVO {
    public static API_TYPE_ID: string = "sup_probe_state";

    public _type: string = SupervisionProbeStateDataRangesVO.API_TYPE_ID;

    public _probe_id_ranges: NumRange[];
    public _state_id_ranges: NumRange[];

    get probe_id_ranges(): NumRange[] { return this._probe_id_ranges; }
    get state_id_ranges(): NumRange[] { return this._state_id_ranges; }

    set probe_id_ranges(probe_id_ranges: NumRange[]) {
        this.set_field('probe_id_ranges', probe_id_ranges);
    }

    set state_id_ranges(state_id_ranges: NumRange[]) {
        this.set_field('state_id_ranges', state_id_ranges);
    }

    public static createNew<T extends VarDataBaseVO>(
        var_name: string,
        clone_fields: boolean,
        probe_id_ranges: NumRange[],
        state_id_ranges: NumRange[],
    ): T {

        if (
            (!probe_id_ranges) ||
            (!state_id_ranges)
        ) {
            ConsoleHandler.error('Creating wrong param:' +
                JSON.stringify({
                    var_name,
                    probe_id_ranges,
                    state_id_ranges,
                }));
            return null;
        }

        return super.createNew<T>(
            var_name,
            clone_fields,
            probe_id_ranges,
            state_id_ranges,
        );
    }


}
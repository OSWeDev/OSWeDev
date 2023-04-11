import ConsoleHandler from '../../../../tools/ConsoleHandler';
import NumRange from '../../../DataRender/vos/NumRange';
import TSRange from '../../../DataRender/vos/TSRange';
import VarDataBaseVO from '../../../Var/vos/VarDataBaseVO';


export default class StatsGroupSecDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "stats_groupe_sec_dr";

    public static createNew<T extends VarDataBaseVO>(
        var_name: string,
        clone_fields: boolean,
        stats_groupe_id_ranges: NumRange[],
        ts_ranges: TSRange[]): T {

        if ((!stats_groupe_id_ranges) ||
            (!ts_ranges) ||

            (!stats_groupe_id_ranges.length) ||
            (!ts_ranges.length)) {
            ConsoleHandler.error('Creating wrong param:' +
                JSON.stringify({
                    stats_groupe_id_ranges,
                    ts_ranges,
                }));
            return null;
        }

        return super.createNew(
            var_name, clone_fields,
            stats_groupe_id_ranges,
            ts_ranges);
    }

    public _type: string = StatsGroupSecDataRangesVO.API_TYPE_ID;

    public _stats_groupe_id_ranges: NumRange[];
    public _ts_ranges: TSRange[];

    get stats_groupe_id_ranges(): NumRange[] { return this._stats_groupe_id_ranges; }
    set stats_groupe_id_ranges(stats_groupe_id_ranges: NumRange[]) {
        this.set_field('stats_groupe_id_ranges', stats_groupe_id_ranges);
    }

    get ts_ranges(): TSRange[] { return this._ts_ranges; }
    set ts_ranges(ts_ranges: TSRange[]) {
        this.set_field('ts_ranges', ts_ranges);
    }
}
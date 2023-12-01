import ConsoleHandler from '../../../../tools/ConsoleHandler';
import NumRange from '../../../DataRender/vos/NumRange';
import TSRange from '../../../DataRender/vos/TSRange';
import VarDataBaseVO from '../../../Var/vos/VarDataBaseVO';


export default class UserMinDataRangesVO extends VarDataBaseVO {

    public static API_TYPE_ID: string = "user_min_dr";

    public static createNew<T extends VarDataBaseVO>(
        var_name: string,
        clone_fields: boolean,
        user_id_ranges: NumRange[],
        ts_ranges: TSRange[]): T {

        if ((!user_id_ranges) ||
            (!ts_ranges) ||

            (!user_id_ranges.length) ||
            (!ts_ranges.length)) {
            ConsoleHandler.error('Creating wrong param:' +
                JSON.stringify({
                    user_id_ranges,
                    ts_ranges,
                }));
            return null;
        }

        return super.createNew(
            var_name, clone_fields,
            user_id_ranges,
            ts_ranges);
    }

    public _type: string = UserMinDataRangesVO.API_TYPE_ID;

    public _user_id_ranges: NumRange[];
    public _ts_ranges: TSRange[];

    get user_id_ranges(): NumRange[] { return this._user_id_ranges; }
    set user_id_ranges(user_id_ranges: NumRange[]) {
        this.set_field('user_id_ranges', user_id_ranges);
    }

    get ts_ranges(): TSRange[] { return this._ts_ranges; }
    set ts_ranges(ts_ranges: TSRange[]) {
        this.set_field('ts_ranges', ts_ranges);
    }
}
import moment = require('moment');
import RangeHandler from '../../tools/RangeHandler';
import IRange from '../DataRender/interfaces/IRange';
import MatroidBase from './vos/MatroidBase';
import MatroidBaseCutResult from './vos/MatroidBaseCutResult';
import RangesCutResult from './vos/RangesCutResult';

export default class MatroidBaseController {

    public static getInstance(): MatroidBaseController {
        if (!MatroidBaseController.instance) {
            MatroidBaseController.instance = new MatroidBaseController();
        }
        return MatroidBaseController.instance;
    }

    private static instance: MatroidBaseController = null;

    private constructor() { }

    public async initialize() {
    }


    /**
     * TODO FIXME ASAP TU VARS
     * On définit le cardinal du matroid base par la somme des ranges
     * @param matroid_base
     */
    public get_cardinal<T>(matroid_base: MatroidBase<T>): number {

        if (!matroid_base) {
            return 0;
        }

        let cardinal = 0;

        for (let i in matroid_base.ranges) {

            if (!matroid_base.ranges[i]) {
                return null;
            }

            cardinal += RangeHandler.getInstance().getCardinal(matroid_base.ranges[i]);
        }
        return cardinal;
    }


    /**
     * FIXME TODO ASAP WITH TU
     */
    public matroidbase_intersects_matroidbase<T>(a: MatroidBase<T>, b: MatroidBase<T>): boolean {
        // Si l'un des ranges intersect, les matroid base intersectent

        if ((!a) || (!b) || (a.api_type_id != b.api_type_id) || (a.field_id != b.field_id)) {
            return false;
        }



        for (let i in a.ranges) {
            let range_a = a.ranges[i];

            if (RangeHandler.getInstance().range_intersects_any_range(range_a, b.ranges)) {
                return true;
            }
        }
        return false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public matroidbase_intersects_any_matroidbase<T>(a: MatroidBase<T>, bs: Array<MatroidBase<T>>): boolean {
        for (let i in bs) {
            if (this.matroidbase_intersects_matroidbase(a, bs[i])) {
                return true;
            }
        }

        return false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public cut_matroid_base<T>(matroidbase_cutter: MatroidBase<T>, matroidbase_to_cut: MatroidBase<T>): MatroidBaseCutResult<T> {

        if (!matroidbase_to_cut) {
            return null;
        }

        if (!matroidbase_cutter) {
            return new MatroidBaseCutResult(null, matroidbase_to_cut);
        }

        let cut_result: RangesCutResult<IRange<T>> = RangeHandler.getInstance().cuts_ranges(matroidbase_cutter.ranges, matroidbase_to_cut.ranges);

        let res_chopped = (cut_result && cut_result.chopped_items && cut_result.chopped_items.length) ?
            MatroidBase.createNew(
                matroidbase_to_cut.api_type_id, matroidbase_to_cut.field_id,
                cut_result.chopped_items) :
            null;
        let res_remaining_items = (cut_result && cut_result.remaining_items && cut_result.remaining_items.length) ?
            MatroidBase.createNew(
                matroidbase_to_cut.api_type_id, matroidbase_to_cut.field_id,
                cut_result.remaining_items) :
            null;

        return (res_chopped || res_remaining_items) ? new MatroidBaseCutResult(
            res_chopped,
            res_remaining_items
        ) : null;
    }
}
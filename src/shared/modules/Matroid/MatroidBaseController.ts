import moment = require('moment');
import FieldRangeHandler from '../../tools/FieldRangeHandler';
import FieldRange from '../DataRender/vos/FieldRange';
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

    public matroidbase_intersects_matroidbase<T>(a: MatroidBase<T>, b: MatroidBase<T>): boolean {
        // Si l'un des ranges intersect, les matroid base intersectent

        if ((!a) || (!a.cardinal) || (!b) || (!b.cardinal) || (a.api_type_id != b.api_type_id) || (a.field_id + b.field_id)) {
            return false;
        }

        for (let i in a.ranges) {
            let range_a = a.ranges[i];

            if (FieldRangeHandler.getInstance().elt_intersects_any_range(range_a, b.ranges)) {
                return true;
            }
        }
        return false;
    }

    public matroidbase_intersects_any_matroidbase<T>(a: MatroidBase<T>, bs: Array<MatroidBase<T>>): boolean {
        for (let i in bs) {
            if (this.matroidbase_intersects_matroidbase(a, bs[i])) {
                return true;
            }
        }

        return false;
    }

    public cut_matroid_base<T>(matroidbase_cutter: MatroidBase<T>, matroidbase_to_cut: MatroidBase<T>): MatroidBaseCutResult<MatroidBase<T>> {

        let cut_result: RangesCutResult<FieldRange<T>> = FieldRangeHandler.getInstance().cuts_ranges(matroidbase_cutter.ranges, matroidbase_to_cut.ranges);

        return new MatroidBaseCutResult(
            MatroidBase.createNew(
                matroidbase_to_cut.api_type_id, matroidbase_to_cut.field_id, matroidbase_to_cut.segment_type,
                cut_result.chopped_items as Array<FieldRange<any>>),
            MatroidBase.createNew(
                matroidbase_to_cut.api_type_id, matroidbase_to_cut.field_id, matroidbase_to_cut.segment_type,
                cut_result.remaining_items as Array<FieldRange<any>>),
        );
    }
}
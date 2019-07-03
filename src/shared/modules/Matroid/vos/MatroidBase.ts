import FieldRangeHandler from '../../../tools/FieldRangeHandler';
import FieldRange from '../../DataRender/vos/FieldRange';

export default class MatroidBase<T> {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param ranges on clone les ranges passés en param
     */
    public static createNew<T>(api_type_id: string, field_id: string, ranges: Array<FieldRange<T>>): MatroidBase<T> {
        let res: MatroidBase<T> = new MatroidBase<T>();
        let cardinal = 0;

        for (let i in ranges) {

            let from_fieldrange: FieldRange<T> = ranges[i];
            if (!from_fieldrange) {
                return null;
            }

            let res_fieldrange = FieldRangeHandler.getInstance().cloneFrom(from_fieldrange);
            res.ranges_.push(res_fieldrange);
            cardinal += FieldRangeHandler.getInstance().getCardinal(res_fieldrange);
        }
        res.api_type_id = api_type_id;
        res.field_id = field_id;
        res.cardinal = cardinal;

        return res;
    }

    public static cloneFrom<T>(from: MatroidBase<T>): MatroidBase<T> {
        let res: MatroidBase<T> = new MatroidBase<T>();
        res.ranges_ = [];

        for (let i in from.ranges) {

            let from_fieldrange: FieldRange<T> = from.ranges[i];
            if (!from_fieldrange) {
                return null;
            }

            let res_fieldrange = FieldRangeHandler.getInstance().cloneFrom(from_fieldrange);
            res.ranges_.push(res_fieldrange);
        }
        res.api_type_id = from.api_type_id;
        res.field_id = from.field_id;
        res.cardinal = from.cardinal;

        return res;
    }

    public api_type_id: string;
    public field_id: string;

    public cardinal: number;

    private ranges_: Array<FieldRange<T>> = [];

    private constructor() { }

    get ranges(): Array<FieldRange<T>> {
        return this.ranges_;
    }
}
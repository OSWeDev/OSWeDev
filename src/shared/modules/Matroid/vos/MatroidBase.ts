import IRange from '../../DataRender/interfaces/IRange';
import RangeHandler from '../../../tools/RangeHandler';

export default class MatroidBase<T> {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param ranges on clone les ranges passés en param
     */
    public static createNew<T>(api_type_id: string, field_id: string, ranges: Array<IRange<T>>): MatroidBase<T> {
        let res: MatroidBase<T> = new MatroidBase<T>();

        for (let i in ranges) {

            let from_IRange: IRange<T> = ranges[i];
            if (!from_IRange) {
                return null;
            }

            let res_IRange = RangeHandler.getInstance().cloneFrom(from_IRange);
            res.ranges_.push(res_IRange);
        }
        res.api_type_id = api_type_id;
        res.field_id = field_id;

        return res;
    }

    public static cloneFrom<T>(from: MatroidBase<T>): MatroidBase<T> {
        let res: MatroidBase<T> = new MatroidBase<T>();
        res.ranges_ = [];

        for (let i in from.ranges) {

            let from_IRange: IRange<T> = from.ranges[i];
            if (!from_IRange) {
                return null;
            }

            let res_IRange = RangeHandler.getInstance().cloneFrom(from_IRange);
            res.ranges_.push(res_IRange);
        }
        res.api_type_id = from.api_type_id;
        res.field_id = from.field_id;

        return res;
    }

    public api_type_id: string;
    public field_id: string;

    private ranges_: Array<IRange<T>> = [];

    private constructor() { }

    get ranges(): Array<IRange<T>> {
        return this.ranges_;
    }
}
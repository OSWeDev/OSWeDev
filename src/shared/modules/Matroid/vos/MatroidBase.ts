import IRange from '../../DataRender/interfaces/IRange';
import RangeHandler from '../../../tools/RangeHandler';

export default class MatroidBase {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param ranges on clone les ranges passés en param
     */
    public static createNew(api_type_id: string, field_id: string, ranges: IRange[]): MatroidBase {
        let res: MatroidBase = new MatroidBase();

        for (let i in ranges) {

            let from_IRange: IRange = ranges[i];
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

    public static cloneFrom(from: MatroidBase): MatroidBase {
        let res: MatroidBase = new MatroidBase();
        res.ranges_ = [];

        for (let i in from.ranges) {

            let from_IRange: IRange = from.ranges[i];
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

    private ranges_: IRange[] = [];

    private constructor() { }

    get ranges(): IRange[] {
        return this.ranges_;
    }
}
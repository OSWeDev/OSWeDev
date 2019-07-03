import * as clonedeep from 'lodash/clonedeep';
import FieldRangeHandler from '../../../tools/FieldRangeHandler';
import IRange from '../interfaces/IRange';

export default class FieldRange<T> implements IRange<T>  {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param min_inclusiv defaults to true
     * @param max_inclusiv defaults to true
     */
    public static createNew<T>(api_type_id: string, field_id: string, min: T = null, max: T = null, min_inclusiv: boolean = true, max_inclusiv: boolean = true): FieldRange<T> {

        let relevantHandler = FieldRangeHandler.getInstance().getRelevantHandlerFromStrings(api_type_id, field_id);
        let range: IRange<T> = relevantHandler ? relevantHandler.createNew(min, max, min_inclusiv, max_inclusiv) : null;
        if (!range) {
            return null;
        }

        let res: FieldRange<T> = range as any;
        res.api_type_id = api_type_id;
        res.field_id = field_id;

        return res;
    }

    public static cloneFrom<T>(from: FieldRange<T>): FieldRange<T> {
        let relevantHandler = FieldRangeHandler.getInstance().getRelevantHandlerFromStrings(from.api_type_id, from.field_id);
        let range: IRange<T> = relevantHandler ? relevantHandler.createNew(from.min, from.max, from.min_inclusiv, from.max_inclusiv) : null;
        if (!range) {
            return null;
        }

        let res: FieldRange<T> = range as any;
        res.api_type_id = from.api_type_id;
        res.field_id = from.field_id;

        return res;
    }

    public api_type_id: string;
    public field_id: string;

    public min: T;
    public max: T;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    private constructor() { }
}
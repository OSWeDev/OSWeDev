import * as moment from 'moment';
import { Moment } from 'moment';
import FieldRange from '../modules/DataRender/vos/FieldRange';
import RangeHandler from './RangeHandler';
import ModuleTableField from '../modules/ModuleTableField';
import VOsTypesManager from '../modules/VOsTypesManager';
import NumRangeHandler from './NumRangeHandler';
import TSRangeHandler from './TSRangeHandler';
import DateHandler from './DateHandler';

export default class FieldRangeHandler extends RangeHandler<any> {
    public static getInstance(): FieldRangeHandler {
        if (!FieldRangeHandler.instance) {
            FieldRangeHandler.instance = new FieldRangeHandler();
        }
        return FieldRangeHandler.instance;
    }

    private static instance: FieldRangeHandler = null;

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public ranges_are_contiguous_or_intersect<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.ranges_are_contiguous_or_intersect(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isStartABeforeStartB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isStartASameStartB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isEndABeforeEndB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isEndASameEndB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartABeforeEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isStartABeforeEndB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartASameEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isStartASameEndB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.api_type_id != range_b.api_type_id) {
            return false;
        }

        if (range_a.field_id != range_b.field_id) {
            return false;
        }

        let relevantHandler = this.getRelevantHandler(range_a);
        return relevantHandler ? relevantHandler.isEndABeforeStartB(range_a as any, range_b as any) : false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
     * @param ranges
     */
    public getMinSurroundingRange<T>(ranges: Array<FieldRange<T>>): FieldRange<T> {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let relevantHandler = this.getRelevantHandler(ranges[0]);
        let res: FieldRange<T> = relevantHandler ? relevantHandler.getMinSurroundingRange(ranges as any) as any : null;

        if (res) {
            res.api_type_id = ranges[0].api_type_id;
            res.field_id = ranges[0].field_id;
        }
        return res;
    }

    public createNew<T>(api_type_id: string, field_i: string, min: T = null, max: T = null, min_inclusiv: boolean = null, max_inclusiv: boolean = null): FieldRange<T> {
        return FieldRange.createNew(api_type_id, field_i, min, max, min_inclusiv, max_inclusiv);
    }

    public cloneFrom<T>(from: FieldRange<T>): FieldRange<T> {
        return FieldRange.cloneFrom(from);
    }

    public getRelevantHandler<T>(field_range: FieldRange<T>): RangeHandler<any> {
        return this.getRelevantHandlerFromStrings(field_range ? field_range.api_type_id : null, field_range ? field_range.field_id : null);
    }

    public getRelevantHandlerFromStrings<T>(api_type_id: string, field_id: string): RangeHandler<any> {

        let vo_moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        if ((!vo_moduletable) || (!vo_moduletable.getFieldFromId(field_id))) {
            return null;
        }

        let field = vo_moduletable.getFieldFromId(field_id);

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_prct:

                return NumRangeHandler.getInstance();

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_daterange_array:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_timestamp:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:

                return TSRangeHandler.getInstance();
        }

        return null;
    }

    public getFormattedMinForAPI<T>(range: FieldRange<T>): string {
        let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
        return handler ? handler.getFormattedMinForAPI(range) : null;
    }

    public getFormattedMaxForAPI<T>(range: FieldRange<T>): string {
        let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
        return handler ? handler.getFormattedMaxForAPI(range) : null;
    }

    /**
     * AUCUN SENS en soit, il faut utiliser getValueFromFormattedMinOrMaxAPIAndApiTypeId pour ce type de range
     */
    public getValueFromFormattedMinOrMaxAPI<T>(input: string): T {
        return null;
    }

    public getValueFromFormattedMinOrMaxAPIAndApiTypeId<T>(api_type_id: string, field_id: string, input: string): T {
        let handler = this.getRelevantHandlerFromStrings(api_type_id, field_id);
        return handler ? handler.getValueFromFormattedMinOrMaxAPI(input) : null;
    }
}


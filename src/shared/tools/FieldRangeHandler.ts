// import IRange from '../modules/DataRender/interfaces/IRange';
// import FieldRange from '../modules/DataRender/vos/FieldRange';
// import ModuleTableField from '../modules/ModuleTableField';
// import VOsTypesManager from '../modules/VOsTypesManager';
// import NumRangeHandler from './NumRangeHandler';
// import RangeHandler from './RangeHandler';
// import TSRangeHandler from './TSRangeHandler';

// export default class FieldRangeHandler extends RangeHandler<any> {
//     public static getInstance(): FieldRangeHandler {
//         if (!FieldRangeHandler.instance) {
//             FieldRangeHandler.instance = new FieldRangeHandler();
//         }
//         return FieldRangeHandler.instance;
//     }

//     private static instance: FieldRangeHandler = null;

//     /**
//      * TODO TU ASAP FIXME VARS
//      */
//     public get_range_shifted_by_x_segments<T>(range: FieldRange<T>, shift_value: number, shift_segment_type: number): FieldRange<T> {

//         if (!range) {
//             return null;
//         }

//         let relevantHandler = this.getRelevantHandler(range);
//         let res = relevantHandler ? relevantHandler.get_range_shifted_by_x_segments(range as any, shift_value, shift_segment_type) : null;

//         return res ? this.createNewField(range.api_type_id, range.field_id, res.min, res.max, res.min_inclusiv, res.max_inclusiv, range.segment_type) : null;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public getCardinal<T>(range: FieldRange<T>, segment_type?: number): number {
//         if (!range) {
//             return null;
//         }

//         let relevantHandler = this.getRelevantHandler(range);
//         return relevantHandler ? relevantHandler.getCardinal(range as any, segment_type) : null;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public ranges_are_contiguous_or_intersect<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {

//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.ranges_are_contiguous_or_intersect(range_a as any, range_b as any) : false;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isStartABeforeStartB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isStartABeforeStartB(range_a as any, range_b as any) : false;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isStartASameStartB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isStartASameStartB(range_a as any, range_b as any) : false;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isEndABeforeEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isEndABeforeEndB(range_a as any, range_b as any) : false;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isEndASameEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isEndASameEndB(range_a as any, range_b as any) : false;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isStartABeforeEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isStartABeforeEndB(range_a as any, range_b as any) : false;
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isStartASameEndB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isStartASameEndB(range_a as any, range_b as any) : false;
//     }

//     public translate_to_bdd(ranges: any[]): string {
//         throw new Error('Not Implemented');
//     }

//     public translate_from_bdd(ranges: string[], segment_type: number): any[] {
//         throw new Error('Not Implemented');
//     }

//     public translate_to_api(ranges: any[]): string[] {
//         throw new Error('Not Implemented');
//     }

//     public translate_from_api(ranges: string[]): any[] {
//         throw new Error('Not Implemented');
//     }

//     public parseRangeBDD(rangeLiteral: string, segment_type: number): any {
//         throw new Error('Not Implemented');
//     }

//     public parseRangeAPI(rangeLiteral: string): any {
//         throw new Error('Not Implemented');
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public isEndABeforeStartB<T>(range_a: FieldRange<T>, range_b: FieldRange<T>): boolean {
//         if ((!range_a) || (!range_b)) {
//             return false;
//         }

//         if (range_a.api_type_id != range_b.api_type_id) {
//             return false;
//         }

//         if (range_a.field_id != range_b.field_id) {
//             return false;
//         }

//         let relevantHandler = this.getRelevantHandler(range_a);
//         return relevantHandler ? relevantHandler.isEndABeforeStartB(range_a as any, range_b as any) : false;
//     }

//     /**
//      * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
//      * @param ranges
//      */
//     public getMinSurroundingRange<T>(ranges: Array<FieldRange<T>>): FieldRange<T> {

//         if ((!ranges) || (!ranges.length)) {
//             return null;
//         }

//         let relevantHandler = this.getRelevantHandler(ranges[0]);
//         let res: FieldRange<T> = relevantHandler ? relevantHandler.getMinSurroundingRange(ranges as any) as any : null;

//         if (res) {
//             res.api_type_id = ranges[0].api_type_id;
//             res.field_id = ranges[0].field_id;
//         }
//         return res;
//     }

//     public createNewField<T, U extends IRange<T>>(api_type_id: string, field_id: string, min: T, max: T, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): U {
//         return FieldRange.createNew(api_type_id, field_id, min, max, min_inclusiv, max_inclusiv, segment_type) as any;
//     }

//     public createNew<T, U extends IRange<T>>(min: T, max: T, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): U {
//         throw new Error('Not implemented');
//     }

//     public cloneFrom<T, U extends IRange<T>>(from: U): U {
//         return FieldRange.cloneFrom(from as any) as any;
//     }

//     public getRelevantHandler<T>(field_range: FieldRange<T>): RangeHandler<any> {
//         return this.getRelevantHandlerFromStrings(field_range ? field_range.api_type_id : null, field_range ? field_range.field_id : null);
//     }

//     public getRelevantHandlerFromStrings<T>(api_type_id: string, field_id: string): RangeHandler<any> {

//         let vo_moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
//         if ((!vo_moduletable) || (!vo_moduletable.getFieldFromId(field_id))) {
//             return null;
//         }

//         let field = vo_moduletable.getFieldFromId(field_id);

//         switch (field.field_type) {
//             case ModuleTableField.FIELD_TYPE_amount:
//             case ModuleTableField.FIELD_TYPE_enum:
//             case ModuleTableField.FIELD_TYPE_file_ref:
//             case ModuleTableField.FIELD_TYPE_float:
//             case ModuleTableField.FIELD_TYPE_foreign_key:
//             case ModuleTableField.FIELD_TYPE_hours_and_minutes:
//             case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
//             case ModuleTableField.FIELD_TYPE_image_ref:
//             case ModuleTableField.FIELD_TYPE_int:
//             case ModuleTableField.FIELD_TYPE_int_array:
//             case ModuleTableField.FIELD_TYPE_numrange_array:
//             case ModuleTableField.FIELD_TYPE_prct:

//                 return NumRangeHandler.getInstance();

//             case ModuleTableField.FIELD_TYPE_date:
//             case ModuleTableField.FIELD_TYPE_daterange:
//             // case ModuleTableField.FIELD_TYPE_daterange_array:
//             case ModuleTableField.FIELD_TYPE_day:
//             case ModuleTableField.FIELD_TYPE_timestamp:
//             case ModuleTableField.FIELD_TYPE_timewithouttimezone:
//             case ModuleTableField.FIELD_TYPE_tsrange:
//             case ModuleTableField.FIELD_TYPE_tstzrange_array:
//             case ModuleTableField.FIELD_TYPE_tstz:
//                 // case ModuleTableField.FIELD_TYPE_unix_timestamp:

//                 return TSRangeHandler.getInstance();
//         }

//         return null;
//     }

//     public getFormattedMinForAPI<T>(range: FieldRange<T>): string {

//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.getFormattedMinForAPI(range) : null;
//     }

//     public getFormattedMaxForAPI<T>(range: FieldRange<T>): string {

//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.getFormattedMaxForAPI(range) : null;
//     }

//     /**
//      * AUCUN SENS en soit, il faut utiliser getValueFromFormattedMinOrMaxAPIAndApiTypeId pour ce type de range
//      */
//     public getValueFromFormattedMinOrMaxAPI<T>(input: string): T {
//         return null;
//     }

//     public getValueFromFormattedMinOrMaxAPIAndApiTypeId<T>(api_type_id: string, field_id: string, input: string): T {
//         let handler = this.getRelevantHandlerFromStrings(api_type_id, field_id);
//         return handler ? handler.getValueFromFormattedMinOrMaxAPI(input) : null;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMin<T>(range: FieldRange<T>, segment_type?: number): T {

//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.getSegmentedMin(range, segment_type) : null;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMax<T>(range: FieldRange<T>, segment_type?: number): T {

//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.getSegmentedMax(range, segment_type) : null;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMin_from_ranges<T>(ranges: Array<FieldRange<T>>, segment_type?: number): T {

//         if ((!ranges) || (!ranges.length)) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(ranges[0].api_type_id, ranges[0].field_id);
//         return handler ? handler.getSegmentedMin_from_ranges(ranges, segment_type) : null;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMax_from_ranges<T>(ranges: Array<FieldRange<T>>, segment_type?: number): T {

//         if ((!ranges) || (!ranges.length)) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(ranges[0].api_type_id, ranges[0].field_id);
//         return handler ? handler.getSegmentedMax_from_ranges(ranges, segment_type) : null;
//     }

//     public foreach<T>(range: FieldRange<T>, callback: (value: T) => void, segment_type?: number) {


//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.foreach(range, callback, segment_type) : null;
//     }

//     /**
//      * @param elt
//      * @param range
//      */
//     public is_elt_inf_min<T>(a: T, range: FieldRange<T>): boolean {


//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.is_elt_inf_min(a, range) : null;
//     }

//     /**
//      * @param elt
//      * @param range
//      */
//     public is_elt_sup_max<T>(a: T, range: FieldRange<T>): boolean {


//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.is_elt_sup_max(a, range) : null;
//     }

//     public getFieldRangesFromRanges<T>(api_type_id: string, field_id: string, ranges: Array<IRange<T>>): Array<FieldRange<T>> {
//         let res: Array<FieldRange<T>> = [];

//         for (let i in ranges) {
//             let range: IRange<T> = ranges[i];

//             res.push(FieldRange.createNew(api_type_id, field_id, range.min, range.max, range.min_inclusiv, range.max_inclusiv, range.segment_type));
//         }
//         return res;
//     }


//     public isSupp<T>(range: FieldRange<T>, a: T, b: T): boolean {
//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.isSupp(range, a, b) : null;
//     }

//     public isInf<T>(range: FieldRange<T>, a: T, b: T): boolean {
//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.isInf(range, a, b) : null;
//     }

//     public equals<T>(range: FieldRange<T>, a: T, b: T): boolean {
//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.equals(range, a, b) : null;
//     }


//     public max<T>(range: FieldRange<T>, a: T, b: T): T {
//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.max(range, a, b) : null;
//     }

//     public min<T>(range: FieldRange<T>, a: T, b: T): T {
//         if (!range) {
//             return null;
//         }

//         let handler = this.getRelevantHandlerFromStrings(range.api_type_id, range.field_id);
//         return handler ? handler.min(range, a, b) : null;
//     }
// }


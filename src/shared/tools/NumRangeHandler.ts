// import NumRange from '../modules/DataRender/vos/NumRange';
// import RangeHandler from './RangeHandler';
// import NumSegmentHandler from './NumSegmentHandler';
// import NumSegment from '../modules/DataRender/vos/NumSegment';
// import IRange from '../modules/DataRender/interfaces/IRange';
// import VarControllerBase from '../modules/Var/VarControllerBase';

// export default class NumRangeHandler extends RangeHandler<number> {

//     /**
//      * DIRTY [ou pas?] Pseudo max int pour int8 en bdd (théotiquement -9223372036854775808 to 9223372036854775807
//      */
//     public static MIN_INT: number = -9223372036854775800;
//     public static MAX_INT: number = 9223372036854775800;

//     public static getInstance(): NumRangeHandler {
//         if (!NumRangeHandler.instance) {
//             NumRangeHandler.instance = new NumRangeHandler();
//         }
//         return NumRangeHandler.instance;
//     }

//     private static instance: NumRangeHandler = null;

//     public getMaxRange(): NumRange {
//         return this.createNew(NumRangeHandler.MIN_INT, NumRangeHandler.MAX_INT, true, true, NumSegment.TYPE_INT);
//     }

//     /**
//      * TODO TU ASAP FIXME VARS
//      */
//     public get_range_shifted_by_x_segments(range: NumRange, shift_value: number, shift_segment_type: number): NumRange {

//         if (!range) {
//             return null;
//         }

//         switch (shift_segment_type) {
//             case NumSegment.TYPE_INT:
//             default:
//                 return this.createNew(range.min + shift_value, range.max + shift_value, range.min_inclusiv, range.max_inclusiv, range.segment_type);
//         }
//     }

//     public createNew<U extends IRange<number>>(start: number, end: number, start_inclusiv: boolean, end_inclusiv: boolean, segment_type: number): U {
//         return NumRange.createNew(start, end, start_inclusiv, end_inclusiv, segment_type) as U;
//     }

//     public cloneFrom<U extends IRange<number>>(from: U): U {
//         return NumRange.cloneFrom(from) as U;
//     }

//     /**
//      * TODO TU ASAP FIXME VARS
//      * On passe par une version text pour simplifier
//      */
//     public translate_to_api(ranges: NumRange[]): string[] {
//         let res: string[] = null;

//         for (let i in ranges) {
//             let range = ranges[i];

//             if (res == null) {
//                 res = [];
//             }

//             let elt = '';
//             elt += range.segment_type;
//             elt += range.min_inclusiv ? '[' : '(';
//             elt += range.min;
//             elt += ',';
//             elt += range.max;
//             elt += range.max_inclusiv ? ']' : ')';

//             res.push(elt);
//         }

//         return res;
//     }

//     /**
//      * TODO TU ASAP FIXME VARS
//      */
//     public translate_from_api<U extends NumRange>(ranges: string[]): U[] {

//         let res: U[] = [];
//         try {

//             for (let i in ranges) {
//                 let range = ranges[i];

//                 res.push(this.parseRangeAPI(range));
//             }
//         } catch (error) {
//         }

//         if ((!res) || (!res.length)) {
//             return null;
//         }
//         return res;
//     }

//     /**
//      * TODO TU ASAP FIXME VARS
//      */
//     public translate_to_bdd(ranges: NumRange[]): string {
//         let res = null;

//         for (let i in ranges) {
//             let range = ranges[i];

//             if (res == null) {
//                 res = '{"';
//             } else {
//                 res += ',"';
//             }

//             res += range.min_inclusiv ? '[' : '(';
//             res += range.min;
//             res += ',';
//             res += range.max;
//             res += range.max_inclusiv ? ']' : ')';

//             res += '"';
//         }
//         res += "}";

//         return res;
//     }

//     /**
//      * TODO TU ASAP FIXME VARS
//      */
//     public translate_from_bdd<U extends NumRange>(ranges: string[]): U[] {

//         let res: U[] = [];
//         try {

//             for (let i in ranges) {
//                 let range = ranges[i];

//                 // TODO FIXME ASAP : ALORS là c'est du pif total, on a pas l'info du tout en base, donc on peut pas conserver le segment_type......
//                 //  on prend les plus petits segments possibles, a priori ça pose 'moins' de soucis [?]
//                 res.push(this.parseRangeBDD(range, NumSegment.TYPE_INT));
//             }
//         } catch (error) {
//         }

//         if ((!res) || (!res.length)) {
//             return null;
//         }
//         return res;
//     }

//     /**
//      * Strongly inspired by https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
//      * @param rangeLiteral
//      */
//     public parseRangeBDD<U extends NumRange>(rangeLiteral: string, segment_type: number): U {
//         var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_BDD);

//         if (!matches) {
//             return null;
//         }

//         let lower = this.parseRangeSegment(matches[2], matches[3]);
//         let upper = this.parseRangeSegment(matches[4], matches[5]);

//         return this.createNew(
//             parseFloat(lower),
//             parseFloat(upper),
//             matches[1] == '[',
//             matches[6] == ']',
//             segment_type);
//     }

//     /**
//      * Strongly inspired by https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
//      * @param rangeLiteral
//      */
//     public parseRangeAPI<U extends NumRange>(rangeLiteral: string): U {
//         var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_API);

//         if (!matches) {
//             return null;
//         }

//         let segment_type = parseInt(matches[1].toString());
//         let lower = this.parseRangeSegment(matches[3], matches[4]);
//         let upper = this.parseRangeSegment(matches[5], matches[6]);

//         return this.createNew(
//             parseFloat(lower),
//             parseFloat(upper),
//             matches[2] == '[',
//             matches[7] == ']',
//             segment_type);
//     }

//     /**
//      * @param range_a
//      * @param range_b
//      */
//     public getCardinal(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {
//         if (!range) {
//             return null;
//         }

//         let min: number = this.getSegmentedMin(range, segment_type);
//         let max: number = this.getSegmentedMax(range, segment_type);

//         if ((min == null) || (max == null)) {
//             return null;
//         }

//         switch (segment_type) {
//             case NumSegment.TYPE_INT:
//                 return (max - min) + 1;
//         }

//         return null;
//     }

//     public getValueFromFormattedMinOrMaxAPI(input: string): number {
//         try {
//             let res = parseFloat(input);

//             if (isNaN(res)) {
//                 return null;
//             }
//             return res;
//         } catch (error) {
//         }
//         return null;
//     }

//     /**
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMin(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {

//         if (!range) {
//             return null;
//         }

//         let range_min_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.min, segment_type);

//         if (range_min_num.num > range.max) {
//             return null;
//         }

//         if ((!range.max_inclusiv) && (range_min_num.num >= range.max)) {
//             return null;
//         }

//         // if (range.min_inclusiv) {
//         //     return range_min_num.num;
//         // }

//         // if (range_min_num.num > range.min) {
//         //     return range_min_num.num;
//         // }

//         // range_min_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_min_num, segment_type, -1);

//         // if (((!range.max_inclusiv) && (range.max == range_min_num.num)) || (range.max < range_min_num.num)) {
//         //     return null;
//         // }

//         return range_min_num.num;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMax(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {
//         if (!range) {
//             return null;
//         }

//         let range_max_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.max, segment_type);

//         if ((!range.max_inclusiv) && (range_max_num.num == range.max)) {
//             range_max_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_max_num, segment_type);
//         }

//         let range_max_end: number = NumSegmentHandler.getInstance().getEndNumSegment(range_max_num);

//         if (range_max_end < range.min) {
//             return null;
//         }

//         if ((!range.min_inclusiv) && (range_max_end <= range.min)) {
//             return null;
//         }

//         return range_max_num.num;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMin_from_ranges(ranges: NumRange[], segment_type: number = NumSegment.TYPE_INT): number {

//         if ((!ranges) || (!ranges.length)) {
//             return null;
//         }

//         let res: number = null;

//         for (let i in ranges) {
//             let range = ranges[i];
//             let range_min = this.getSegmentedMin(range, segment_type);

//             if ((range_min == null) || (typeof range_min == 'undefined')) {
//                 continue;
//             }

//             if (res == null) {
//                 res = range_min;
//             } else {
//                 res = Math.min(range_min, res);
//             }
//         }

//         return res;
//     }

//     /**
//      * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
//      * @param range
//      * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
//      */
//     public getSegmentedMax_from_ranges(ranges: NumRange[], segment_type: number = NumSegment.TYPE_INT): number {

//         if ((!ranges) || (!ranges.length)) {
//             return null;
//         }

//         let res: number = null;

//         for (let i in ranges) {
//             let range = ranges[i];
//             let range_max = this.getSegmentedMax(range, segment_type);

//             if ((range_max == null) || (typeof range_max == 'undefined')) {
//                 continue;
//             }

//             if (res == null) {
//                 res = range_max;
//             } else {
//                 res = Math.max(range_max, res);
//             }
//         }

//         return res;
//     }

//     /**
//      * ATTENTION très gourmand en perf très rapidement, il ne faut utiliser que sur de très petits ensembles
//      * @param range
//      * @param callback
//      * @param segment_type
//      */
//     // public async foreach_combinaison_ranges(ranges: NumRange[], callback: (value: number) => Promise<void> | void, segment_type: number = NumSegment.TYPE_INT) {

//     //     // Identifier la liste des segments concernés, sur l'ensemble des ranges
//     //     let segments_concernes: number[] = [];

//     //     for (let i in ranges) {
//     //         let range: NumRange = ranges[i];

//     //         let seg = this.getSegmentedMin(range);
//     //         while (seg <= this.getSegmentedMax(range)) {

//     //             if (segments_concernes.indexOf(seg) <0){
//     //                 segments_concernes.push(seg);
//     //             }

//     //             switch (segment_type) {
//     //                 case NumSegment.TYPE_INT:
//     //                 default:
//     //                     seg++;
//     //                     break;
//     //             }
//     //         }
//     //     }

//     //     // Pour chaque cardinal possible, (de 1 à length de segments_concernes), construire les combinaisons, et callback
//     //     for (let cardinal = 1; cardinal <= segments_concernes.length; cardinal++){


//     //     }
//     // }

//     /**
//      * ATTENTION très gourmand en perf très rapidement, il ne faut utiliser que sur de très petits ensembles
//      * Le segment_type est forcé à int
//      */
//     public get_combinaisons(combinaisons: NumRange[][], combinaison_actuelle: NumRange[], elts: number[], index: number, cardinal: number) {

//         if (cardinal <= 0) {
//             if ((!!combinaison_actuelle) && (!!combinaison_actuelle.length)) {
//                 combinaisons.push(combinaison_actuelle);
//             }
//             return;
//         }

//         cardinal--;

//         for (let i = index; i < (elts.length - cardinal); i++) {

//             let deploy_combinaison: NumRange[] = (combinaison_actuelle && combinaison_actuelle.length) ? NumRangeHandler.getInstance().cloneArrayFrom(combinaison_actuelle) : [];

//             deploy_combinaison.push(NumRangeHandler.getInstance().create_single_element_range(elts[i], NumSegment.TYPE_INT));

//             this.get_combinaisons(combinaisons, deploy_combinaison, elts, i + 1, cardinal);
//         }
//     }

//     public async foreach(range: NumRange, callback: (value: number) => Promise<void> | void, segment_type: number = NumSegment.TYPE_INT, min_inclusiv: number = null, max_inclusiv: number = null) {
//         let min = this.getSegmentedMin(range, segment_type);
//         let max = this.getSegmentedMax(range, segment_type);

//         if ((min == null) || (max == null) || (typeof min == 'undefined') || (typeof max == 'undefined')) {
//             return;
//         }

//         if ((typeof min_inclusiv != 'undefined') && (min_inclusiv != null) && (!isNaN(min_inclusiv)) && (min_inclusiv > min)) {
//             min = min_inclusiv;
//         }
//         if ((typeof max_inclusiv != 'undefined') && (max_inclusiv != null) && (!isNaN(max_inclusiv)) && (max_inclusiv < max)) {
//             max = max_inclusiv;
//         }
//         if (min > max) {
//             return;
//         }

//         for (let i = min; i <= max; i++) {
//             await callback(i);
//         }
//     }

//     public isSupp(range: NumRange, a: number, b: number): boolean {
//         return a > b;
//     }

//     public isInf(range: NumRange, a: number, b: number): boolean {
//         return a < b;
//     }

//     public equals(range: NumRange, a: number, b: number): boolean {
//         return a == b;
//     }


//     public max(range: NumRange, a: number, b: number): number {
//         return Math.max(a, b);
//     }

//     public min(range: NumRange, a: number, b: number): number {
//         return Math.min(a, b);
//     }

// }


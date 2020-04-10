// import FieldRangeHandler from '../../../tools/FieldRangeHandler';
// import FieldRange from '../../DataRender/vos/FieldRange';
// import ModuleTable from '../../ModuleTable';
// import VOsTypesManager from '../../VOsTypesManager';
// const moment = require('moment');

// export default class APIDAORangesParamsVO {

//     public static URL: string = ':api_type_id' +
//         '/:field_id_1/:range_min_1/:inclusive_min_1/:range_max_1/:inclusive_max_1/:segment_type_1' +
//         '/:field_id_2?/:range_min_2?/:inclusive_min_2?/:range_max_2?/:inclusive_max_2?/:segment_type_2?' +
//         '/:field_id_3?/:range_min_3?/:inclusive_min_3?/:range_max_3?/:inclusive_max_3?/:segment_type_3?' +
//         '/:field_id_4?/:range_min_4?/:inclusive_min_4?/:range_max_4?/:inclusive_max_4?/:segment_type_4?' +
//         '/:field_id_5?/:range_min_5?/:inclusive_min_5?/:range_max_5?/:inclusive_max_5?/:segment_type_5?' +
//         '/:field_id_6?/:range_min_6?/:inclusive_min_6?/:range_max_6?/:inclusive_max_6?/:segment_type_6?' +
//         '/:field_id_7?/:range_min_7?/:inclusive_min_7?/:range_max_7?/:inclusive_max_7?/:segment_type_7?' +
//         '/:field_id_8?/:range_min_8?/:inclusive_min_8?/:range_max_8?/:inclusive_max_8?/:segment_type_8?' +
//         '/:field_id_9?/:range_min_9?/:inclusive_min_9?/:range_max_9?/:inclusive_max_9?/:segment_type_9?' +
//         '/:field_id_10?/:range_min_10?/:inclusive_min_10?/:range_max_10?/:inclusive_max_10?/:segment_type_10?' +
//         '/:field_id_11?/:range_min_11?/:inclusive_min_11?/:range_max_11?/:inclusive_max_11?/:segment_type_11?' +
//         '/:field_id_12?/:range_min_12?/:inclusive_min_12?/:range_max_12?/:inclusive_max_12?/:segment_type_12?' +
//         '/:field_id_13?/:range_min_13?/:inclusive_min_13?/:range_max_13?/:inclusive_max_13?/:segment_type_13?' +
//         '/:field_id_14?/:range_min_14?/:inclusive_min_14?/:range_max_14?/:inclusive_max_14?/:segment_type_14?' +
//         '/:field_id_15?/:range_min_15?/:inclusive_min_15?/:range_max_15?/:inclusive_max_15?/:segment_type_15?' +
//         '/:field_id_16?/:range_min_16?/:inclusive_min_16?/:range_max_16?/:inclusive_max_16?/:segment_type_16?' +
//         '/:field_id_17?/:range_min_17?/:inclusive_min_17?/:range_max_17?/:inclusive_max_17?/:segment_type_17?' +
//         '/:field_id_18?/:range_min_18?/:inclusive_min_18?/:range_max_18?/:inclusive_max_18?/:segment_type_18?' +
//         '/:field_id_19?/:range_min_19?/:inclusive_min_19?/:range_max_19?/:inclusive_max_19?/:segment_type_19?' +
//         '/:field_id_20?/:range_min_20?/:inclusive_min_20?/:range_max_20?/:inclusive_max_20?/:segment_type_20?';

//     public static async translateCheckAccessParams(
//         API_TYPE_ID: string,
//         ranges: Array<FieldRange<any>>): Promise<APIDAORangesParamsVO> {

//         if ((!ranges) || (!ranges.length) || (ranges.length > 20)) {
//             ConsoleHandler.getInstance().error("translateCheckAccessParams:APIDAORangesParamsVO:" + JSON.stringify(ranges));
//             return null;
//         }
//         return new APIDAORangesParamsVO(API_TYPE_ID, ranges);
//     }

//     public static async translateToURL(param: APIDAORangesParamsVO): Promise<string> {

//         let range_txt: string = "";
//         for (let i in param.ranges) {

//             let field_range: FieldRange<any> = param.ranges[i];

//             let min_txt: string = FieldRangeHandler.getInstance().getFormattedMinForAPI(field_range);
//             let max_txt: string = FieldRangeHandler.getInstance().getFormattedMaxForAPI(field_range);

//             range_txt += "/" + field_range.field_id;
//             range_txt += "/" + min_txt;
//             range_txt += "/" + (field_range.min_inclusiv ? "i" : "e");
//             range_txt += "/" + max_txt;
//             range_txt += "/" + (field_range.max_inclusiv ? "i" : "e");
//             range_txt += "/" + field_range.segment_type;
//         }
//         return param ? param.API_TYPE_ID + range_txt : '';
//     }
//     public static async translateFromREQ(req): Promise<APIDAORangesParamsVO> {

//         if (!(req && req.params && req.params.api_type_id && VOsTypesManager.getInstance().moduleTables_by_voType[req.params.api_type_id])) {
//             return null;
//         }

//         let vo_moduletable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[req.params.api_type_id];
//         let i: number = 1;
//         let field_range: FieldRange<any> = APIDAORangesParamsVO.tryGetFieldRange(req.params, vo_moduletable, 1);
//         let field_ranges: Array<FieldRange<any>> = [];
//         while (!!field_range) {
//             field_ranges.push(field_range);
//             i++;
//             field_range = APIDAORangesParamsVO.tryGetFieldRange(req.params, vo_moduletable, i);
//         }

//         if (!field_ranges.length) {
//             return null;
//         }
//         return new APIDAORangesParamsVO(req.params.api_type_id, field_ranges);
//     }

//     private static tryGetFieldRange(params: any, vo_moduletable: ModuleTable<any>, i: number): FieldRange<any> {

//         if ((!params['field_id_' + i]) ||
//             (params['range_min_' + i] == null) ||
//             (typeof params['range_min_' + i] == 'undefined') ||
//             (!params['inclusive_min_' + i]) ||
//             (params['range_max_' + i] == null) ||
//             (typeof params['range_max_' + i] == 'undefined') ||
//             (!params['inclusive_max_' + i]) ||
//             (params['segment_type_' + i] == null) ||
//             (typeof params['segment_type_' + i] == 'undefined')) {
//             return null;
//         }

//         let field_id = params['field_id_' + i];
//         if ((!vo_moduletable) || (!vo_moduletable.getFieldFromId(field_id))) {
//             return null;
//         }

//         let field = vo_moduletable.getFieldFromId(field_id);
//         let min_value = FieldRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPIAndApiTypeId(vo_moduletable.vo_type, field_id, params['range_min_' + i]);
//         let max_value = FieldRangeHandler.getInstance().getValueFromFormattedMinOrMaxAPIAndApiTypeId(vo_moduletable.vo_type, field_id, params['range_max_' + i]);

//         if ((!min_value) || (!max_value)) {
//             return null;
//         }

//         let inclusive_min: boolean = (params['inclusive_min_' + i] == "i");
//         let inclusive_max: boolean = (params['inclusive_max_' + i] == "i");

//         let segment_type: number = parseInt(params['segment_type_' + i].tosString());
//         return FieldRange.createNew(vo_moduletable.vo_type, field.field_id, min_value, max_value, inclusive_min, inclusive_max, segment_type);
//     }

//     public constructor(
//         public API_TYPE_ID: string,
//         public ranges: Array<FieldRange<any>>) {
//     }
// }
// import RangeHandler from '../../../../tools/RangeHandler';
// import ThemeModuleDataParamRangesVO from './ThemeModuleDataParamRangesVO';
// import ThemeModuleDataRangesVO from './ThemeModuleDataRangesVO';

// export default class ThemeModuleDataParamRangesController extends VarDataParamControllerBase<ThemeModuleDataRangesVO, ThemeModuleDataParamRangesVO> {

//     public static getInstance() {
//         if (!ThemeModuleDataParamRangesController.instance_) {
//             ThemeModuleDataParamRangesController.instance_ = new ThemeModuleDataParamRangesController();
//         }

//         return ThemeModuleDataParamRangesController.instance_;
//     }

//     private static instance_: ThemeModuleDataParamRangesController = null;

//     protected constructor() {
//         super();
//     }

//     public cloneParam(param: ThemeModuleDataParamRangesVO): ThemeModuleDataParamRangesVO {
//         return ThemeModuleDataParamRangesVO.createNew(param.var_id, param.theme_id_ranges, param.module_id_ranges, param.user_id_ranges);
//     }

//     public getImpactedParamsList(paramUpdated: ThemeModuleDataParamRangesVO, paramsRegisteredByIndex: { [index: string]: ThemeModuleDataParamRangesVO }): ThemeModuleDataParamRangesVO[] {
//         if ((!paramUpdated) || (!paramsRegisteredByIndex)) {
//             return null;
//         }

//         let res: ThemeModuleDataParamRangesVO[] = [];

//         for (let index in paramsRegisteredByIndex) {
//             let paramRegistered: ThemeModuleDataParamRangesVO = paramsRegisteredByIndex[index];

//             if (paramRegistered.var_id != paramUpdated.var_id) {
//                 continue;
//             }

//             let found: boolean = false;
//             for (let i in paramRegistered.theme_id_ranges) {
//                 let employee_id_range = paramRegistered.theme_id_ranges[i];

//                 if (RangeHandler.getInstance().range_intersects_any_range(employee_id_range, paramUpdated.theme_id_ranges)) {
//                     found = true;
//                     break;
//                 }
//             }
//             if (!found) {
//                 continue;
//             }

//             found = false;
//             for (let i in paramRegistered.module_id_ranges) {
//                 let employee_id_range = paramRegistered.module_id_ranges[i];

//                 if (RangeHandler.getInstance().range_intersects_any_range(employee_id_range, paramUpdated.module_id_ranges)) {
//                     found = true;
//                     break;
//                 }
//             }
//             if (!found) {
//                 continue;
//             }

//             found = false;
//             for (let i in paramRegistered.user_id_ranges) {
//                 let employee_id_range = paramRegistered.user_id_ranges[i];

//                 if (RangeHandler.getInstance().range_intersects_any_range(employee_id_range, paramUpdated.user_id_ranges)) {
//                     found = true;
//                     break;
//                 }
//             }
//             if (!found) {
//                 continue;
//             }

//             res.push(paramRegistered);
//         }
//         return res;
//     }

//     public getIndex(param: ThemeModuleDataParamRangesVO): string {
//         let res: string = "";

//         res += param.var_id;

//         res += "_";
//         for (let i in param.theme_id_ranges) {
//             res += (param.theme_id_ranges[i].min_inclusiv ? "[" : "(") + param.theme_id_ranges[i].min + "-" +
//                 param.theme_id_ranges[i].max + (param.theme_id_ranges[i].max_inclusiv ? "]" : ")");
//         }

//         res += "_";
//         for (let i in param.module_id_ranges) {
//             res += (param.module_id_ranges[i].min_inclusiv ? "[" : "(") + param.module_id_ranges[i].min + "-" +
//                 param.module_id_ranges[i].max + (param.module_id_ranges[i].max_inclusiv ? "]" : ")");
//         }

//         res += "_";
//         for (let i in param.user_id_ranges) {
//             res += (param.user_id_ranges[i].min_inclusiv ? "[" : "(") + param.user_id_ranges[i].min + "-" +
//                 param.user_id_ranges[i].max + (param.user_id_ranges[i].max_inclusiv ? "]" : ")");
//         }

//         return res;
//     }
// }
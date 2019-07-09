// import { isString } from 'util';
// import VarDataParamControllerBase from '../VarDataParamControllerBase';
// import NumberDatasourceFieldDataParamVO from './vos/NumberDatasourceFieldDataParamVO';
// import NumberDatasourceFieldDataVO from './vos/NumberDatasourceFieldDataVO';

// export default class NumberDatasourceFieldDataParamController extends VarDataParamControllerBase<NumberDatasourceFieldDataVO, NumberDatasourceFieldDataParamVO> {

//     public static getInstance() {
//         if (!NumberDatasourceFieldDataParamController.instance) {
//             NumberDatasourceFieldDataParamController.instance = new NumberDatasourceFieldDataParamController();
//         }

//         return NumberDatasourceFieldDataParamController.instance;
//     }

//     private static instance: NumberDatasourceFieldDataParamController = null;

//     protected constructor() {
//         super();
//     }

//     public createNewData(param: BinaryVarOperatorDataParamVO): BinaryVarOperatorDataVO {
//         let res: BinaryVarOperatorDataVO = new BinaryVarOperatorDataVO();

//         res.var_id = param.var_id;
//         res.left_var_param_index = param.left_var_param_index;
//         res.right_var_param_index = param.right_var_param_index;

//         return res;
//     }

//     public getImpactedParamsList(paramUpdated: NumberDatasourceFieldDataParamVO, paramsRegisteredByIndex: { [index: string]: NumberDatasourceFieldDataParamVO }): NumberDatasourceFieldDataParamVO[] {
//         return null;
//     }

//     public getIndex(param: NumberDatasourceFieldDataParamVO): string {
//         let res: string = "";

//         res += param.var_id;

//         // res += "_" + (param.a ? param.left_var_param_index : "");
//         // res += "_" + (param.right_var_param_index ? param.right_var_param_index : "");

//         return res;
//     }

//     // public getParam(param_index: string): NumberDatasourceFieldDataParamVO {
//     //     let res: NumberDatasourceFieldDataParamVO = new NumberDatasourceFieldDataParamVO();

//     //     try {
//     //         res.var_id = parseInt(param_index.replace(/^([^_]+)_([^_]*)_([^_]*)$/, '$1'));
//     //         // res.left_var_param_index = param_index.replace(/^([^_]+)_([^_]*)_([^_]*)$/, '$2');
//     //         // res.right_var_param_index = param_index.replace(/^([^_]+)_([^_]*)_([^_]*)$/, '$3');

//     //         return res;
//     //     } catch (error) {
//     //     }

//     //     return null;
//     // }

//     // protected compareParams(paramA: NumberDatasourceFieldDataParamVO, paramB: NumberDatasourceFieldDataParamVO) {

//     //     if ((!paramA) || (!paramB)) {
//     //         return null;
//     //     }

//     //     let operator_diff: number = paramA.var_id - paramB.var_id;

//     //     if (operator_diff) {
//     //         return operator_diff;
//     //     }

//     //     // if (paramA.left_var_param_index < paramB.left_var_param_index) {
//     //     //     return -1;
//     //     // }

//     //     // if (paramA.left_var_param_index > paramB.left_var_param_index) {
//     //     //     return 1;
//     //     // }

//     //     // if (paramA.right_var_param_index < paramB.right_var_param_index) {
//     //     //     return -1;
//     //     // }

//     //     // if (paramA.right_var_param_index > paramB.right_var_param_index) {
//     //     //     return 1;
//     //     // }

//     //     return 0;
//     // }
// }
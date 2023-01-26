// import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
// import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

// export default class GetParamParamVO implements IAPIParamTranslator<GetParamParamVO> {

//     public static fromParams(param_name: string, default_if_undefined: string | number | boolean = null, max_cache_age_ms: number = null): GetParamParamVO {

//         return new GetParamParamVO(param_name, default_if_undefined, max_cache_age_ms);
//     }

//     public static getAPIParams(param: GetParamParamVO): any[] {
//         return [param.param_name, param.default_if_undefined, param.max_cache_age_ms];
//     }

//     public constructor(
//         public param_name: string,
//         public default_if_undefined: string | number | boolean = null,
//         public max_cache_age_ms: number = null) {
//     }
// }

// export const GetParamParamVOStatic: IAPIParamTranslatorStatic<GetParamParamVO> = GetParamParamVO;
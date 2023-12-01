/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IMatroid from '../../Matroid/interfaces/IMatroid';

export default class APIDAOApiTypeAndMatroidsParamsVO implements IAPIParamTranslator<APIDAOApiTypeAndMatroidsParamsVO> {

    public static fromParams(
        API_TYPE_ID: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null): APIDAOApiTypeAndMatroidsParamsVO {

        return new APIDAOApiTypeAndMatroidsParamsVO(API_TYPE_ID, matroids, fields_ids_mapper);
    }

    public static getAPIParams(param: APIDAOApiTypeAndMatroidsParamsVO): any[] {
        return [param.API_TYPE_ID, param.matroids, param.fields_ids_mapper];
    }

    public constructor(
        public API_TYPE_ID: string,
        public matroids: IMatroid[],
        public fields_ids_mapper: { [matroid_field_id: string]: string } = null) {
    }
}

export const APIDAOApiTypeAndMatroidsParamsVOStatic: IAPIParamTranslatorStatic<APIDAOApiTypeAndMatroidsParamsVO> = APIDAOApiTypeAndMatroidsParamsVO;
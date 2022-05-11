import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IMatroid from '../../Matroid/interfaces/IMatroid';

export default class APIMatroidsAndFieldsmapperParamsVO implements IAPIParamTranslator<APIMatroidsAndFieldsmapperParamsVO> {

    public static fromParams(
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string } = null): APIMatroidsAndFieldsmapperParamsVO {

        return new APIMatroidsAndFieldsmapperParamsVO(matroids, fields_ids_mapper);
    }

    public static getAPIParams(param: APIMatroidsAndFieldsmapperParamsVO): any[] {
        return [param.matroids, param.fields_ids_mapper];
    }

    public constructor(
        public matroids: IMatroid[],
        public fields_ids_mapper: { [matroid_field_id: string]: string } = null) {
    }
}

export const APIMatroidsAndFieldsmapperParamsVOStatic: IAPIParamTranslatorStatic<APIMatroidsAndFieldsmapperParamsVO> = APIMatroidsAndFieldsmapperParamsVO;
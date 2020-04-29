import IMatroid from '../../Matroid/interfaces/IMatroid';
import ModuleAPI from '../../API/ModuleAPI';

export default class APIDAOApiTypeAndMatroidsParamsVO {

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<APIDAOApiTypeAndMatroidsParamsVO> {

        return new APIDAOApiTypeAndMatroidsParamsVO(API_TYPE_ID, matroids, fields_ids_mapper);
    }

    public constructor(
        public API_TYPE_ID: string,
        public matroids: IMatroid[],
        public fields_ids_mapper: { [matroid_field_id: string]: string }) {
        // this.matroids = APIController.getInstance().try_translate_vo_to_api(matroids);
    }
}
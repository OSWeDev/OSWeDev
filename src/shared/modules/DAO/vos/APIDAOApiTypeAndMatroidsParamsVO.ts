import IMatroid from '../../Matroid/interfaces/IMatroid';

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
    }
}
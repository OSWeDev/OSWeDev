import IRange from '../../DataRender/interfaces/IRange';

export default class APIDAOParamVO {

    public static URL: string = ':api_type_id/:id';

    public static async translateCheckAccessParams(
        API_TYPE_ID: string,
        id: number,
        segmentation_ranges: Array<IRange<any>>): Promise<APIDAOParamVO> {

        return new APIDAOParamVO(API_TYPE_ID, id, segmentation_ranges);
    }

    // public static async translateToURL(param: APIDAOParamVO): Promise<string> {

    //     return param ? param.API_TYPE_ID + '/' + param.id : '';
    // }
    // public static async translateFromREQ(req): Promise<APIDAOParamVO> {

    //     if (!(req && req.params)) {
    //         return null;
    //     }
    //     return new APIDAOParamVO(req.params.api_type_id, parseInt(req.params.id));
    // }

    public constructor(
        public API_TYPE_ID: string,
        public id: number,
        public segmentation_ranges: Array<IRange<any>>) {
    }
}
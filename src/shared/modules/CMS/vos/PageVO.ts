import IDistantVOBase from '../../IDistantVOBase';

export default class PageVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "page";

    public id: number;
    public _type: string = PageVO.API_TYPE_ID;

    public main_route: string;
    public translatable_title_id: number;
    public content_type_id: number;
}
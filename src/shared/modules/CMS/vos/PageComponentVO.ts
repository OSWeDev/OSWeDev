import IDistantVOBase from '../../IDistantVOBase';

export default class PageComponentVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "page_component";

    public id: number;
    public _type: string = PageComponentVO.API_TYPE_ID;

    public type: string;
    public page_id: number;
    public weight: number;
}
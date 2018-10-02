import IDistantVOBase from '../../IDistantVOBase';

export default class ContentTypeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "content_type";

    public id: number;
    public _type: string = ContentTypeVO.API_TYPE_ID;

    public translatable_name_id: number;
    public translatable_desc_id: number;
}
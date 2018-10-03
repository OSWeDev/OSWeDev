import IDistantVOBase from '../../IDistantVOBase';

export default class TemplateComponentVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "template_component";

    public id: number;
    public _type: string = TemplateComponentVO.API_TYPE_ID;

    public type: string;
    public translatable_name_id: number;
    public translatable_desc_id: number;
    public thumbnail_id: number;
}
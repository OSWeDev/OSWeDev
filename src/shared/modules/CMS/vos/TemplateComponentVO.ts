import IDistantVOBase from '../../IDistantVOBase';

export default class TemplateComponentVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "template_component";

    public id: number;
    public _type: string = TemplateComponentVO.API_TYPE_ID;

    /**
     * Par convention le type_id est le api_type_id de la version instantiée
     */
    public type_id: string;
    public translatable_name_id: number;
    public translatable_desc_id: number;
    public thumbnail_id: number;
    public weight: number;
}
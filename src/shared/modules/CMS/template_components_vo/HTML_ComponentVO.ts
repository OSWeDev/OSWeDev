import IDistantVOBase from '../../IDistantVOBase';

export default class HTML_ComponentVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "html_component";

    public id: number;
    public _type: string = HTML_ComponentVO.API_TYPE_ID;

    public page_component_id: number;
    public html: string;
}
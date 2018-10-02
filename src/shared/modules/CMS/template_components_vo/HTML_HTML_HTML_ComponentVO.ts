import IDistantVOBase from '../../IDistantVOBase';

export default class HTML_HTML_HTML_ComponentVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "html_html_html_component";

    public id: number;
    public _type: string = HTML_HTML_HTML_ComponentVO.API_TYPE_ID;

    public page_component_id: number;
    public left_html: string;
    public center_html: string;
    public right_html: string;
}
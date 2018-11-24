import IDistantVOBase from '../../IDistantVOBase';
import IInstantiatedPageComponent from '../interfaces/IInstantiatedPageComponent';

export default class HtmlHtmlHtmlComponentVO implements IDistantVOBase, IInstantiatedPageComponent {
    public static API_TYPE_ID: string = "html_html_html_cmpnt";

    public id: number;
    public _type: string = HtmlHtmlHtmlComponentVO.API_TYPE_ID;

    public page_id: number;
    public page_component_id: number;
    public left_html: string;
    public center_html: string;
    public right_html: string;
}
import IDistantVOBase from '../../IDistantVOBase';
import IInstantiatedPageComponent from '../interfaces/IInstantiatedPageComponent';

export default class HtmlComponentVO implements IDistantVOBase, IInstantiatedPageComponent {
    public static API_TYPE_ID: string = "html_cmpnt";

    public id: number;
    public _type: string = HtmlComponentVO.API_TYPE_ID;

    public page_id: number;
    public page_component_id: number;
    public html: string;
}
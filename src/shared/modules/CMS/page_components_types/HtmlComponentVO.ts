import IInstantiatedPageComponent from '../interfaces/IInstantiatedPageComponent';

export default class HtmlComponentVO implements IInstantiatedPageComponent {
    public static API_TYPE_ID: string = "html_cmpnt";

    public id: number;
    public _type: string = HtmlComponentVO.API_TYPE_ID;

    public page_id: number;
    public weight: number;

    public html: string;
}
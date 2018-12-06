import IInstantiatedPageComponent from '../interfaces/IInstantiatedPageComponent';

export default class ImgHtmlComponentVO implements IInstantiatedPageComponent {
    public static API_TYPE_ID: string = "img_html_cmpnt";

    public id: number;
    public _type: string = ImgHtmlComponentVO.API_TYPE_ID;

    public page_id: number;
    public weight: number;

    public image_vo_id: number;
    public html: string;
}
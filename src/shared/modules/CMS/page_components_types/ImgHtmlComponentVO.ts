import IDistantVOBase from '../../IDistantVOBase';
import IInstantiatedPageComponent from '../interfaces/IInstantiatedPageComponent';

export default class ImgHtmlComponentVO implements IDistantVOBase, IInstantiatedPageComponent {
    public static API_TYPE_ID: string = "img_html_cmpnt";

    public static IMAGE_POSITION_NAMES: string[] = ['img_html_cmpnt.IMAGE_POSITION_LEFT', 'img_html_cmpnt.IMAGE_POSITION_RIGHT'];
    public static IMAGE_POSITION_LEFT: number = 0;
    public static IMAGE_POSITION_RIGHT: number = 1;

    public id: number;
    public _type: string = ImgHtmlComponentVO.API_TYPE_ID;

    public page_id: number;
    public page_component_id: number;
    public image_vo_id: number;
    public html: string;
    public image_position: number;
}
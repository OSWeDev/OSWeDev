import IDistantVOBase from '../../IDistantVOBase';

export default class Img_HTML_ComponentVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "img_html_component";

    public static IMAGE_POSITION_NAMES: string[] = ['html_component.IMAGE_POSITION_LEFT', 'html_component.IMAGE_POSITION_RIGHT'];
    public static IMAGE_POSITION_LEFT: number = 0;
    public static IMAGE_POSITION_RIGHT: number = 1;

    public id: number;
    public _type: string = Img_HTML_ComponentVO.API_TYPE_ID;

    public page_component_id: number;
    public image_vo_id: number;
    public html: string;
    public image_position: number;
}
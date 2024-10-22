import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSImageWidgetOptionsVO extends AbstractVO {

    public static POSITION_CENTRE_CENTRE: string = 'cms_image.position.centre_centre';
    public static POSITION_CENTRE_GAUCHE: string = 'cms_image.position.centre_gauche';
    public static POSITION_CENTRE_DROITE: string = 'cms_image.position.centre_droite';
    public static POSITION_CENTRE_HAUT: string = 'cms_image.position.centre_haut';
    public static POSITION_HAUT_GAUCHE: string = 'cms_image.position.haut_gauche';
    public static POSITION_HAUT_DROITE: string = 'cms_image.position.haut_droite';
    public static POSITION_BAS_GAUCHE: string = 'cms_image.position.bas_gauche';
    public static POSITION_BAS_DROITE: string = 'cms_image.position.bas_droite';

    public static MISE_EN_PAGE_DEFAUT: string = 'cms_image.mise_en_page.defaut';
    public static MISE_EN_PAGE_COUVRIR: string = 'cms_image.mise_en_page.couvrir';
    public static MISE_EN_PAGE_CONTENIR: string = 'cms_image.mise_en_page.contenir';

    public file_id: number;
    public radius: number;
    public use_for_template: boolean;
    public field_ref_for_template: VOFieldRefVO;
    public position: string;
    public mise_en_page: string;

    public static createNew(
        file_id: number,
        radius: number,
        use_for_template: boolean,
        field_ref_for_template: VOFieldRefVO,
        position: string,
        mise_en_page: string,
    ): CMSImageWidgetOptionsVO {
        const res = new CMSImageWidgetOptionsVO();

        res.file_id = file_id;
        res.radius = radius;
        res.use_for_template = use_for_template;
        res.field_ref_for_template = field_ref_for_template;
        res.position = position;
        res.mise_en_page = mise_en_page;

        return res;
    }
}
import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSImageWidgetOptionsVO extends AbstractVO {

    public static POSITION_CENTRE_CENTRE: number = 1;
    public static POSITION_CENTRE_GAUCHE: number = 2;
    public static POSITION_CENTRE_DROITE: number = 3;
    public static POSITION_CENTRE_HAUT: number = 4;
    public static POSITION_CENTRE_BAS: number = 5;
    public static POSITION_HAUT_GAUCHE: number = 6;
    public static POSITION_HAUT_DROITE: number = 7;
    public static POSITION_BAS_GAUCHE: number = 8;
    public static POSITION_BAS_DROITE: number = 9;
    public static POSITION_CENTRE_CENTRE_LABEL: string = 'cms_image.position.centre_centre';
    public static POSITION_CENTRE_GAUCHE_LABEL: string = 'cms_image.position.centre_gauche';
    public static POSITION_CENTRE_DROITE_LABEL: string = 'cms_image.position.centre_droite';
    public static POSITION_CENTRE_HAUT_LABEL: string = 'cms_image.position.centre_haut';
    public static POSITION_CENTRE_BAS_LABEL: string = 'cms_image.position.centre_bas';
    public static POSITION_HAUT_GAUCHE_LABEL: string = 'cms_image.position.haut_gauche';
    public static POSITION_HAUT_DROITE_LABEL: string = 'cms_image.position.haut_droite';
    public static POSITION_BAS_GAUCHE_LABEL: string = 'cms_image.position.bas_gauche';
    public static POSITION_BAS_DROITE_LABEL: string = 'cms_image.position.bas_droite';

    public static MISE_EN_PAGE_COUVRIR: number = 1;
    public static MISE_EN_PAGE_CONTENIR: number = 2;
    public static MISE_EN_PAGE_COUVRIR_LABEL: string = 'cms_image.mise_en_page.couvrir';
    public static MISE_EN_PAGE_CONTENIR_LABEL: string = 'cms_image.mise_en_page.contenir';

    public file_id: number;
    public radius: number; // à voir si c'est redondant avec le borderstyle du widget en round corners mais c'est pas dit
    public use_for_template: boolean;
    public field_ref_for_template: VOFieldRefVO;
    public position: number;
    public mise_en_page: number;

    public static createNew(
        file_id: number,
        radius: number,
        use_for_template: boolean,
        field_ref_for_template: VOFieldRefVO,
        position: number,
        mise_en_page: number,
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
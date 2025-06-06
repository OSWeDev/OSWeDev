import SizeAndUnitVO from "../styles/SizeAndUnitVO";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSImageWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_image_widget_options";

    public static POSITION_NA: number = 0; // Pour compatibilité avec les anciennes options qui n'avaient pas de position 0
    public static POSITION_CENTRE_CENTRE: number = 1;
    public static POSITION_CENTRE_GAUCHE: number = 2;
    public static POSITION_CENTRE_DROITE: number = 3;
    public static POSITION_CENTRE_HAUT: number = 4;
    public static POSITION_CENTRE_BAS: number = 5;
    public static POSITION_HAUT_GAUCHE: number = 6;
    public static POSITION_HAUT_DROITE: number = 7;
    public static POSITION_BAS_GAUCHE: number = 8;
    public static POSITION_BAS_DROITE: number = 9;
    public static POSITION_LABELS: { [key: number]: string } = {
        [CMSImageWidgetOptionsVO.POSITION_NA]: 'cms_image.position.na',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE]: 'cms_image.position.centre_centre',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_GAUCHE]: 'cms_image.position.centre_gauche',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_DROITE]: 'cms_image.position.centre_droite',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_HAUT]: 'cms_image.position.centre_haut',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_BAS]: 'cms_image.position.centre_bas',
        [CMSImageWidgetOptionsVO.POSITION_HAUT_GAUCHE]: 'cms_image.position.haut_gauche',
        [CMSImageWidgetOptionsVO.POSITION_HAUT_DROITE]: 'cms_image.position.haut_droite',
        [CMSImageWidgetOptionsVO.POSITION_BAS_GAUCHE]: 'cms_image.position.bas_gauche',
        [CMSImageWidgetOptionsVO.POSITION_BAS_DROITE]: 'cms_image.position.bas_droite',
    };
    public static POSITION_ENUM_TO_CSS: { [key: number]: string } = {
        [CMSImageWidgetOptionsVO.POSITION_NA]: 'inherit',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE]: 'center center',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_GAUCHE]: 'center left',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_DROITE]: 'center right',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_HAUT]: 'center top',
        [CMSImageWidgetOptionsVO.POSITION_CENTRE_BAS]: 'center bottom',
        [CMSImageWidgetOptionsVO.POSITION_HAUT_GAUCHE]: 'left top',
        [CMSImageWidgetOptionsVO.POSITION_HAUT_DROITE]: 'right top',
        [CMSImageWidgetOptionsVO.POSITION_BAS_GAUCHE]: 'left bottom',
        [CMSImageWidgetOptionsVO.POSITION_BAS_DROITE]: 'right bottom',
    };

    public static MISE_EN_PAGE_NA: number = 0; // Pour compatibilité avec les anciennes options qui n'avaient pas de mise en page 0
    public static MISE_EN_PAGE_COUVRIR: number = 1;
    public static MISE_EN_PAGE_CONTENIR: number = 2;
    public static MISE_EN_PAGE_LABELS: { [key: number]: string } = {
        [CMSImageWidgetOptionsVO.MISE_EN_PAGE_NA]: 'cms_image.mise_en_page.na',
        [CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR]: 'cms_image.mise_en_page.couvrir',
        [CMSImageWidgetOptionsVO.MISE_EN_PAGE_CONTENIR]: 'cms_image.mise_en_page.contenir',
    };

    public _type: string = CMSImageWidgetOptionsVO.API_TYPE_ID;

    public file_id: number;

    /**
     * Anciennement radius number
     */
    public radius: SizeAndUnitVO;

    public use_for_template: boolean;

    /**
     * Anciennement field_ref_for_template
     */
    public field_ref_for_template_id: number;

    public position: number;
    public mise_en_page: number;
}
import NumRange from "../../../../DataRender/vos/NumRange";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSBlocTextWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "dashboard_p_cms_bloc_text_widget_options";
    public _type: string = CMSBlocTextWidgetOptionsVO.API_TYPE_ID;

    //#region titre

    // Globalisé dans les options du widget
    // public titre: string;

    public titre_field_ref_for_template: VOFieldRefVO;
    //#endregion

    //#region sous_titre
    /**
     * Format HTML avec Wysiwig
     */
    public sous_titre: string;

    /**
     * Ref de FontStyleVO
     */
    public sous_titre_style_id: number;

    /**
     * Refs de ClasseCSSVO
     */
    public sous_titre_classe_id_ranges: NumRange[];

    //#endregion

    //#region sur_titre
    /**
     * Format HTML avec Wysiwig
     */
    public sur_titre: string;

    /**
     * Ref de FontStyleVO
     */
    public sur_titre_style_id: number;

    /**
     * Refs de ClasseCSSVO
     */
    public sur_titre_classe_id_ranges: NumRange[];
    //#endregion

    //#region contenu
    /**
     * Format HTML avec Wysiwig
     */
    public contenu: string;

    /**
     * Ref de FontStyleVO
     */
    public contenu_style_id: number;

    /**
     * Refs de ClasseCSSVO
     */
    public contenu_classe_id_ranges: NumRange[];
    //#endregion


    public use_for_template: boolean;

    public titre_field_ref_for_template: VOFieldRefVO;
    public sous_titre_field_ref_for_template: VOFieldRefVO;
    public sur_titre_field_ref_for_template: VOFieldRefVO;
    public contenu_field_ref_for_template: VOFieldRefVO;

    public sous_titre_symbole: string;
    public titre_class: string;
    public sous_titre_class: string;
    public sur_titre_class: string;
    public contenu_class: string;

    // public static createNew(
    //     titre: string,
    //     sous_titre: string,
    //     sur_titre: string,
    //     contenu: string,
    //     use_for_template: boolean,
    //     titre_field_ref_for_template: VOFieldRefVO,
    //     sous_titre_field_ref_for_template: VOFieldRefVO,
    //     sur_titre_field_ref_for_template: VOFieldRefVO,
    //     contenu_field_ref_for_template: VOFieldRefVO,
    //     titre_template_is_date: boolean,
    //     sous_titre_template_is_date: boolean,
    //     sur_titre_template_is_date: boolean,
    //     contenu_template_is_date: boolean,
    //     sous_titre_symbole: string,
    //     titre_class: string,
    //     sous_titre_class: string,
    //     sur_titre_class: string,
    //     contenu_class: string,
    // ): CMSBlocTextWidgetOptionsVO {
    //     const res = new CMSBlocTextWidgetOptionsVO();

    //     res.titre = titre;
    //     res.sous_titre = sous_titre;
    //     res.sur_titre = sur_titre;
    //     res.contenu = contenu;
    //     res.use_for_template = use_for_template;
    //     res.titre_field_ref_for_template = titre_field_ref_for_template;
    //     res.sous_titre_field_ref_for_template = sous_titre_field_ref_for_template;
    //     res.sur_titre_field_ref_for_template = sur_titre_field_ref_for_template;
    //     res.contenu_field_ref_for_template = contenu_field_ref_for_template;
    //     res.titre_template_is_date = titre_template_is_date;
    //     res.sous_titre_template_is_date = sous_titre_template_is_date;
    //     res.sur_titre_template_is_date = sur_titre_template_is_date;
    //     res.contenu_template_is_date = contenu_template_is_date;
    //     res.sous_titre_symbole = sous_titre_symbole;
    //     res.titre_class = titre_class;
    //     res.sous_titre_class = sous_titre_class;
    //     res.sur_titre_class = sur_titre_class;
    //     res.contenu_class = contenu_class;

    //     return res;
    // }
}
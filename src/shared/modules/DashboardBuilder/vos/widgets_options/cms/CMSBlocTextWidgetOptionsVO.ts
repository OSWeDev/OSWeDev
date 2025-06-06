import ValueFilterVO from "../tools/ValueFilterVO";
import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSBlocTextWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_bloc_text_widget_options";
    public _type: string = CMSBlocTextWidgetOptionsVO.API_TYPE_ID;

    public use_for_template: boolean;

    //#region titre

    // Globalisé dans les options du widget
    // public titre: string;

    /**
     * Anciennement titre_field_ref_for_template
     */
    public titre_field_ref_for_template_id: number;

    public titre_value_filter: ValueFilterVO;

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
     * Anciennement sous_titre_field_ref_for_template
     */
    public sous_titre_field_ref_for_template_id: number;

    /**
     * Anciennement sous_titre_symbole
     */
    public sous_titre_value_filter: ValueFilterVO;

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
     * Anciennement sur_titre_field_ref_for_template
     */
    public sur_titre_field_ref_for_template_id: number;

    public sur_titre_value_filter: ValueFilterVO;

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
     * Anciennement contenu_field_ref_for_template
     */
    public contenu_field_ref_for_template_id: number;

    public contenu_value_filter: ValueFilterVO;

    //#endregion
}
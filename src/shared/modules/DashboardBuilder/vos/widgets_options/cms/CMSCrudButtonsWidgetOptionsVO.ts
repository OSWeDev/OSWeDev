import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSCrudButtonsWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_crud_buttons_widget_options";
    public _type: string = CMSCrudButtonsWidgetOptionsVO.API_TYPE_ID;

    public show_add: boolean;
    public show_update: boolean;
    public show_delete: boolean;

    /**
     * si pas en mode template, et /ou si en mode template mais envie de créer autre chose permet de définir la pable cible
     */
    public show_manual_vo_type: boolean;
    /**
     * Anciennement manual_vo_type string, ref module_table maintenant
     */
    public manual_vo_type_id: number;
}
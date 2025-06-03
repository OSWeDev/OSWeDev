import IDistantVOBase from "../../../IDistantVOBase";


export default abstract class WidgetOptionsBaseVO implements IDistantVOBase {

    public id: number;

    /**
     * Lien vers le widget auquel ces options sont associées.
     */
    public page_widget_id: number;

    /**
     * Pour cacher le widget
     *  -> Anciennement hide_filter sur les widgets de type filtre
     */
    public hide_widget: boolean;



    /**
     * Style du widget => ref de WidgetStyleVO
     */
    public widget_style_id: number;

    // /**
    //  * La couleur principale du texte du widget
    //  *  -> Anciennement fg_color_text sur les widgets de type filtre
    //  */
    // public font_color: string;


    /**
     * Le titre du widget
     *  -> Anciennement un code texte fourni par les options du widgets, maintenant un champs traduisible, donc avec un code de trad automatiquement généré
     */
    public title: string;

    /**
     * Pour afficher ou non le titre du widget
     * Par défaut oui
     */
    public title_display: boolean;

    /**
     * La description du widget. Peut-être important pour le lien avec Osélia et les agents pour leur expliquer le comportement, la fonction d'un widget.
     */
    public description: string;

    public abstract _type: string;
}
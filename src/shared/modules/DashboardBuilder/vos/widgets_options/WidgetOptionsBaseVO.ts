import NumRange from "../../../DataRender/vos/NumRange";
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
     * Refs de ClasseCSSVO
     */
    public widget_classe_id_ranges: NumRange[];

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

    /**
     * Les rôles qui ont accès à ce widget pour le visualiser dans le DB
     * Anciennement role_access sur certains widgets
     *
     * ATTENTION faudrait faire des trigger ? côté serveur pour s'assurer qu'on modifie pas (en particulier, mais théoriquement qu'on lit pas non plus)
     *  si on a pas les accès, en chargeant bien la conf du widget depuis le serveur...
     */
    public read_role_access_id_ranges: NumRange[];

    /**
     * Les rôles qui ont accès à ce widget pour le modifier dans le DB
     * Anciennement role_access sur certains widgets
     *
     * ATTENTION faudrait faire des trigger ? côté serveur pour s'assurer qu'on modifie pas (en particulier, mais théoriquement qu'on lit pas non plus)
     *  si on a pas les accès, en chargeant bien la conf du widget depuis le serveur...
     */
    public update_role_access_id_ranges: NumRange[];

    /**
     * Les rôles qui ont accès à ce widget pour le supprimer du le DB
     * Anciennement role_access sur certains widgets
     *
     * ATTENTION faudrait faire des trigger ? côté serveur pour s'assurer qu'on modifie pas (en particulier, mais théoriquement qu'on lit pas non plus)
     *  si on a pas les accès, en chargeant bien la conf du widget depuis le serveur...
     */
    public delete_role_access_id_ranges: NumRange[];

    public abstract _type: string;
}
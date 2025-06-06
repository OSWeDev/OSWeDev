import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";
import ValueFilterVO from "./widgets_options/tools/ValueFilterVO";

export default class CMSBlocTextWidgetOptionsVO extends AbstractVO {

    public titre: string; => dans le gloabl
    public sous_titre: string;
    + ref de style 
    public sur_titre: string;
+ ref de style 
    public contenu: string; // type html => wyzywig + classes ? on peut appliquer la classe autour du wysiswig ?
+ ref de style 

    public use_for_template: boolean;

    public titre_field_ref_for_template: VOFieldRefVO;
    public sous_titre_field_ref_for_template: VOFieldRefVO;
    public sur_titre_field_ref_for_template: VOFieldRefVO;
    public contenu_field_ref_for_template: VOFieldRefVO;

    // en attente flo, a priori des champs de type date en template potentiellement, mais donc pas de boolean nécessaire et revoir la mise en forme des segments à l'affichage
    public titre_template_is_date: boolean;
    public sous_titre_template_is_date: boolean;
    public sur_titre_template_is_date: boolean;
    public contenu_template_is_date: boolean;

    // Non par ce que à saisir côté client j'ai pas la solution
    // // Dans l'idée : Article du {field_value} édité par pasteque.
    // public titre_template_translatable_template: string;
    // public sous_titre_template_translatable_template: string;
    // public sur_titre_template_translatable_template: string;
// public contenu_template_translatable_template: string;
    
        public titre_value_filter: ValueFilterVO;
    public sous_titre_value_filter: ValueFilterVO;
    public sur_titre_value_filter: ValueFilterVO;
    public contenu_value_filter: ValueFilterVO;

// Pourquoi : par ce que c'est relou
// // Et pourquoi pas ajouter une ref vers 1 vo, dont le moduletable est le meme que les 4 champs
// // et comme ça on utilise ce vo, osef les filtres du db, et osef le template
//     publi ref_vo_id: number; // ref pas déclarée on connait pas le vo_type...

// public sous_titre_symbole: string; => à migrer :) vers sous_titre_value_filter

1 classe globale au widget et généralisée
    public widget_classes: string[]; => refs de classesCssVos avec nom / desc / champs text libre(+osélia)
    public titre_class: string;
    public sous_titre_class: string;
    public sur_titre_class: string;
    public contenu_class: string;

    public static createNew(
    titre: string,
    sous_titre: string,
    sur_titre: string,
    contenu: string,
    use_for_template: boolean,
    titre_field_ref_for_template: VOFieldRefVO,
    sous_titre_field_ref_for_template: VOFieldRefVO,
    sur_titre_field_ref_for_template: VOFieldRefVO,
    contenu_field_ref_for_template: VOFieldRefVO,
    titre_template_is_date: boolean,
    sous_titre_template_is_date: boolean,
    sur_titre_template_is_date: boolean,
    contenu_template_is_date: boolean,
    sous_titre_symbole: string,
    titre_class: string,
    sous_titre_class: string,
    sur_titre_class: string,
    contenu_class: string,
): CMSBlocTextWidgetOptionsVO {
    const res = new CMSBlocTextWidgetOptionsVO();

    res.titre = titre;
    res.sous_titre = sous_titre;
    res.sur_titre = sur_titre;
    res.contenu = contenu;
    res.use_for_template = use_for_template;
    res.titre_field_ref_for_template = titre_field_ref_for_template;
    res.sous_titre_field_ref_for_template = sous_titre_field_ref_for_template;
    res.sur_titre_field_ref_for_template = sur_titre_field_ref_for_template;
    res.contenu_field_ref_for_template = contenu_field_ref_for_template;
    res.titre_template_is_date = titre_template_is_date;
    res.sous_titre_template_is_date = sous_titre_template_is_date;
    res.sur_titre_template_is_date = sur_titre_template_is_date;
    res.contenu_template_is_date = contenu_template_is_date;
    res.sous_titre_symbole = sous_titre_symbole;
    res.titre_class = titre_class;
    res.sous_titre_class = sous_titre_class;
    res.sur_titre_class = sur_titre_class;
    res.contenu_class = contenu_class;

    return res;
}
}
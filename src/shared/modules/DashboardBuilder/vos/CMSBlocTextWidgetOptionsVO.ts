import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSBlocTextWidgetOptionsVO extends AbstractVO {

    public static ALIGNER_GAUCHE: string = 'cms_bloc_text.alignement.gauche';
    public static ALIGNER_CENTRE: string = 'cms_bloc_text.alignement.centre';
    public static ALIGNER_DROITE: string = 'cms_bloc_text.alignement.droite';
    public static ALIGNER_JUSTIFIE: string = 'cms_bloc_text.alignement.justifie';

    public titre: string;
    public alignement_titre: string;
    public sous_titre: string;
    public alignement_sous_titre: string;
    public contenu: string;
    public use_for_template: boolean;
    public titre_field_ref_for_template: VOFieldRefVO;
    public sous_titre_field_ref_for_template: VOFieldRefVO;
    public contenu_field_ref_for_template: VOFieldRefVO;

    public static createNew(
        titre: string,
        alignement_titre: string,
        sous_titre: string,
        alignement_sous_titre: string,
        contenu: string,
        use_for_template: boolean,
        titre_field_ref_for_template: VOFieldRefVO,
        sous_titre_field_ref_for_template: VOFieldRefVO,
        contenu_field_ref_for_template: VOFieldRefVO,
    ): CMSBlocTextWidgetOptionsVO {
        const res = new CMSBlocTextWidgetOptionsVO();

        res.titre = titre;
        res.alignement_titre = alignement_titre;
        res.sous_titre = sous_titre;
        res.alignement_sous_titre = alignement_sous_titre;
        res.contenu = contenu;
        res.use_for_template = use_for_template;
        res.titre_field_ref_for_template = titre_field_ref_for_template;
        res.sous_titre_field_ref_for_template = sous_titre_field_ref_for_template;
        res.contenu_field_ref_for_template = contenu_field_ref_for_template;

        return res;
    }
}
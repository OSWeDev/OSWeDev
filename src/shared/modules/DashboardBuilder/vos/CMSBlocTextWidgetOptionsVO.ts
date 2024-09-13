import AbstractVO from "../../VO/abstract/AbstractVO";

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
    public alignement_contenu: string;

    public static createNew(
        titre: string,
        alignement_titre: string,
        sous_titre: string,
        alignement_sous_titre: string,
        contenu: string,
        alignement_contenu: string,
    ): CMSBlocTextWidgetOptionsVO {
        const res = new CMSBlocTextWidgetOptionsVO();

        res.titre = titre;
        res.alignement_titre = alignement_titre;
        res.sous_titre = sous_titre;
        res.alignement_sous_titre = alignement_sous_titre;
        res.contenu = contenu;
        res.alignement_contenu = alignement_contenu;

        return res;
    }
}
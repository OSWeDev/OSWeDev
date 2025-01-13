import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

export default class CMSBlocTextWidgetOptionsVO extends AbstractVO {

    public titre: string;
    public sous_titre: string;
    public sur_titre: string;
    public contenu: string;
    public use_for_template: boolean;
    public titre_field_ref_for_template: VOFieldRefVO;
    public sous_titre_field_ref_for_template: VOFieldRefVO;
    public sur_titre_field_ref_for_template: VOFieldRefVO;
    public contenu_field_ref_for_template: VOFieldRefVO;

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

        return res;
    }
}
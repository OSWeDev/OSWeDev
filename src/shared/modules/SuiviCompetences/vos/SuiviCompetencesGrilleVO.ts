import NumRange from "../../DataRender/vos/NumRange";
import IVersionedVO from "../../Versioned/interfaces/IVersionedVO";

export default class SuiviCompetencesGrilleVO implements IVersionedVO {
    public static API_TYPE_ID: string = "suivi_comp_grille";

    public id: number;
    public _type: string = SuiviCompetencesGrilleVO.API_TYPE_ID;

    public name: string;
    public suivi_comp_item_id_ranges: NumRange[];
    public suivi_comp_activite_id: number;
    public calcul_niveau_maturite: boolean;
    public logo: string;
    public base_export_file_name: string;

    // Ajout pour déplacement OK/NOK fin de tableau sur bilatérales
    public move_indicateur_to_end: boolean;
    public show_column_rapport_plan_action: boolean;
    public show_column_rapport_etat_des_lieux: boolean;
    public show_column_rapport_cible: boolean;
    public show_column_rapport_delais: boolean;
    public show_column_rapport_indicateur: boolean;
    public show_column_name: boolean;
    public show_column_bilan_precedent: boolean;
    public show_commentaire_1: boolean;
    public show_commentaire_2: boolean;
    public show_prochain_suivi: boolean;
    public show_points_cles: boolean;
    public show_objectif_prochaine_visite: boolean;
    public show_btn_details: boolean;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;

    public static createNew(
        name: string,
        suivi_comp_item_id_ranges: NumRange[],
        suivi_comp_activite_id: number,
    ): SuiviCompetencesGrilleVO {
        let res: SuiviCompetencesGrilleVO = new SuiviCompetencesGrilleVO();

        res.name = name;
        res.suivi_comp_item_id_ranges = suivi_comp_item_id_ranges;
        res.suivi_comp_activite_id = suivi_comp_activite_id;

        return res;
    }
}
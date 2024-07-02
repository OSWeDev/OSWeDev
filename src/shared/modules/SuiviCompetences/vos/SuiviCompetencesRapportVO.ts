import IVersionedVO from "../../Versioned/interfaces/IVersionedVO";

export default class SuiviCompetencesRapportVO implements IVersionedVO {
    public static API_TYPE_ID: string = "suivi_comp_rapport";

    public static createNew(
        date: number,
        suivi_comp_grille_id: number,
        user_id: number,
        points_cles: string,
        objectif_prochaine_visite: string,
    ): SuiviCompetencesRapportVO {
        let res: SuiviCompetencesRapportVO = new SuiviCompetencesRapportVO();

        res.date = date;
        res.user_id = user_id;
        res.suivi_comp_grille_id = suivi_comp_grille_id;
        res.points_cles = points_cles;
        res.objectif_prochaine_visite = objectif_prochaine_visite;

        return res;
    }

    public id: number;
    public _type: string = SuiviCompetencesRapportVO.API_TYPE_ID;

    public date: number;
    public name: string;
    public points_cles: string;
    public objectif_prochaine_visite: string;

    public user_id: number;
    public suivi_comp_grille_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
import IVersionedVO from "../../Versioned/interfaces/IVersionedVO";

export default class SuiviCompetencesItemRapportVO implements IVersionedVO {
    public static API_TYPE_ID: string = "suivi_comp_item_rapport";

    public static createNew(
        plan_action: string,
        etat_des_lieux: string,
        indicateur: number,
        suivi_comp_item_id: number,
        rapport_id: number,
    ): SuiviCompetencesItemRapportVO {
        let res: SuiviCompetencesItemRapportVO = new SuiviCompetencesItemRapportVO();

        res.plan_action = plan_action;
        res.etat_des_lieux = etat_des_lieux;
        res.indicateur = indicateur;
        res.suivi_comp_item_id = suivi_comp_item_id;
        res.rapport_id = rapport_id;

        return res;
    }

    public id: number;
    public _type: string = SuiviCompetencesItemRapportVO.API_TYPE_ID;

    public plan_action: string;
    public etat_des_lieux: string;
    public indicateur: number;

    public suivi_comp_item_id: number;
    public rapport_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
import SuiviCompetencesRapportVO from "../../../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";

export default class SuiviCompetencesWidgetController {
    public static CREATE_ACTION_RAPPORT: number = 1;
    public static DUPLICATE_ACTION_RAPPORT: number = 2;
    public static EDIT_ACTION_RAPPORT: number = 3;

    public static default_rapport_id: number = null;
    public static default_action_rapport: number = null;
    public static default_vo_init_rapport: SuiviCompetencesRapportVO = null;
}
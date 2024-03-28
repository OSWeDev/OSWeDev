import NumRange from "../../DataRender/vos/NumRange";
import IVersionedVO from "../../Versioned/interfaces/IVersionedVO";

export default class SuiviCompetencesGrilleVO implements IVersionedVO {
    public static API_TYPE_ID: string = "suivi_comp_grille";

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

    public id: number;
    public _type: string = SuiviCompetencesGrilleVO.API_TYPE_ID;

    public name: string;
    public suivi_comp_item_id_ranges: NumRange[];
    public suivi_comp_activite_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
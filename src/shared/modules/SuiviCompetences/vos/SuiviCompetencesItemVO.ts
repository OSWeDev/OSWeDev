import INamedVO from "../../../interfaces/INamedVO";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";

export default class SuiviCompetencesItemVO implements IWeightedItem, INamedVO {
    public static API_TYPE_ID: string = "suivi_comp_item";

    public static createNew(
        weight: number,
        name: string,
        indicateurs: string,
        kpis: string,
        groupe_id: number,
        sous_groupe_id: number,
        suivi_comp_activite_id: number,
    ): SuiviCompetencesItemVO {
        let res: SuiviCompetencesItemVO = new SuiviCompetencesItemVO();

        res.weight = weight;
        res.name = name;
        res.indicateurs = indicateurs;
        res.kpis = kpis;
        res.groupe_id = groupe_id;
        res.sous_groupe_id = sous_groupe_id;
        res.suivi_comp_activite_id = suivi_comp_activite_id;

        return res;
    }

    public id: number;
    public _type: string = SuiviCompetencesItemVO.API_TYPE_ID;

    public weight: number;
    public name: string;

    public indicateurs: string;

    public kpis: string;
    public popup: string;

    public groupe_id: number;
    public sous_groupe_id: number;
    public suivi_comp_activite_id: number;

    public active: boolean;
}
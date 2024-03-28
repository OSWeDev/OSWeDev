import INamedVO from "../../../interfaces/INamedVO";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";

export default class SuiviCompetencesGroupeVO implements IWeightedItem, INamedVO {
    public static API_TYPE_ID: string = "suivi_comp_groupe";

    public static createNew(
        weight: number,
        name: string,
        ponderation: number,
    ): SuiviCompetencesGroupeVO {
        let res: SuiviCompetencesGroupeVO = new SuiviCompetencesGroupeVO();

        res.weight = weight;
        res.name = name;
        res.ponderation = ponderation;

        return res;
    }

    public id: number;
    public _type: string = SuiviCompetencesGroupeVO.API_TYPE_ID;

    public weight: number;
    public name: string;
    public ponderation: number;
    public icon: string;

    public active: boolean;
}
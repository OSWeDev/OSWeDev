import INamedVO from "../../../interfaces/INamedVO";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";


export default class SuiviCompetencesSousGroupeVO implements IWeightedItem, INamedVO {
    public static API_TYPE_ID: string = "suivi_comp_sous_groupe";

    public static createNew(
        weight: number,
        name: string,
        groupe_id: number,
        ponderation: number,
    ): SuiviCompetencesSousGroupeVO {
        let res: SuiviCompetencesSousGroupeVO = new SuiviCompetencesSousGroupeVO();

        res.weight = weight;
        res.name = name;
        res.groupe_id = groupe_id;
        res.ponderation = ponderation;

        return res;
    }

    public id: number;
    public _type: string = SuiviCompetencesSousGroupeVO.API_TYPE_ID;

    public weight: number;
    public name: string;
    public active: boolean;
    public ponderation: number;

    public groupe_id: number;
}
import INamedVO from "../../../interfaces/INamedVO";

export default class SuiviCompetencesActiviteVO implements INamedVO {
    public static API_TYPE_ID: string = "suivi_comp_activite";

    public static createNew(
        name: string,
    ): SuiviCompetencesActiviteVO {
        let res: SuiviCompetencesActiviteVO = new SuiviCompetencesActiviteVO();

        res.name = name;

        return res;
    }

    public id: number;
    public _type: string = SuiviCompetencesActiviteVO.API_TYPE_ID;

    public name: string;
}
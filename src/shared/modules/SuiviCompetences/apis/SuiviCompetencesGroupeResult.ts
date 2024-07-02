import SuiviCompetencesItemVO from "../vos/SuiviCompetencesItemVO";

export default class SuiviCompetencesGroupeResult {
    public id: number;
    public name: string;
    public icon: string;
    public nb_elements: number;
    public sous_groupe: Array<{ id: number, name: string, items: SuiviCompetencesItemVO[] }>;
}
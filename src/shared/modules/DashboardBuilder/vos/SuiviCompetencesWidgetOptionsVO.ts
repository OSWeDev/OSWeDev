import AbstractVO from "../../VO/abstract/AbstractVO";

export default class SuiviCompetencesWidgetOptionsVO extends AbstractVO {
    public constructor(
        public niveau_maturite_styles: string,
        public filtered_role_ids: number[],
        public filtered_grille_ids: number[],
    ) {
        super();
    }
}
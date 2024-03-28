import AbstractVO from "../../VO/abstract/AbstractVO";

export default class SuiviCompetencesWidgetOptionsVO extends AbstractVO {
    public constructor(
        public niveau_maturite_styles: string,
    ) {
        super();
    }
}
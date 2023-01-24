
export default class ParameterizedQueryWrapperField {

    /**
     *
     * @param api_type_id nom de la table
     * @param field_id nom du field ciblé
     * @param aggregator
     * @param row_col_alias nom de la colonne après récupération de la base
     */
    public constructor(
        public api_type_id: string,
        public field_id: string,
        public aggregator: number,
        public row_col_alias: string
    ) { }
}
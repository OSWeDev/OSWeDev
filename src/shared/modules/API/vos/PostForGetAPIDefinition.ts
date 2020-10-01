import APIDefinition from './APIDefinition';

export default class PostForGetAPIDefinition<T, U> extends APIDefinition<T, U> {

    /**
     *
     * @param api_name UID de l'api attention à l'unicité intermodules
     * @param API_TYPES_IDS_involved Le tableau des API_TYPE_IDs concernés par l'API
     * @param PARAM_TRANSLATOR La fonction qui passe d'une liste de params à un param de type T unique (si besoin)
     * @param SERVER_HANDLER NE REMPLIR QUE SI ON REGISTER COTE SERVEUR.
     */
    public constructor(
        public access_policy_name: string,

        public api_name: string,
        public API_TYPES_IDS_involved: (string[]) | ((value: T) => string[]),

        public PARAM_TRANSLATOR: (...params) => Promise<T> = null,
        public api_return_type: number = 0) {
        super(access_policy_name, APIDefinition.API_TYPE_POST_FOR_GET, api_name, API_TYPES_IDS_involved, PARAM_TRANSLATOR, null, null, null, api_return_type);
    }
}
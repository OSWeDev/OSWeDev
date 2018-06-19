import APIDefinition from './APIDefinition';

export default class GetAPIDefinition<T, U> extends APIDefinition<T, U> {

    /**
     *
     * @param api_name UID de l'api attention à l'unicité intermodules
     * @param API_TYPES_IDS_involved Le tableau des API_TYPE_IDs concernés par l'API
     * @param PARAM_TRANSLATOR La fonction qui passe d'une liste de params à un param de type T unique (si besoin)
     * @param PARAM_TRANSLATE_TO_URL La fonction qui dans le cas d'un get renvoie la part paramétrée de l'url à partir de T
     * @param PARAM_TRANSLATE_FROM_REQ La fonction qui dans le cas d'un get renvoie le vrai paramètre à partir de la requête à l'api
     * @param SERVER_HANDLER NE REMPLIR QUE SI ON REGISTER COTE SERVEUR.
     */
    public constructor(
        public api_name: string,
        public API_TYPES_IDS_involved: string[],

        public SERVER_HANDLER: (translated_param: T) => Promise<U> = null,

        public PARAM_TRANSLATOR: (...params) => Promise<T> = null,

        public PARAM_GET_URL: string = null,
        public PARAM_TRANSLATE_TO_URL: (value: T) => Promise<string> = null,
        public PARAM_TRANSLATE_FROM_REQ: (req: any) => Promise<T> = null,
        public api_return_type: number = 0) {
        super(APIDefinition.API_TYPE_GET, api_name, API_TYPES_IDS_involved, PARAM_TRANSLATOR, PARAM_TRANSLATE_TO_URL, PARAM_GET_URL, PARAM_TRANSLATE_FROM_REQ, SERVER_HANDLER, api_return_type);
    }
}
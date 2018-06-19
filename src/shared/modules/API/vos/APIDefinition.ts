export default abstract class APIDefinition<T, U> {

    public static API_TYPE_GET: number = 0;
    public static API_TYPE_POST: number = 1;

    public static API_RETURN_TYPE_JSON: number = 0;
    public static API_RETURN_TYPE_RES: number = 1;
    public static API_RETURN_TYPE_FILE: number = 2;

    /**
     *
     * @param api_name UID de l'api attention à l'unicité intermodules
     * @param API_TYPES_IDS_involved Le tableau des API_TYPE_IDs concernés par l'API
     * @param PARAM_TRANSLATOR La fonction qui passe d'une liste de params à un param de type T unique (si besoin)
     * @param SERVER_HANDLER NE REMPLIR QUE SI ON REGISTER COTE SERVEUR.
     */
    public constructor(
        public api_type: number,
        public api_name: string,
        public API_TYPES_IDS_involved: string[],

        public PARAM_TRANSLATOR: (...params) => Promise<T> = null,

        public PARAM_TRANSLATE_TO_URL: (value: T) => Promise<string> = null,
        public PARAM_GET_URL: string = null,
        public PARAM_TRANSLATE_FROM_REQ: (url: any) => Promise<T> = null,

        public SERVER_HANDLER: (translated_param: T) => Promise<U> = null,
        public api_return_type: number = 0) {
    }
}
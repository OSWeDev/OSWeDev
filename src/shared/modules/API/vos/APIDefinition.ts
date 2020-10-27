import CacheInvalidationRulesVO from '../../AjaxCache/vos/CacheInvalidationRulesVO';

export default abstract class APIDefinition<T, U> {

    public static API_TYPE_GET: number = 0;
    public static API_TYPE_POST: number = 1;
    public static API_TYPE_POST_FOR_GET: number = 2;

    public static API_RETURN_TYPE_JSON: number = 0;
    public static API_RETURN_TYPE_RES: number = 1;
    public static API_RETURN_TYPE_FILE: number = 2;

    public SERVER_HANDLER: (translated_param: T) => Promise<U> = null;

    /**
     * Cas d'une optimisation par aggrégation des params pour limiter à 1 appel à l'api par request wrapper avec un param plus complet
     *  ONLY POST_FOR_GET -- might change
     */
    public opti__aggregate_params: boolean = false;

    /**
     * Methode qui fait l'aggrégation des params dans le cas où on a activé opti__aggregate_params
     * @param dest le paramètre doit être agrégé directement dans dest
     */
    public opti__aggregate_method: (dest: T, src: T) => void = null;

    // public is_autonomous_res_handler: boolean = false;

    /**
     * @param access_policy_name Par défaut utiliser null pour indiquer pas de vérification, cas typique des apis de récupération des vos dont les droits
     *  sont gérés dans le dao directement
     * @param api_name UID de l'api attention à l'unicité intermodules
     * @param API_TYPES_IDS_involved Le tableau des API_TYPE_IDs concernés par l'API
     * @param PARAM_TRANSLATOR La fonction qui passe d'une liste de params à un param de type T unique (si besoin)
     * @param SERVER_HANDLER NE REMPLIR QUE SI ON REGISTER COTE SERVEUR.
     */
    public constructor(
        public access_policy_name: string,
        public api_type: number,
        public api_name: string,
        public API_TYPES_IDS_involved: (string[]) | ((value: T) => string[]),

        public PARAM_TRANSLATOR: (...params) => Promise<T> = null,

        public PARAM_TRANSLATE_TO_URL: (value: T) => Promise<string> = null,
        public PARAM_GET_URL: string = null,
        public PARAM_TRANSLATE_FROM_REQ: (url: any) => Promise<T> = null,

        public api_return_type: number = 0) {
    }

    // public define_as_autonomous_res_handler(): APIDefinition<T, U> {
    //     this.is_autonomous_res_handler = true;
    //     return this;
    // }

    /**
     * Force opti__aggregate_params à true, set la méthode utilisée pour aggréger, force API_TYPES_IDS_involved à CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED
     *  puisqu'on ne peut pas se fier au cache, et ATTENTION on ne doit pas utiliser les valeurs de retour de l'api qui sont fausses par définition.
     * @param opti__aggregate_method
     */
    public define_as_opti__aggregate_param(opti__aggregate_method: (a: T, b: T) => void): APIDefinition<T, U> {
        this.opti__aggregate_params = !!opti__aggregate_method;
        this.opti__aggregate_method = opti__aggregate_method;
        this.API_TYPES_IDS_involved = CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED;
        return this;
    }
}
import IAPIParamTranslator from "../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../interfaces/IAPIParamTranslatorStatic";

export default abstract class APIDefinition<T, U> {

    public static API_TYPE_GET: number = 0;
    public static API_TYPE_POST: number = 1;
    public static API_TYPE_POST_FOR_GET: number = 2;

    public static API_RETURN_TYPE_JSON: number = 0;
    public static API_RETURN_TYPE_RES: number = 1;
    public static API_RETURN_TYPE_FILE: number = 2;

    /**
     * Les params du SERVER_HANDLER doivent être les mêmes que ceux du shared et déclarés dans le même ordre (et avec les mêmes valeurs par défaut)
     */
    public SERVER_HANDLER: (...params) => Promise<U> = null;

    /**
     * @param access_policy_name Par défaut utiliser null pour indiquer pas de vérification, cas typique des apis de récupération des vos dont les droits
     *  sont gérés dans le dao directement => ce droit n'est checké QUE pour un appel d'api issu du client, pour protéger les apis des appels externes
     *  Côté serveur les vérifications se font toujours dans la fonction. ça peut être redondant du coup, mais ça évite de surcharger le serveur
     *  avec une vérification très souvent inutile côté serveur
     * @param api_name UID de l'api attention à l'unicité intermodules
     * @param API_TYPES_IDS_involved Le tableau des API_TYPE_IDs concernés par l'API
     * @param PARAM_TRANSLATE_FROM_REQ Fonction qui gère la trad des params en un élément envoyable par url (si besoin)
     * @param SERVER_HANDLER NE REMPLIR QUE SI ON REGISTER COTE SERVEUR.
     */
    public constructor(
        public access_policy_name: string,
        public api_type: number,
        public api_name: string,
        public API_TYPES_IDS_involved: (string[]) | ((value: IAPIParamTranslator<T> | T) => string[]),
        public param_translator: IAPIParamTranslatorStatic<T> = null,
        public api_return_type: number = 0) {
    }
}
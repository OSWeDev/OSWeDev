import IAPIParamTranslator from '../interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../interfaces/IAPIParamTranslatorStatic';
import APIDefinition from './APIDefinition';

export default class PostForGetAPIDefinition<T, U> extends APIDefinition<T, U> {

    /**
     *
     * @param api_name UID de l'api attention à l'unicité intermodules
     * @param API_TYPES_IDS_involved Le tableau des API_TYPE_IDs concernés par l'API
     * @param param_translator Objet qui gère la traduction pour les apis
     * @param SERVER_HANDLER NE REMPLIR QUE SI ON REGISTER COTE SERVEUR.
     */
    public constructor(
        public access_policy_name: string,
        public api_name: string,
        public API_TYPES_IDS_involved: (string[]) | ((value: IAPIParamTranslator<T> | T) => string[]),
        public param_translator: IAPIParamTranslatorStatic<T> = null,
        public api_return_type: number = 0) {
        super(access_policy_name, APIDefinition.API_TYPE_POST_FOR_GET, api_name, API_TYPES_IDS_involved, param_translator, api_return_type);
    }
}
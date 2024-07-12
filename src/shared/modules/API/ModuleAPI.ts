import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import ExternalAPIAuthentificationVO from './vos/ExternalAPIAuthentificationVO';

export default class ModuleAPI extends Module {

    private static instance: ModuleAPI = null;

    private constructor() {

        super("api", "API");
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAPI {
        if (!ModuleAPI.instance) {
            ModuleAPI.instance = new ModuleAPI();
        }
        return ModuleAPI.instance;
    }

    public initialize() {
        this.initializeExternalAPIAuthentificationVO();
    }

    private initializeExternalAPIAuthentificationVO() {

        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type d\'authentification', true).setEnumValues(ExternalAPIAuthentificationVO.TYPE_LABELS);

        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().api_key, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé API', false);
        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().custom_header_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du header personnalisé', false);

        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().oauth_client_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Client ID OAuth', false);
        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().oauth_client_secret, ModuleTableFieldVO.FIELD_TYPE_string, 'Client Secret OAuth', false);
        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().oauth_token_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de récupération du token OAuth', false);
        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().oauth_authorization_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL d\'autorisation OAuth', false);
        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().oauth_scopes, ModuleTableFieldVO.FIELD_TYPE_string, 'Périmètre', false);
        ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().oatuh_token_exchange_method_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Méthode d\'échange du token', false).setEnumValues(ExternalAPIAuthentificationVO.OAUTH_TOKEN_EXCHANGE_METHOD_TYPE_LABELS);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                ExternalAPIAuthentificationVO,
                ModuleTableFieldController.create_new(ExternalAPIAuthentificationVO.API_TYPE_ID, field_names<ExternalAPIAuthentificationVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
                DefaultTranslationVO.create_new({ 'fr-fr': "Authentification API externe" })
            )
        );
    }
}
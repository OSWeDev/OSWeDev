import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import ExternalAPIAuthentificationVO from '../API/vos/ExternalAPIAuthentificationVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import GPTAssistantAPIAssistantVO from '../GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../GPT/vos/GPTAssistantAPIThreadVO';
import Module from '../Module';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import LangVO from '../Translation/vos/LangVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import OseliaChatVO from './vos/OseliaChatVO';
import OseliaReferrerExternalAPIVO from './vos/OseliaReferrerExternalAPIVO';
import OseliaReferrerVO from './vos/OseliaReferrerVO';
import OseliaThreadReferrerVO from './vos/OseliaThreadReferrerVO';
import OseliaUserReferrerOTTVO from './vos/OseliaUserReferrerOTTVO';
import OseliaUserReferrerVO from './vos/OseliaUserReferrerVO';
import OpenOseliaDBParamVO, { OpenOseliaDBParamVOStatic } from './vos/apis/OpenOseliaDBParamVO';
import RequestOseliaUserConnectionParamVO, { RequestOseliaUserConnectionParamVOStatic } from './vos/apis/RequestOseliaUserConnectionParamVO';

export default class ModuleOselia extends Module {

    public static MODULE_NAME: string = 'Oselia';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleOselia.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.BO_ACCESS';

    public static OSELIA_DB_ID_PARAM_NAME: string = 'ModuleOselia.oselia_db_id';

    /**
     * Droit d'accès aux discussions sur le front
     */
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_MESSAGE_FEEDBACK_ACCESS';
    public static POLICY_THREAD_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_FEEDBACK_ACCESS';

    public static POLICY_GET_REFERRER_NAME: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.GET_REFERRER_NAME';

    public static APINAME_open_oselia_db: string = "oselia__open_oselia_db";
    public static APINAME_link_user_to_oselia_referrer: string = "oselia__link_user_to_oselia_referrer";

    public static APINAME_get_referrer_name: string = "oselia__get_referrer_name";
    public static APINAME_accept_link: string = "oselia__accept_link";
    public static APINAME_refuse_link: string = "oselia__refuse_link";

    public static APINAME_account_waiting_link_status: string = "oselia__account_waiting_link_status";

    private static instance: ModuleOselia = null;

    public open_oselia_db: (referrer_user_ott: string, openai_thread_id: string, openai_assistant_id: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_open_oselia_db);
    public link_user_to_oselia_referrer: (referrer_code: string, user_email: string, referrer_user_uid: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_link_user_to_oselia_referrer);

    public get_referrer_name: (referrer_user_ott: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_referrer_name);
    public accept_link: (referrer_user_ott: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_accept_link);
    public refuse_link: (referrer_user_ott: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_refuse_link);

    public account_waiting_link_status: (referrer_user_ott: string) => Promise<'validated' | 'waiting' | 'none'> = APIControllerWrapper.sah(ModuleOselia.APINAME_account_waiting_link_status);

    private constructor() {

        super("oselia", ModuleOselia.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleOselia {
        if (!ModuleOselia.instance) {
            ModuleOselia.instance = new ModuleOselia();
        }
        return ModuleOselia.instance;
    }

    public initialize() {
        this.initializeOseliaReferrerVO();
        this.initializeOseliaUserReferrerVO();
        this.initializeOseliaReferrerExternalAPIVO();
        this.initializeOseliaThreadReferrerVO();
        this.initializeOseliaUserReferrerOTTVO();
        this.initializeOseliaChatVO();
    }

    public initializeOseliaChatVO() {
        const regex = ModuleTableFieldController.create_new(OseliaChatVO.API_TYPE_ID, field_names<OseliaChatVO>().regex, ModuleTableFieldVO.FIELD_TYPE_string, 'Regex', true);
        const partenaire_code = ModuleTableFieldController.create_new(OseliaChatVO.API_TYPE_ID, field_names<OseliaChatVO>().partenaire_code, ModuleTableFieldVO.FIELD_TYPE_string, 'Code partenaire', true);
        const fields = [
            regex,
            partenaire_code
        ];

        const table = ModuleTableController.create_new(this.name, OseliaChatVO, null, 'Oselia - Chat');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[OseliaChatVO.API_TYPE_ID]);
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, void>(
            ModuleOselia.POLICY_GET_REFERRER_NAME,
            ModuleOselia.APINAME_get_referrer_name,
            [OseliaReferrerVO.API_TYPE_ID],
            StringParamVOStatic
        ));


        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleOselia.APINAME_accept_link,
            [OseliaUserReferrerVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null,
            ModuleOselia.APINAME_refuse_link,
            [OseliaUserReferrerVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, void>(
            null,
            ModuleOselia.APINAME_account_waiting_link_status,
            [OseliaUserReferrerVO.API_TYPE_ID],
            StringParamVOStatic
        ));


        APIControllerWrapper.registerApi(new PostAPIDefinition<RequestOseliaUserConnectionParamVO, string>(
            null,
            ModuleOselia.APINAME_link_user_to_oselia_referrer,
            [OseliaUserReferrerVO.API_TYPE_ID],
            RequestOseliaUserConnectionParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<OpenOseliaDBParamVO, void>(
            null,
            ModuleOselia.APINAME_open_oselia_db,
            null,
            OpenOseliaDBParamVOStatic
        ));
    }

    private initializeOseliaReferrerVO() {

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().default_assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant par défaut', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().referrer_code, ModuleTableFieldVO.FIELD_TYPE_password, 'Code Partenaire', true);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().activate_trigger_hooks, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Activer les Hooks', true, true, false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().triggers_hook_external_api_authentication_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Authentification API / Hooks', false)
            .set_many_to_one_target_moduletable_name(ExternalAPIAuthentificationVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_run_create_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook création de Run', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_run_update_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook mise à jour de Run', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_run_delete_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook suppression de Run', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_msg_content_create_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook création de contenu de message de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_msg_content_update_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook mise à jour de contenu de message de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_msg_content_delete_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook suppression de contenu de message de thread', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_message_file_create_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook création de fichier de message de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_message_file_update_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook mise à jour de fichier de message de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_message_file_delete_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook suppression de fichier de message de thread', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_msg_create_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook création de message de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_msg_update_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook mise à jour de message de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_msg_delete_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook suppression de message de thread', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_create_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook création de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_update_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook mise à jour de thread', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_gpt_assistant_thread_delete_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook suppression de thread', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_open_oselia_db_reject_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook rejet ouverture DB Osélia', false);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().trigger_hook_open_oselia_db_resolve_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL Hook résolution ouverture DB Osélia', false);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().new_user_default_lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue par défaut si nouveau compte', true)
            .set_many_to_one_target_moduletable_name(LangVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().new_user_default_role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rôle par défaut si nouveau compte', true)
            .set_many_to_one_target_moduletable_name(RoleVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().failed_open_oselia_db_target_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL cible en cas d\'échec d\'ouverture DB Osélia', true);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaReferrerVO,
                ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
                DefaultTranslationVO.create_new({ 'fr-fr': "Partenaire Intégrateur Osélia" })
            )
        );
    }

    private initializeOseliaUserReferrerOTTVO() {
        ModuleTableFieldController.create_new(OseliaUserReferrerOTTVO.API_TYPE_ID, field_names<OseliaUserReferrerOTTVO>().user_referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Lien Utilisateur/Partenaire', true)
            .set_many_to_one_target_moduletable_name(OseliaUserReferrerVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaUserReferrerOTTVO.API_TYPE_ID, field_names<OseliaUserReferrerOTTVO>().ott, ModuleTableFieldVO.FIELD_TYPE_password, 'One Time Token', true);

        ModuleTableFieldController.create_new(OseliaUserReferrerOTTVO.API_TYPE_ID, field_names<OseliaUserReferrerOTTVO>().expires, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'expiration', true);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaUserReferrerOTTVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "One Time Token Utilisateur/Partenaire Osélia" })
            )
        );
    }

    private initializeOseliaReferrerExternalAPIVO() {

        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', true)
            .set_many_to_one_target_moduletable_name(OseliaReferrerVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false);

        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true);

        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().external_api_authentication_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Authentification API', true)
            .set_many_to_one_target_moduletable_name(ExternalAPIAuthentificationVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().external_api_method, ModuleTableFieldVO.FIELD_TYPE_enum, 'Méthode API', true).setEnumValues(OseliaReferrerExternalAPIVO.API_METHOD_LABELS);

        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().external_api_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL API', true);


        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaReferrerExternalAPIVO,
                ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
                DefaultTranslationVO.create_new({ 'fr-fr': "API externe partenaire Osélia" })
            )
        );
    }

    private initializeOseliaThreadReferrerVO() {

        ModuleTableFieldController.create_new(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', true)
            .set_many_to_one_target_moduletable_name(OseliaReferrerVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaThreadReferrerVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Lien Thread/Partenaire Osélia" })
            )
        );
    }

    private initializeOseliaUserReferrerVO() {

        ModuleTableFieldController.create_new(OseliaUserReferrerVO.API_TYPE_ID, field_names<OseliaUserReferrerVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaUserReferrerVO.API_TYPE_ID, field_names<OseliaUserReferrerVO>().referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', true)
            .set_many_to_one_target_moduletable_name(OseliaReferrerVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaUserReferrerVO.API_TYPE_ID, field_names<OseliaUserReferrerVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true);
        ModuleTableFieldController.create_new(OseliaUserReferrerVO.API_TYPE_ID, field_names<OseliaUserReferrerVO>().user_validated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Connexion validée par l\'utilisateur', true, true, false);
        ModuleTableFieldController.create_new(OseliaUserReferrerVO.API_TYPE_ID, field_names<OseliaUserReferrerVO>().referrer_user_uid, ModuleTableFieldVO.FIELD_TYPE_password, 'Clé UID Partenaire', true);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaUserReferrerVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Lien Utilisateur/Partenaire Osélia" })
            )
        );
    }
}
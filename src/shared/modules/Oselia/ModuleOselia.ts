import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ConsoleHandler from '../../tools/ConsoleHandler';
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
import FileVO from '../File/vos/FileVO';
import Dates from '../FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../GPT/vos/GPTAssistantAPIThreadVO';
import Module from '../Module';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import LangVO from '../Translation/vos/LangVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import OseliaAssistantPriceVO from './vos/OseliaAssistantPriceVO';
import OseliaChatVO from './vos/OseliaChatVO';
import OseliaImagePriceVO from './vos/OseliaImagePriceVO';
import OseliaModelVO from './vos/OseliaModelVO';
import OseliaReferrerExternalAPIVO from './vos/OseliaReferrerExternalAPIVO';
import OseliaReferrerVO from './vos/OseliaReferrerVO';
import OseliaThreadReferrerVO from './vos/OseliaThreadReferrerVO';
import OseliaTokenPriceVO from './vos/OseliaTokenPriceVO';
import OseliaUserReferrerOTTVO from './vos/OseliaUserReferrerOTTVO';
import OseliaUserReferrerVO from './vos/OseliaUserReferrerVO';
import OseliaVisionPriceVO from './vos/OseliaVisionPriceVO';
import OpenOseliaDBParamVO, { OpenOseliaDBParamVOStatic } from './vos/apis/OpenOseliaDBParamVO';
import RequestOseliaUserConnectionParamVO, { RequestOseliaUserConnectionParamVOStatic } from './vos/apis/RequestOseliaUserConnectionParamVO';
import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import ModuleFile from '../File/ModuleFile';
import OseliaScreenshotParamVO, { OseliaScreenshotParamVOStatic } from './vos/apis/OseliaScreenshotParamVO';
export default class ModuleOselia extends Module {

    public static MODULE_NAME: string = 'Oselia';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleOselia.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_SELECT_THREAD_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.SELECT_THREAD_ACCESS';
    public static OSELIA_DB_ID_PARAM_NAME: string = 'ModuleOselia.oselia_db_id';
    public static OSELIA_EXPORT_DASHBOARD_ID_PARAM_NAME: string = 'ModuleOselia.oselia_export_dashboard_id';
    public static OSELIA_THREAD_DASHBOARD_ID_PARAM_NAME: string = 'ModuleOselia.oselia_thread_dashboard_id';
    public static WEBHOOK_TEAMS_PARAM_NAME: string = 'ModuleOselia.WEBHOOK_TEAMS';

    /**
     * Droit d'accès aux discussions sur le front
     */
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_MESSAGE_FEEDBACK_ACCESS';
    public static POLICY_THREAD_FEEDBACK_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.THREAD_FEEDBACK_ACCESS';
    public static POLICY_GENERATED_IMAGES_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.GENERATED_IMAGES_FO_ACCESS';

    public static POLICY_GET_REFERRER_NAME: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.GET_REFERRER_NAME';
    public static POLICY_GET_TOKEN_OSELIA: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.GET_TOKEN_OSELIA';

    public static APINAME_open_oselia_db: string = "oselia__open_oselia_db";
    public static APINAME_link_user_to_oselia_referrer: string = "oselia__link_user_to_oselia_referrer";

    public static APINAME_get_referrer_name: string = "oselia__get_referrer_name";
    public static APINAME_get_token_oselia: string = "oselia__get_token_oselia";
    public static APINAME_accept_link: string = "oselia__accept_link";
    public static APINAME_refuse_link: string = "oselia__refuse_link";
    public static APINAME_set_screen_track: string = "oselia__set_screen_track";
    public static APINAME_get_screen_track: string = "oselia__get_screen_track";
    public static APINAME_account_waiting_link_status: string = "oselia__account_waiting_link_status";

    private static instance: ModuleOselia = null;

    public get_token_oselia: (url: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_token_oselia);

    public open_oselia_db: (referrer_user_ott: string, openai_thread_id: string, openai_assistant_id: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_open_oselia_db);
    public link_user_to_oselia_referrer: (referrer_code: string, user_email: string, referrer_user_uid: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_link_user_to_oselia_referrer);

    public get_referrer_name: (referrer_user_ott: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_referrer_name);
    public accept_link: (referrer_user_ott: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_accept_link);
    public refuse_link: (referrer_user_ott: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_refuse_link);
    public set_screen_track: (track: MediaStreamTrack) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_set_screen_track);
    public get_screen_track: () => Promise<MediaStreamTrack | null> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_screen_track);
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
        // this.initializeOseliaReferrerExternalAPIParamVO();
        this.initializeOseliaThreadReferrerVO();
        this.initializeOseliaUserReferrerOTTVO();
        this.initializeOseliaChatVO();

        this.initializeOseliaModelVO();
        this.initializeOseliaTokenPriceVO();
        this.initializeOseliaVisionPriceVO();
        this.initializeOseliaImagePriceVO();
        this.initializeOseliaAssistantPriceVO();
    }

    public initializeOseliaChatVO() {
        ModuleTableFieldController.create_new(OseliaChatVO.API_TYPE_ID, field_names<OseliaChatVO>().regex, ModuleTableFieldVO.FIELD_TYPE_string, 'Regex', true);
        ModuleTableFieldController.create_new(OseliaChatVO.API_TYPE_ID, field_names<OseliaChatVO>().referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', true)
            .set_many_to_one_target_moduletable_name(OseliaReferrerVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, OseliaChatVO, null, 'Oselia - Chat');
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
            ModuleOselia.POLICY_GET_TOKEN_OSELIA,
            ModuleOselia.APINAME_get_token_oselia,
            [OseliaUserReferrerOTTVO.API_TYPE_ID, OseliaUserReferrerVO.API_TYPE_ID],
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
        APIControllerWrapper.registerApi(new PostAPIDefinition<OseliaScreenshotParamVO, void>(
            null,
            ModuleOselia.APINAME_set_screen_track,
            null,
            OseliaScreenshotParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<void, MediaStreamTrack | null>(
            null,
            ModuleOselia.APINAME_get_screen_track,
            null
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
        ModuleTableFieldController.create_new(OseliaReferrerVO.API_TYPE_ID, field_names<OseliaReferrerVO>().referrer_origin, ModuleTableFieldVO.FIELD_TYPE_string, 'Origine Partenaire (https://xxx.com)', false);

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

        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().accept, ModuleTableFieldVO.FIELD_TYPE_string, 'Accept', true, true, 'application/json');
        ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().content_type, ModuleTableFieldVO.FIELD_TYPE_string, 'Content-Type', true, true, 'application/json');


        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaReferrerExternalAPIVO,
                ModuleTableFieldController.create_new(OseliaReferrerExternalAPIVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
                DefaultTranslationVO.create_new({ 'fr-fr': "API externe partenaire Osélia" })
            )
        );
    }

    // private initializeOseliaReferrerExternalAPIParamVO() {

    //     ModuleTableFieldController.create_new(OseliaReferrerExternalAPIParamVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIParamVO>().external_api_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'API externe', true)
    //         .set_many_to_one_target_moduletable_name(OseliaReferrerExternalAPIVO.API_TYPE_ID);

    //     ModuleTableFieldController.create_new(OseliaReferrerExternalAPIParamVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIParamVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false);

    //     ModuleTableFieldController.create_new(OseliaReferrerExternalAPIParamVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIParamVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true);

    //     VersionedVOController.getInstance().registerModuleTable(
    //         ModuleTableController.create_new(
    //             this.name,
    //             OseliaReferrerExternalAPIParamVO,
    //             ModuleTableFieldController.create_new(OseliaReferrerExternalAPIParamVO.API_TYPE_ID, field_names<OseliaReferrerExternalAPIParamVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
    //             DefaultTranslationVO.create_new({ 'fr-fr': "Param pour API externe Osélia" })
    //         )
    //     );
    // }


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

    private initializeOseliaModelVO() {

        const name = ModuleTableFieldController.create_new(OseliaModelVO.API_TYPE_ID, field_names<OseliaModelVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();
        ModuleTableFieldController.create_new(OseliaModelVO.API_TYPE_ID, field_names<OseliaModelVO>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false);

        ModuleTableFieldController.create_new(OseliaModelVO.API_TYPE_ID, field_names<OseliaModelVO>().ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Plage de dates de validité de ce modèle', true);
        ModuleTableFieldController.create_new(OseliaModelVO.API_TYPE_ID, field_names<OseliaModelVO>().is_alias, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Est un alias', true, true, false);
        ModuleTableFieldController.create_new(OseliaModelVO.API_TYPE_ID, field_names<OseliaModelVO>().alias_model_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Modèle original (si c\'est un alias)', false)
            .set_many_to_one_target_moduletable_name(OseliaModelVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaModelVO,
                name,
                DefaultTranslationVO.create_new({ 'fr-fr': "Modèle Osélia" })
            )
        );
    }

    private initializeOseliaTokenPriceVO() {

        ModuleTableFieldController.create_new(OseliaTokenPriceVO.API_TYPE_ID, field_names<OseliaTokenPriceVO>().model_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange, 'Modèles associés', true)
            .set_many_to_one_target_moduletable_name(OseliaModelVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaTokenPriceVO.API_TYPE_ID, field_names<OseliaTokenPriceVO>().ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Plage de dates de validité de ce prix', true);

        ModuleTableFieldController.create_new(OseliaTokenPriceVO.API_TYPE_ID, field_names<OseliaTokenPriceVO>().million_input_token_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix / 1M tokens en entrée', true);
        ModuleTableFieldController.create_new(OseliaTokenPriceVO.API_TYPE_ID, field_names<OseliaTokenPriceVO>().million_output_token_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix / 1M tokens en sortie', true);

        ModuleTableFieldController.create_new(OseliaTokenPriceVO.API_TYPE_ID, field_names<OseliaTokenPriceVO>().partner_million_input_token_base_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix de revente / 1M tokens en entrée', true);
        ModuleTableFieldController.create_new(OseliaTokenPriceVO.API_TYPE_ID, field_names<OseliaTokenPriceVO>().partner_million_output_token_base_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix de revente / 1M tokens en sortie', true);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaTokenPriceVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Prix des tokens Osélia" })
            )
        );
    }

    private initializeOseliaVisionPriceVO() {

        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().model_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange, 'Modèles associés', true)
            .set_many_to_one_target_moduletable_name(OseliaModelVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Plage de dates de validité de ce prix', true);

        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().million_token_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix / 1M tokens', true);
        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().base_tokens, ModuleTableFieldVO.FIELD_TYPE_float, 'Tokens de base', true);
        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().tokens_per_tile, ModuleTableFieldVO.FIELD_TYPE_float, 'Tokens par tuile', true);
        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().tile_width_px, ModuleTableFieldVO.FIELD_TYPE_float, 'Largeur tuile en px', true);
        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().tile_height_px, ModuleTableFieldVO.FIELD_TYPE_float, 'Hauteur tuile en px', true);

        ModuleTableFieldController.create_new(OseliaVisionPriceVO.API_TYPE_ID, field_names<OseliaVisionPriceVO>().partner_million_token_base_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix de revente / 1M tokens', true);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaVisionPriceVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Prix de la vision Osélia" })
            )
        );
    }

    private initializeOseliaImagePriceVO() {

        ModuleTableFieldController.create_new(OseliaImagePriceVO.API_TYPE_ID, field_names<OseliaImagePriceVO>().model_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange, 'Modèles associés', true)
            .set_many_to_one_target_moduletable_name(OseliaModelVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaImagePriceVO.API_TYPE_ID, field_names<OseliaImagePriceVO>().ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Plage de dates de validité de ce prix', true);

        ModuleTableFieldController.create_new(OseliaImagePriceVO.API_TYPE_ID, field_names<OseliaImagePriceVO>().quality_filter, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Filtre qualité', true);
        ModuleTableFieldController.create_new(OseliaImagePriceVO.API_TYPE_ID, field_names<OseliaImagePriceVO>().resolution_filter, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Filtre résolution', true);

        ModuleTableFieldController.create_new(OseliaImagePriceVO.API_TYPE_ID, field_names<OseliaImagePriceVO>().price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix', true);
        ModuleTableFieldController.create_new(OseliaImagePriceVO.API_TYPE_ID, field_names<OseliaImagePriceVO>().reseller_base_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix revendeur', true);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaImagePriceVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Prix des images Osélia" })
            )
        );
    }

    private initializeOseliaAssistantPriceVO() {

        ModuleTableFieldController.create_new(OseliaAssistantPriceVO.API_TYPE_ID, field_names<OseliaAssistantPriceVO>().model_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange, 'Modèles associés', true)
            .set_many_to_one_target_moduletable_name(OseliaModelVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaAssistantPriceVO.API_TYPE_ID, field_names<OseliaAssistantPriceVO>().ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Plage de dates de validité de ce prix', true);

        ModuleTableFieldController.create_new(OseliaAssistantPriceVO.API_TYPE_ID, field_names<OseliaAssistantPriceVO>().code_interpreter_session_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix session Code Interpreter', true);
        ModuleTableFieldController.create_new(OseliaAssistantPriceVO.API_TYPE_ID, field_names<OseliaAssistantPriceVO>().file_search_gibibyte_daily_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix /GB Vector-Storage/Jour', true);

        ModuleTableFieldController.create_new(OseliaAssistantPriceVO.API_TYPE_ID, field_names<OseliaAssistantPriceVO>().partner_code_interpreter_session_base_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix de revente session Code Interpreter', true);
        ModuleTableFieldController.create_new(OseliaAssistantPriceVO.API_TYPE_ID, field_names<OseliaAssistantPriceVO>().partner_file_search_gibibyte_daily_base_price, ModuleTableFieldVO.FIELD_TYPE_float, 'Prix de revente /GB Vector-Storage/Jour', true);


        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaAssistantPriceVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Prix des assistants Osélia" })
            )
        );
    }
}
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import ExternalAPIAuthentificationVO from '../API/vos/ExternalAPIAuthentificationVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableCompositeUniqueKeyController from '../DAO/ModuleTableCompositeUniqueKeyController';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableCompositeUniqueKeyVO from '../DAO/vos/ModuleTableCompositeUniqueKeyVO';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import FileVO from '../File/vos/FileVO';
import GPTAssistantAPIAssistantFunctionVO from '../GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionVO from '../GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunVO from '../GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadVO from '../GPT/vos/GPTAssistantAPIThreadVO';
import Module from '../Module';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import LangVO from '../Translation/vos/LangVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import OseliaAssistantPriceVO from './vos/OseliaAssistantPriceVO';
import OseliaChatVO from './vos/OseliaChatVO';
import OseliaImagePriceVO from './vos/OseliaImagePriceVO';
import OseliaModelVO from './vos/OseliaModelVO';
import OseliaPromptVO from './vos/OseliaPromptVO';
import OseliaReferrerExternalAPIVO from './vos/OseliaReferrerExternalAPIVO';
import OseliaReferrerVO from './vos/OseliaReferrerVO';
import OseliaRunFunctionCallVO from './vos/OseliaRunFunctionCallVO';
import OseliaRunTemplateVO from './vos/OseliaRunTemplateVO';
import OseliaRunVO from './vos/OseliaRunVO';
import OseliaThreadCacheVO from './vos/OseliaThreadCacheVO';
import OseliaThreadReferrerVO from './vos/OseliaThreadReferrerVO';
import OseliaTokenPriceVO from './vos/OseliaTokenPriceVO';
import OseliaUserReferrerOTTVO from './vos/OseliaUserReferrerOTTVO';
import OseliaUserReferrerVO from './vos/OseliaUserReferrerVO';
import OseliaVisionPriceVO from './vos/OseliaVisionPriceVO';
import OpenOseliaDBParamVO, { OpenOseliaDBParamVOStatic } from './vos/apis/OpenOseliaDBParamVO';
import OseliaScreenshotParamVO, { OseliaScreenshotParamVOStatic } from './vos/apis/OseliaScreenshotParamVO';
import UserParamVO, { UserParamStatic } from '../API/vos/apis/UserParamVO';
import OseliaThreadUsersVO from './vos/OseliaThreadUserVO';
import OseliaThreadUserVO from './vos/OseliaThreadUserVO';
import OseliaThreadRoleVO from './vos/OseliaThreadRoleVO';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import RequestOseliaUserConnectionParamVO, { RequestOseliaUserConnectionParamVOStatic } from './vos/apis/RequestOseliaUserConnectionParamVO';
export default class ModuleOselia extends Module {

    public static MODULE_NAME: string = 'Oselia';
    public static ROLE_UID_PREFIX: string = 'oselia.thread.roles.names.';
    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleOselia.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_SELECT_THREAD_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleOselia.MODULE_NAME + '.SELECT_THREAD_ACCESS';
    public static OSELIA_DB_ID_PARAM_NAME: string = 'ModuleOselia.oselia_db_id';
    public static OSELIA_EXPORT_DASHBOARD_ID_PARAM_NAME: string = 'ModuleOselia.oselia_export_dashboard_id';
    public static OSELIA_THREAD_DASHBOARD_ID_PARAM_NAME: string = 'ModuleOselia.oselia_thread_dashboard_id';
    public static WEBHOOK_TEAMS_PARAM_NAME: string = 'ModuleOselia.WEBHOOK_TEAMS';

    /**
     * Définition des noms des rôles de thread
     */
    public static ROLE_OWNER = ModuleOselia.ROLE_UID_PREFIX + 'owner';
    public static ROLE_USER = ModuleOselia.ROLE_UID_PREFIX + 'user';

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
    public static APINAME_send_join_request: string = "oselia__send_join_request";
    public static APINAME_create_thread: string = "oselia__create_thread";

    // public static APINAME_get_thread_text_content: string = "get_thread_text_content";

    private static instance: ModuleOselia = null;

    public get_token_oselia: (url: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_token_oselia);

    // public get_thread_text_content: (thread_vo_id: number) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_thread_text_content);

    public open_oselia_db: (referrer_user_ott: string, openai_thread_id: string, openai_assistant_id: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_open_oselia_db);
    public link_user_to_oselia_referrer: (referrer_code: string, user_email: string, referrer_user_uid: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_link_user_to_oselia_referrer);
    public create_thread: () => Promise<number> = APIControllerWrapper.sah(ModuleOselia.APINAME_create_thread);
    public get_referrer_name: (referrer_user_ott: string) => Promise<string> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_referrer_name);
    public accept_link: (referrer_user_ott: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_accept_link);
    public refuse_link: (referrer_user_ott: string) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_refuse_link);
    public set_screen_track: (track: MediaStreamTrack) => Promise<void> = APIControllerWrapper.sah(ModuleOselia.APINAME_set_screen_track);
    public get_screen_track: () => Promise<MediaStreamTrack | null> = APIControllerWrapper.sah(ModuleOselia.APINAME_get_screen_track);
    public account_waiting_link_status: (referrer_user_ott: string) => Promise<'validated' | 'waiting' | 'none'> = APIControllerWrapper.sah(ModuleOselia.APINAME_account_waiting_link_status);
    public send_join_request: (asking_user_id: number, thread_id: number) => Promise<'accepted' | 'denied' | 'timed out'> = APIControllerWrapper.sah(ModuleOselia.APINAME_send_join_request);

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
        this.initializeOseliaThreadRoleVO();
        this.initializeOseliaThreadUserVO();

        this.initializeOseliaRunVO();
        this.initializeOseliaRunTemplateVO();

        this.initializeOseliaRunFunctionCallVO();

        this.initializeOseliaThreadCacheVO();
    }

    public initializeOseliaThreadCacheVO() {
        const field_thread_id = ModuleTableFieldController.create_new(OseliaThreadCacheVO.API_TYPE_ID, field_names<OseliaThreadCacheVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        const field_key = ModuleTableFieldController.create_new(OseliaThreadCacheVO.API_TYPE_ID, field_names<OseliaThreadCacheVO>().key, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'entrée', true);
        ModuleTableFieldController.create_new(OseliaThreadCacheVO.API_TYPE_ID, field_names<OseliaThreadCacheVO>().value, ModuleTableFieldVO.FIELD_TYPE_string, 'Valeur', false);

        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.create_new(this.name, OseliaThreadCacheVO, null, 'Oselia - Thread Cache'));
        ModuleTableCompositeUniqueKeyController.add_composite_unique_key_to_vo_type(OseliaThreadCacheVO.API_TYPE_ID, [field_thread_id, field_key]);
    }

    public initializeOseliaRunFunctionCallVO() {
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().oselia_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Osélia Run', false)
            .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().gpt_function_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Function', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIFunctionVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().external_api_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'External API', false)
            .set_many_to_one_target_moduletable_name(OseliaReferrerExternalAPIVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().function_call_parameters_initial, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Paramètres de la fonction - initial', false);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().function_call_parameters_transcripted, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Paramètres de la fonction - transcripté', false);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().result, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Résultat', false);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début', false);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, false, OseliaRunFunctionCallVO.STATE_TODO).setEnumValues(OseliaRunFunctionCallVO.STATE_LABELS);
        ModuleTableFieldController.create_new(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().error_msg, ModuleTableFieldVO.FIELD_TYPE_string, 'Erreur', false);

        ModuleTableController.create_new(this.name, OseliaRunFunctionCallVO, null, 'Oselia - Run Function Call');
    }

    public initializeOseliaRunTemplateVO() {
        const label = ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().template_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du template', true);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'étape', true);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().thread_title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre du thread - si création', false);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().hide_prompt, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer le prompt', true, true, false);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().hide_outputs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer les messages Osélia', true, true, false);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().initial_content_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().initial_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', false)
            .set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().file_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Fichiers', false)
            .set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().use_splitter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Découper la tâche', true, true, false);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().use_validator, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Utiliser le validateur', true, true, false);

        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, OseliaRunVO.STATE_TODO).setEnumValues(OseliaRunVO.STATE_LABELS);

        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().childrens_are_multithreaded, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Les enfants sont multithreadés', true, true, false);

        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().parent_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Run parent', false)
            .set_many_to_one_target_moduletable_name(OseliaRunTemplateVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

        ModuleTableController.create_new(this.name, OseliaRunTemplateVO, label, 'Oselia - Run Template');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[OseliaRunTemplateVO.API_TYPE_ID]);
    }

    public initializeOseliaRunVO() {

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'étape', true);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', false)
            .set_many_to_one_target_moduletable_name(OseliaReferrerVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre du thread - si création', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().hide_prompt, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer le prompt', true, true, false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().hide_outputs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer les messages Osélia', true, true, false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initial_content_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initial_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', false)
            .set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initial_prompt_parameters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Paramètres du prompt', false);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initialised_run_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt initialisé - run', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initialised_splitter_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt initialisé - splitter', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initialised_validator_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt initialisé - validateur', false);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().file_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Fichiers', false)
            .set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().use_splitter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Découper la tâche', true, true, false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().use_validator, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Utiliser le validateur', true, true, false);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début du découpage', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin du découpage', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().waiting_split_end_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début d\'attente des runs enfants', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().waiting_split_end_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin d\'attente des runs enfants', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début du run', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin du run', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début de validation', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin de validation', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_ask_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de demande de rerun', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, OseliaRunVO.STATE_TODO).setEnumValues(OseliaRunVO.STATE_LABELS);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().childrens_are_multithreaded, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Les enfants sont multithreadés', true, true, false);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run - SPLIT', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run - RUN', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run - VALIDATION', false)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().parent_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Run parent', false)
            .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().error_msg, ModuleTableFieldVO.FIELD_TYPE_string, 'Message d\'erreur', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du rerun', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_reason, ModuleTableFieldVO.FIELD_TYPE_string, 'Raison du rerun', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_new_initial_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Nouveau prompt initial pour rerun', false);
        ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_of_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rerun de', false)
            .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);

        ModuleTableController.create_new(this.name, OseliaRunVO, null, 'Oselia - Run');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[OseliaRunVO.API_TYPE_ID]);

        // On ajoute le lien vers OseliaRunVO dans le ThreadGPT
        ModuleTableFieldController.create_new(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().last_oselia_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Dernier run Osélia', false)
            .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);
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

        APIControllerWrapper.registerApi(new PostAPIDefinition<UserParamVO, void>(
            null,
            ModuleOselia.APINAME_send_join_request,
            [UserVO.API_TYPE_ID, GPTAssistantAPIThreadVO.API_TYPE_ID],
            UserParamStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<void, number>(
            null,
            ModuleOselia.APINAME_create_thread,
            null,
            null
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

    private initializeOseliaThreadRoleVO() {
        ModuleTableFieldController.create_new(OseliaThreadRoleVO.API_TYPE_ID, field_names<OseliaThreadRoleVO>().translatable_name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom', true)

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaThreadRoleVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Role Thread Osélia" })
            )
        );
    }

    private initializeOseliaThreadUserVO() {
        ModuleTableFieldController.create_new(OseliaThreadUserVO.API_TYPE_ID, field_names<OseliaThreadUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true)
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaThreadUserVO.API_TYPE_ID, field_names<OseliaThreadUserVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', true)
            .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(OseliaThreadUserVO.API_TYPE_ID, field_names<OseliaThreadUserVO>().role_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Role', true)
            .set_many_to_one_target_moduletable_name(OseliaThreadRoleVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(
            ModuleTableController.create_new(
                this.name,
                OseliaThreadUserVO,
                null,
                DefaultTranslationVO.create_new({ 'fr-fr': "Lien Thread/Utilisateur/Role Osélia" })
            )
        );
    }


}
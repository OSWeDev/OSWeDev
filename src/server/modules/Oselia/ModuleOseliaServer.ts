import axios from 'axios';
import { Request, Response } from 'express';
import fs, { createWriteStream } from "fs";
import { ChatCompletion, ImagesResponse } from 'openai/resources';
import { Thread } from 'openai/resources/beta/threads/threads';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ExternalAPIAuthentificationVO from '../../../shared/modules/API/vos/ExternalAPIAuthentificationVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ActionURLCRVO from '../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLUserVO from '../../../shared/modules/ActionURL/vos/ActionURLUserVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import EventifyEventConfVO from '../../../shared/modules/Eventify/vos/EventifyEventConfVO';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import EventifyEventListenerInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageContentImageFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentImageFileVO';
import GPTAssistantAPIThreadMessageContentTextVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentTextVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';
import OseliaController from '../../../shared/modules/Oselia/OseliaController';
import OseliaReferrerExternalAPIVO from '../../../shared/modules/Oselia/vos/OseliaReferrerExternalAPIVO';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaRunFunctionCallVO from '../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import OseliaRunTemplateVO from '../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaThreadCacheVO from '../../../shared/modules/Oselia/vos/OseliaThreadCacheVO';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';
import OseliaThreadRoleVO from '../../../shared/modules/Oselia/vos/OseliaThreadRoleVO';
import OseliaThreadUserVO from '../../../shared/modules/Oselia/vos/OseliaThreadUserVO';
import OseliaUserReferrerOTTVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerOTTVO';
import OseliaUserReferrerVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerVO';
import TeamsWebhookContentActionOpenUrlVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ExternalAPIServerController from '../API/ExternalAPIServerController';
import ServerAPIController from '../API/ServerAPIController';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import PasswordInitialisation from '../AccessPolicy/PasswordInitialisation/PasswordInitialisation';
import ActionURLServerTools from '../ActionURL/ActionURLServerTools';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import FileServerController from '../File/FileServerController';
import ForkedTasksController from '../Fork/ForkedTasksController';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import ModuleGPTServer from '../GPT/ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from '../GPT/sync/GPTAssistantAPIServerSyncAssistantsController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ParamsServerController from '../Params/ParamsServerController';
import PushDataServerController from '../PushData/PushDataServerController';
import SocketWrapper from '../PushData/vos/SocketWrapper';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import SuperviseurAssistantTraductionServerController from '../Translation/SuperviseurAssistantTraductionServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ModuleVersionedServer from '../Versioned/ModuleVersionedServer';
import OseliaAgentMemServerController from './OseliaAgentMemServerController';
import OseliaAppMemServerController from './OseliaAppMemServerController';
import OseliaRunServerController from './OseliaRunServerController';
import OseliaRunTemplateServerController from './OseliaRunTemplateServerController';
import OseliaServerController from './OseliaServerController';
import OseliaUserMemServerController from './OseliaUserMemServerController';
import OseliaOldRunsResyncBGThread from './bgthreads/OseliaOldRunsResyncBGThread';
import OseliaRunBGThread from './bgthreads/OseliaRunBGThread';
import OseliaThreadTitleBuilderBGThread from './bgthreads/OseliaThreadTitleBuilderBGThread';

export default class ModuleOseliaServer extends ModuleServerBase {

    private static instance: ModuleOseliaServer = null;
    private static screen_track: MediaStreamTrack = null;
    private static referers_triggers_hooks_condition_UID_cache: { [trigger_type_UID: string]: { [condition_UID: string]: [(params: unknown, exec_as_server?: boolean) => Promise<unknown>] } } = {};
    private static TASK_NAME_clear_reapply_referrers_triggers_OnThisThread: string = 'ModuleOseliaServer.clear_reapply_referrers_triggers_OnThisThread';
    // private static TASK_NAME_init_missing_thread_titles: string = 'ModuleOseliaServer.init_missing_thread_titles';

    protected constructor() {
        super(ModuleOselia.getInstance().name);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleOseliaServer {
        if (!ModuleOseliaServer.instance) {
            ModuleOseliaServer.instance = new ModuleOseliaServer();
        }
        return ModuleOseliaServer.instance;
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_open_oselia_db, this.open_oselia_db.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_link_user_to_oselia_referrer, this.link_user_to_oselia_referrer.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_get_token_oselia, this.get_token_oselia.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_get_referrer_name, this.get_referrer_name.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_accept_link, this.accept_link.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_refuse_link, this.refuse_link.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_account_waiting_link_status, this.account_waiting_link_status.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_send_join_request, this.send_join_request.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_set_screen_track, this.set_screen_track.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_get_screen_track, this.get_screen_track.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_create_thread, this.create_thread.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_replay_function_call, this.replay_function_call.bind(this));

        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_notify_thread_loaded, this.notify_thread_loaded.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_notify_thread_loading, this.notify_thread_loading.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleOselia>().instantiate_oselia_run_from_event, this.instantiate_oselia_run_from_event.bind(this));
    }

    public async get_codes_that_need_translation(thread_vo: GPTAssistantAPIThreadVO, pattern: string, code_lang: string): Promise<string> {
        return await SuperviseurAssistantTraductionServerController.get_codes_that_need_translation(thread_vo, pattern, code_lang);
    }

    public async instantiate_assistant_traduction(thread_vo: GPTAssistantAPIThreadVO, code_text_a_traduire: string, code_lang: string, commentaire: string): Promise<string> {
        return await SuperviseurAssistantTraductionServerController.instantiate_assistant_traduction(thread_vo, code_text_a_traduire, code_lang, commentaire);
    }

    public async push_message_to_supervised_thread_id(thread_vo: GPTAssistantAPIThreadVO, thread_id: number, message: string): Promise<string> {
        return await SuperviseurAssistantTraductionServerController.push_message_to_supervised_thread_id(thread_vo, thread_id, message);
    }

    public async app_mem_get_keys(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {
        return OseliaAppMemServerController.get_keys(thread_vo, pattern);
    }

    public async app_mem_get_entries(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {
        return OseliaAppMemServerController.get_entries(thread_vo, pattern);
    }

    public async app_mem_set_mem(thread_vo: GPTAssistantAPIThreadVO, key: string, value: string): Promise<string> {
        return OseliaAppMemServerController.set_mem(thread_vo, key, value);
    }

    public async agent_mem_get_keys(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {
        return OseliaAgentMemServerController.get_keys(thread_vo, pattern);
    }

    public async agent_mem_get_entries(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {
        return OseliaAgentMemServerController.get_entries(thread_vo, pattern);
    }

    public async agent_mem_set_mem(thread_vo: GPTAssistantAPIThreadVO, key: string, value: string): Promise<string> {
        return OseliaAgentMemServerController.set_mem(thread_vo, key, value);
    }

    public async user_mem_get_keys(thread_vo: GPTAssistantAPIThreadVO, pattern: string, user_id: number, asked_by: string): Promise<string> {
        return OseliaUserMemServerController.get_keys(thread_vo, pattern, user_id, asked_by);
    }

    public async user_mem_get_entries(thread_vo: GPTAssistantAPIThreadVO, pattern: string, user_id: number, asked_by: string): Promise<string> {
        return OseliaUserMemServerController.get_entries(thread_vo, pattern, user_id, asked_by);
    }

    public async user_mem_set_mem(thread_vo: GPTAssistantAPIThreadVO, key: string, value: string, user_id: number, asked_by: string): Promise<string> {
        return OseliaUserMemServerController.set_mem(thread_vo, key, value, user_id, asked_by);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'TODO' },
            'OseliaRunFunctionCallVO.STATE_TODO'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'En cours...' },
            'OseliaRunFunctionCallVO.STATE_RUNNING'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Terminé' },
            'OseliaRunFunctionCallVO.STATE_DONE'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Erreur' },
            'OseliaRunFunctionCallVO.STATE_ERROR'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Auto-commit de la saisie audio' },
            'auto_commit_auto_input.auto.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Relecture de la saisie audio' },
            'auto_commit_auto_input.manual.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Connexion à Osélia' },
            'OseliaReferrerActivationComponent.header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'L\'application {referrer_name} demande à se connecter à votre compte Osélia. {referrer_name} pourra accéder aux discussions que vous aurez avec Osélia depuis leur application.' },
            'OseliaReferrerActivationComponent.content.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Accepter' },
            'OseliaReferrerActivationComponent.accept.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Refuser' },
            'OseliaReferrerActivationComponent.refuse.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Erreur lors de la connexion à Osélia' },
            'OseliaReferrerNotFoundComponent.header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'La configuration actuelle de cette application ne vous permet pas l\'accès à Osélia. Contactez le support client pour qu\'ils valident votre inscription.' },
            'OseliaReferrerNotFoundComponent.content.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Fermer la fenêtre' },
            'OseliaReferrerNotFoundComponent.close.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Ajouter un commentaire' },
            'oselia_thread_feedback.oselia_thread_feedback__add_feedback_text.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Texte copié dans le presse-papier' },
            'oselia_thread_message.copy_success.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Echec de la copie' },
            'oselia_thread_message.copy_failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Osélia' },
            'TeamsAPIServerController.open_oselia.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Modifier' },
            'oselia_thread_widget_component.thread_message_footer_actions.edit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Copier le texte' },
            'oselia_thread_widget_component.thread_message_footer_actions.copy.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Obtenir une nouvelle réponse' },
            'oselia_thread_widget_component.thread_message_footer_actions.rerun.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Donnez votre avis sur ce résultat' },
            'oselia_thread_widget_component.thread_message_footer_actions.feedback.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Certitude : ' },
            'oselia_thread_widget_component.thread_message_certitude.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nous allons vous demander l\'autorisation de capturer votre écran, veuillez accepter' },
            'oselia.screenshot.notify.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Demande envoyée' },
            'oselia.join_request.notify.sent.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Demande acceptée' },
            'oselia.join_request.notify.accept.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Demande refusée' },
            'oselia.join_request.notify.deny.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Accepter' },
            'oselia.join_request.accept.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Refuser' },
            'oselia.join_request.deny.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Maintenir appuyer et parler (nécessite d\'accepter la demande d\'accès au micro)' },
            'oselia_thread_widget_component.thread_message_input_voice.tooltip.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Parler' },
            'oselia_thread_widget_component.thread_message_input_voice.talk.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Obtenir un résumé du ticket (audio et texte)' },
            'oselia_thread_widget_component.thread_message_input_summary.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Préparation...' },
            'oselia_thread_widget_component.thread_message_input_summary.loading.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Résumé' },
            'oselia_thread_widget_component.thread_message_input_summary.summarize.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Écoute...' },
            'oselia_thread_widget_component.thread_message_input_voice.listening.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Traitement...' },
            'oselia_thread_widget_component.thread_message_input_voice.transcribing.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Cache' },
            'oselia_thread_widget_component.thread_cached_datas_header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Sous-threads' },
            'oselia_thread_widget_component.sub_threads_header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Thread parent' },
            'oselia_thread_widget_component.parent_thread.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Appels de fonctions' },
            'oselia_thread_widget_component.function_calls_header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Tâches Osélia' },
            'oselia_thread_widget_component.oselia_runs_header.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'À faire' },
            'OseliaRunVO.STATE_TODO'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'En cours de division' },
            'OseliaRunVO.STATE_SPLITTING'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Division terminé' },
            'OseliaRunVO.STATE_SPLIT_ENDED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'En attente de la fin des divisions' },
            'OseliaRunVO.STATE_WAITING_SPLITS_END'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Fin de l\'attente des divisions' },
            'OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'En cours d\'exécution' },
            'OseliaRunVO.STATE_RUNNING'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Exécution terminée' },
            'OseliaRunVO.STATE_RUN_ENDED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'En cours de validation' },
            'OseliaRunVO.STATE_VALIDATING'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Validation terminée' },
            'OseliaRunVO.STATE_VALIDATION_ENDED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Terminé' },
            'OseliaRunVO.STATE_DONE'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Erreur' },
            'OseliaRunVO.STATE_ERROR'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Annulé' },
            'OseliaRunVO.STATE_CANCELLED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Expiré' },
            'OseliaRunVO.STATE_EXPIRED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nécessite une réexécution' },
            'OseliaRunVO.STATE_NEEDS_RERUN'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Réexecution demandée' },
            'OseliaRunVO.STATE_RERUN_ASKED'));

        ModuleBGThreadServer.getInstance().registerBGThread(OseliaThreadTitleBuilderBGThread.getInstance());
        ModuleBGThreadServer.getInstance().registerBGThread(OseliaOldRunsResyncBGThread.getInstance());
        ModuleBGThreadServer.getInstance().registerBGThread(OseliaRunBGThread.getInstance());

        ForkedTasksController.register_task(ModuleOseliaServer.TASK_NAME_clear_reapply_referrers_triggers_OnThisThread, this.clear_reapply_referrers_triggers_OnThisThread.bind(this));
        // ForkedTasksController.register_task(ModuleOseliaServer.TASK_NAME_init_missing_thread_titles, this.init_missing_thread_titles.bind(this));
        // ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleOseliaServer.TASK_NAME_init_missing_thread_titles] =
        //     this.init_missing_thread_titles.bind(this);

        // AJOUTER les triggers existants pour les referrer + les triggers pour ajouter/supprimer les triggers en fonction de la mise à jour des referrers
        // Le plus simple est probablement de stocker un tableau des triggers qui sont mis en place par ce système, et pour toute modif et au démarrage de l'appli de clear / reapply
        await this.clear_reapply_referrers_triggers_OnThisThread();

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        postCreateTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.clear_reapply_referrers_triggers_OnAllThreads);
        postUpdateTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.clear_reapply_referrers_triggers_OnAllThreads);
        postDeleteTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.clear_reapply_referrers_triggers_OnAllThreads);

        preUpdateTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, this, this.pre_u_assistant_update_mem_functions);
        postCreateTrigger.registerHandler(GPTAssistantAPIAssistantVO.API_TYPE_ID, this, this.post_c_assistant_update_mem_functions);

        postCreateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.reset_has_no_run_ready_to_handle_on_thread);
        postUpdateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.reset_has_no_run_ready_to_handle_on_thread_on_u);
        postDeleteTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.reset_has_no_run_ready_to_handle_on_thread);

        // On force le run des oselia_run dès qu'ils sont créés/modifiés/supprimés
        postCreateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.asap_oselia_run_bgthread);
        postUpdateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.asap_oselia_run_bgthread);
        postDeleteTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.asap_oselia_run_bgthread);
        postCreateTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, this, this.asap_oselia_run_bgthread);
        postUpdateTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, this, this.asap_oselia_run_bgthread);
        postDeleteTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, this, this.asap_oselia_run_bgthread);

        postUpdateTrigger.registerHandler(GPTAssistantAPIRunVO.API_TYPE_ID, this, this.update_oselia_run_step_on_u_gpt_run);

        postUpdateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.update_parent_oselia_run_step_on_u_oselia_run);

        preCreateTrigger.registerHandler(ExternalAPIAuthentificationVO.API_TYPE_ID, this, this.init_api_key_from_mdp);
        preUpdateTrigger.registerHandler(ExternalAPIAuthentificationVO.API_TYPE_ID, this, this.init_api_key_from_mdp_preu);

        postCreateTrigger.registerHandler(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, this, this.set_has_content_on_thread_and_update_thread_title);

        preCreateTrigger.registerHandler(GPTAssistantAPIThreadVO.API_TYPE_ID, this, this.set_thread_oswedev_creation_date);

        const oselia_partners: OseliaReferrerVO[] = await query(OseliaReferrerVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<OseliaReferrerVO>();
        for (const i in oselia_partners) {
            OseliaServerController.authorized_oselia_partners.push(oselia_partners[i].referrer_origin);
        }

        postCreateTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.update_authorized_oselia_partners_onc);
        postUpdateTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.update_authorized_oselia_partners_onu);
        postDeleteTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.update_authorized_oselia_partners_ond);
    }

    /**
     * Fonction qui permet à Osélia de générer des images via OpenAI
     * @param model
     * @param prompt
     * @param size
     * @param thread_vo
     */
    public async generate_images(thread_vo: GPTAssistantAPIThreadVO, model: string, prompt: string, size: string, n: number) {
        try {

            if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                ConsoleHandler.log('ModuleOseliaServer:generate_image:Generating image with model:' + model + ':prompt:' + prompt + ':size:' + size + ':n:' + n + ':thread_vo gptid:' + thread_vo.gpt_thread_id);
            }

            const response: ImagesResponse = await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.images.generate,
                ModuleGPTServer.openai.images,
                {
                    prompt: prompt,
                    model: model,
                    n: n,
                    size: size as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792",
                });

            const image_urls: string[] = [];

            for (const i in response.data) {
                const image = response.data[i];

                if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                    ConsoleHandler.log('ModuleOseliaServer:generate_image:Generated image:' + i + '/' + response.data.length + ':url:' + image.url);
                }

                // On crée un fileVO, et on ajoute un message content de type image du coup dans le thread
                const output_path: string = ModuleFile.SECURED_FILES_ROOT + 'oselia_generated_images/' + Dates.year(Dates.now()) + '/' + Dates.month(Dates.now()) + '/' +
                    Math.round(Dates.now_ms()) + '_' + Math.floor(Math.random() * 1000000) + '.png';

                if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                    ConsoleHandler.log('ModuleOseliaServer:generate_image:output_path:' + output_path);
                }

                const new_file_vo = await ModuleOseliaServer.getInstance().download_image_form_openai_url(image.url, output_path);

                if (new_file_vo) {

                    const new_thread_message = new GPTAssistantAPIThreadMessageVO();
                    new_thread_message.thread_id = thread_vo.id;
                    new_thread_message.date = Dates.now();
                    new_thread_message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT;
                    new_thread_message.user_id = thread_vo.user_id;
                    new_thread_message.assistant_id = thread_vo.current_default_assistant_id;
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_thread_message);

                    const image_content = new GPTAssistantAPIThreadMessageContentVO();
                    image_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
                    image_content.thread_message_id = new_thread_message.id;
                    image_content.content_type_image_file = new GPTAssistantAPIThreadMessageContentImageFileVO();
                    image_content.content_type_image_file.file_id = new_file_vo.id;

                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_content);

                    image_urls.push(' URL de téléchargement de l\'image dont le prompt est : [' + prompt.substring(0, 50) + ((prompt.length > 50) ? '...' : '') + '] : ' +
                        ConfigurationService.node_configuration.base_url + (new_file_vo.path.startsWith('./') ? new_file_vo.path.substring(2) : new_file_vo.path));

                    if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                        ConsoleHandler.log('ModuleOseliaServer:generate_image:created message:' + new_thread_message.id + ' with content:' + image_content.id);
                    }
                } else {
                    throw new Error('ModuleOseliaServer:generate_image:Error while downloading image from OpenAI');
                }
            }

            return (n > 1 ? 'Images générées avec succès.' : 'Image générée avec succès.') + image_urls.join(' - ');
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:generate_image:Error while generating image:" + error);
            return 'Erreur lors de la génération de l\'image:' + error;
        }
    }

    /**
     * Fonction qui permet à Osélia d'analyser des images via OpenAI - Vision
     * @param code
     * @param prompt
     * @param thread_vo
     */
    public async analyse_image(thread_vo: GPTAssistantAPIThreadVO, code: string, prompt: string): Promise<string> {
        try {

            if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                ConsoleHandler.log('ModuleOseliaServer:analyse_image:Analysing image with code:' + code + ':thread_vo gptid:' + thread_vo.gpt_thread_id);
            }

            let file_vo: FileVO = null;
            if (!code.includes('/')) {
                // Get the file vo from the code
                file_vo = await query(FileVO.API_TYPE_ID)
                    .filter_by_id(parseFloat(code))
                    .exec_as_server()
                    .select_vo<FileVO>();
            } else {
                // Get the file vo from the path
                file_vo = await query(FileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<FileVO>().path, code)
                    .exec_as_server()
                    .select_vo<FileVO>();
            }

            const image_path = file_vo.path;
            const base64Image = await fs.promises.readFile(image_path, { encoding: 'base64' });

            const response = await GPTAssistantAPIServerController.wrap_api_call(
                ModuleGPTServer.openai.chat.completions.create,
                ModuleGPTServer.openai.chat.completions,
                {
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: prompt
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/png;base64,${base64Image}`
                                    },
                                },
                            ],
                        }
                    ]
                });

            const data = (response as ChatCompletion).choices[0];
            ConsoleHandler.log('Images analysé avec succès : ' + file_vo.path);
            return data.message.content;
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:analyse_image:Error while analysing image:" + error);
            return "Erreur lors de l'analyse de l'image, est-ce que le code envoyé est correct ?";
        }
    }

    /**
     * Fonction qui permet à Osélia d'analyser des images via OpenAI - Vision
     * @param thread_vo
     */
    public async take_screenshot(thread_vo: GPTAssistantAPIThreadVO): Promise<string> {
        try {

            if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                ConsoleHandler.log('ModuleOseliaServer:take_screenshot:Taking screenshot:thread_vo gptid:' + thread_vo.gpt_thread_id);
            }
            const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(thread_vo.current_oselia_assistant_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            await PushDataServerController.notifyScreenshot(
                StackContext.get('UID'),
                StackContext.get('CLIENT_TAB_ID'),
                assistant.gpt_assistant_id,
                thread_vo.gpt_thread_id
            );

            ConsoleHandler.log('ModuleOseliaServer:take_screenshot:Screenshot pris avec succès');
            return ' ';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:take_screenshot:Error while taking screenshot:" + error);
            return null;
        }
    }


    /**
     * Fonction qui permet à Osélia d'appeler un autre assistant
     * @param thread_vo
     * @param purpose_id
     */
    public async ask_assistant(thread_vo: GPTAssistantAPIThreadVO, purpose_id: number): Promise<string> {
        try {

            if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                ConsoleHandler.log('ModuleOseliaServer:ask_assistant:Asking assistant:thread_vo gptid:' + thread_vo.gpt_thread_id + ':purpose_id:' + purpose_id);
            }

            switch (purpose_id) {
                case 0:

                    const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, GPTAssistantAPIThreadVO.OSELIA_THREAD_HELPER_ASSISTANT_NAME)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIAssistantVO>();

                    if ((!assistant)) {
                        ConsoleHandler.error('ModuleOseliaServer:ask_assistant: - No assistant found');
                        return ' ';
                    }

                    const message = "Bonjour, analyse le fichier texte que je t'envoies, il contient le contenu d'une conversation entre un utilisateur et Osélia, tu dois analyser la conversation et synthétiser de façon concise les informations importantes.";
                    const messages_contents: string = await ModuleOseliaServer.getInstance().get_thread_text_content(thread_vo.id);

                    const new_thread = (await GPTAssistantAPIServerController.get_thread(null, null, assistant.id)).thread_vo;

                    const file_name = 'oselia_' + new_thread.gpt_thread_id + '.txt';
                    const text_file = new FileVO();
                    text_file.path = ModuleFile.FILES_ROOT + 'upload/' + file_name;
                    text_file.id = (await ModuleDAOServer.instance.insertOrUpdateVO_as_server(text_file)).id;

                    fs.writeFileSync(text_file.path, messages_contents, 'utf8');
                    GPTAssistantAPIServerController.ask_assistant(assistant.gpt_assistant_id, new_thread.gpt_thread_id, new_thread.thread_title, message, [text_file], null, true);
                    const action = new TeamsWebhookContentActionOpenUrlVO();
                    action.set_title("Ouvrir le fichier texte");
                    action.set_url(ConfigurationService.node_configuration.base_url + text_file.path.substring(2));

                    const open_oselia: ActionURLVO = await TeamsAPIServerController.create_action_button_open_oselia(thread_vo.id);
                    const action_2 = new TeamsWebhookContentActionOpenUrlVO().set_url(ActionURLServerTools.get_action_full_url(open_oselia)).set_title('Ouvrir la conversation de l\'utilisateur');
                    TeamsAPIServerController.send_teams_oselia_info("Test - assistant bug resolver", "Bonjour, un bug a été remonté !", new_thread.id, [action, action_2]);

                    return "Ne réponds pas à ce message, l'assistant a été appelé, lance ta capture d'écran";
                case 1:
                    break;
            }

            ConsoleHandler.log('ModuleOseliaServer:ask_assistant:Demande d\'assistant effectuée avec succès');
            return ' ';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:ask_assistant:Error while taking screenshot:" + error);
            return null;
        }
    }

    public async send_message_to_teams_info_oselia(
        thread_vo: GPTAssistantAPIThreadVO,
        title: string,
        content: string,
    ): Promise<string> {
        try {
            // On envoie une notification à Teams
            await TeamsAPIServerController.send_teams_oselia_info(title, content, thread_vo.id);
            return 'Message envoyé';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:send_message_to_teams_info_oselia:Error while sending message to Teams:" + error);
            return "send_message_to_teams_info_oselia:Error while sending message to Teams:" + error;
        }
    }

    public async send_message_to_teams_warn_oselia(
        thread_vo: GPTAssistantAPIThreadVO,
        title: string,
        content: string,
    ): Promise<string> {
        try {
            // On envoie une notification à Teams
            await TeamsAPIServerController.send_teams_oselia_warn(title, content, thread_vo.id);
            return 'Message envoyé';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:send_message_to_teams_warn_oselia:Error while sending message to Teams:" + error);
            return "send_message_to_teams_warn_oselia:Error while sending message to Teams:" + error;
        }
    }

    public async send_message_to_teams_success_oselia(
        thread_vo: GPTAssistantAPIThreadVO,
        title: string,
        content: string,
    ): Promise<string> {
        try {
            // On envoie une notification à Teams
            await TeamsAPIServerController.send_teams_oselia_success(title, content, thread_vo.id);
            return 'Message envoyé';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:send_message_to_teams_success_oselia:Error while sending message to Teams:" + error);
            return "send_message_to_teams_success_oselia:Error while sending message to Teams:" + error;
        }
    }

    public async send_message_to_teams_error_oselia(
        thread_vo: GPTAssistantAPIThreadVO,
        title: string,
        content: string,
    ): Promise<string> {
        try {
            // On envoie une notification à Teams
            await TeamsAPIServerController.send_teams_oselia_error(title, content, thread_vo.id);
            return 'Message envoyé';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:send_message_to_teams_error_oselia:Error while sending message to Teams:" + error);
            return "send_message_to_teams_error_oselia:Error while sending message to Teams:" + error;
        }
    }

    /**
     * Un méthode qui permet de récupérer le contenu d'un autre thread via un appel de fonction
     */
    public async get_thread_text_content(thread_vo_id: number): Promise<string> {
        try {

            let messages_contents: string = "";

            const thread_messages: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_id(thread_vo_id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                .set_sort(new SortByVO(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().created_at, false))
                .exec_as_server()
                .set_discarded_field_path(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_message_id)
                .select_vos<GPTAssistantAPIThreadMessageVO>();

            for (const message of thread_messages) {

                const message_content = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID)
                    .filter_by_id(message.id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                    .using(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                    .set_sort(new SortByVO(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().id, true))
                    .select_vos<GPTAssistantAPIThreadMessageContentVO>();
                for (const content of message_content) {
                    if ((!content.content_type_text) || (!content.content_type_text.value)) {
                        continue;
                    }
                    let new_content = "";
                    switch (message.role) {
                        case message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER:

                            // eslint-disable-next-line no-case-declarations
                            const sender = await query(UserVO.API_TYPE_ID)
                                .filter_by_id(message.user_id)
                                .select_vo<UserVO>();
                            if (content.hidden) {
                                if (content.content_type_text.value.startsWith("<") && content.content_type_text.value.endsWith(">")) {
                                    new_content = "[Champs technique de : " + sender.name + "]" + " : " + content.content_type_text.value;
                                } else {
                                    new_content = "[Fichier de : " + sender.name + "]" + " : " + content.content_type_text.value;
                                }
                            } else {
                                new_content = "[" + sender.name + "] : " + content.content_type_text.value;
                            }
                            break;
                        case message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT:
                            new_content = "[Oselia] : " + content.content_type_text.value;
                            break;
                    }
                    messages_contents += "\n" + new_content;
                }
            }

            return messages_contents;
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:get_thread_text_content:FAILED:" + error);
            return 'get_thread_text_content FAILED: ' + error;
        }
    }


    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleOselia.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Osélia'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleOselia.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration d\'Osélia'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleOselia.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès à la discussion avec Osélia'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_GENERATED_IMAGES_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_GENERATED_IMAGES_FO_ACCESS.group_id = group.id;
        POLICY_GENERATED_IMAGES_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_GENERATED_IMAGES_FO_ACCESS.translatable_name = ModuleOselia.POLICY_GENERATED_IMAGES_FO_ACCESS;
        POLICY_GENERATED_IMAGES_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_GENERATED_IMAGES_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès aux images générées par Osélia'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_GET_REFERRER_NAME: AccessPolicyVO = new AccessPolicyVO();
        POLICY_GET_REFERRER_NAME.group_id = group.id;
        POLICY_GET_REFERRER_NAME.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_GET_REFERRER_NAME.translatable_name = ModuleOselia.POLICY_GET_REFERRER_NAME;
        POLICY_GET_REFERRER_NAME = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_GET_REFERRER_NAME, DefaultTranslationVO.create_new({
            'fr-fr': 'Demander le nom du referrer par son code'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_GET_TOKEN_OSELIA: AccessPolicyVO = new AccessPolicyVO();
        POLICY_GET_TOKEN_OSELIA.group_id = group.id;
        POLICY_GET_TOKEN_OSELIA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_GET_TOKEN_OSELIA.translatable_name = ModuleOselia.POLICY_GET_TOKEN_OSELIA;
        POLICY_GET_TOKEN_OSELIA = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_GET_TOKEN_OSELIA, DefaultTranslationVO.create_new({
            'fr-fr': 'Demander un token unique d\'accès à Osélia'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS.group_id = group.id;
        POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS.translatable_name = ModuleOselia.POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS;
        POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_THREAD_MESSAGE_FEEDBACK_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Feedback sur les messages d\'Osélia'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_THREAD_FEEDBACK_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_THREAD_FEEDBACK_ACCESS.group_id = group.id;
        POLICY_THREAD_FEEDBACK_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_THREAD_FEEDBACK_ACCESS.translatable_name = ModuleOselia.POLICY_BO_ACCESS;
        POLICY_THREAD_FEEDBACK_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_THREAD_FEEDBACK_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Feedback sur les threads d\'Osélia'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let POLICY_SELECT_THREAD_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_SELECT_THREAD_ACCESS.group_id = group.id;
        POLICY_SELECT_THREAD_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_SELECT_THREAD_ACCESS.translatable_name = ModuleOselia.POLICY_SELECT_THREAD_ACCESS;
        POLICY_SELECT_THREAD_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_SELECT_THREAD_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Permission d\'accéder à n\'importe quel thread'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

    }

    public async open_oselia_db_from_action_url(action_url: ActionURLVO, uid: number, req: Request, api_call_id: number): Promise<ActionURLCRVO> {

        const params: { thread_id: number } = action_url.params as { thread_id: number };
        if ((!params) || (!params.thread_id)) {
            ConsoleHandler.error('Impossible de trouver la discussion Oselia pour l\'action URL: ' + action_url.action_name);
            return ActionURLServerTools.create_error_cr(action_url, 'Impossible de trouver la discussion Oselia');
        }

        await ServerAPIController.send_redirect_if_headers_not_already_sent(api_call_id, '/f/oselia/' + params.thread_id.toString());
        return ActionURLServerTools.create_info_cr(action_url, 'Redirection vers la discussion avec Osélia');
    }

    /**
     * Fonction pour l'assistant qui permet de valider un run oselia
     * @param thread_vo le thread qui gère la discussion avec l'assistant
     */
    public async validate_oselia_run(
        thread_vo: GPTAssistantAPIThreadVO,
    ): Promise<string> {
        if ((!thread_vo) || (!thread_vo.last_gpt_run_id)) {
            ConsoleHandler.error('validate_oselia_run:Impossible de trouver le thread ou le dernier run gpt:' + JSON.stringify(thread_vo));
            return 'ERREUR: Impossible de trouver le thread ou le dernier run gpt. Il peut être pertinent de retenter un appel à la fonction';
        }

        const gpt_run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_id(thread_vo.last_gpt_run_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();

        if (!gpt_run) {
            ConsoleHandler.error('validate_oselia_run:Impossible de trouver le run gpt:' + thread_vo.last_gpt_run_id);
            return 'ERREUR: Impossible de trouver le run gpt. Il peut être pertinent de retenter un appel à la fonction';
        }

        const oselia_run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);
        if (!oselia_run) {
            ConsoleHandler.error('validate_oselia_run:Impossible de trouver le run oselia associé au run gpt:' + gpt_run.id);
            return 'ERREUR: Impossible de trouver le run oselia associé au run gpt. Il peut être pertinent de retenter un appel à la fonction';
        }

        await OseliaRunServerController.update_oselia_run_state(oselia_run, OseliaRunVO.STATE_VALIDATION_ENDED);
        return 'OK - Run validé';
    }

    /**
     * Fonction pour l'assistant qui permet de refuser un run oselia et demander une nouvelle exécution avec un prompt modifié
     * @param thread_vo le thread qui gère la discussion avec l'assistant
     * @param rerun_reason la raison du rerun - version longue
     * @param rerun_name le nom du rerun - la raison en très court
     * @param rerun_new_initial_prompt le nouveau prompt qui permettra de corriger le run
     */
    public async refuse_oselia_run(
        thread_vo: GPTAssistantAPIThreadVO,
        rerun_reason: string,
        rerun_name: string,
        rerun_new_initial_prompt: string,
    ): Promise<string> {
        if ((!thread_vo) || (!thread_vo.last_gpt_run_id)) {
            ConsoleHandler.error('refuse_oselia_run:Impossible de trouver le thread ou le dernier run gpt:' + JSON.stringify(thread_vo));
            return 'ERREUR: Impossible de trouver le thread ou le dernier run gpt. Il peut être pertinent de retenter un appel à la fonction';
        }

        const gpt_run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_id(thread_vo.last_gpt_run_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();

        if (!gpt_run) {
            ConsoleHandler.error('refuse_oselia_run:Impossible de trouver le run gpt:' + thread_vo.last_gpt_run_id);
            return 'ERREUR: Impossible de trouver le run gpt. Il peut être pertinent de retenter un appel à la fonction';
        }

        const oselia_run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);
        if (!oselia_run) {
            ConsoleHandler.error('refuse_oselia_run:Impossible de trouver le run oselia associé au run gpt:' + gpt_run.id);
            return 'ERREUR: Impossible de trouver le run oselia associé au run gpt. Il peut être pertinent de retenter un appel à la fonction';
        }

        oselia_run.rerun_new_initial_prompt = rerun_new_initial_prompt;
        oselia_run.rerun_reason = rerun_reason;
        oselia_run.rerun_name = rerun_name;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run);
        await OseliaRunServerController.update_oselia_run_state(oselia_run, OseliaRunVO.STATE_NEEDS_RERUN);

        return 'OK - Run refusé et demande de rerun effectuée';
    }

    /**
     * Fonction pour charger un assistant depuis son nom
     * @param thread_vo le thread qui gère la discussion avec l'assistant
     * @param assistant_name le nom de l'assistant à charger
     */
    public async get_assistant(
        thread_vo: GPTAssistantAPIThreadVO,
        assistant_name: string,
    ): Promise<string> {
        if (!thread_vo) {
            ConsoleHandler.error('get_assistant:Impossible de trouver le thread:' + JSON.stringify(thread_vo));
            return 'ERREUR TECHNIQUE: Impossible de trouver le thread. Il peut être pertinent de retenter un appel à la fonction';
        }

        const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, assistant_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();

        if (!assistant) {
            ConsoleHandler.error('get_assistant:Impossible de trouver l\'assistant:' + assistant_name);
            return 'ERREUR: Impossible de trouver l\'assistant par son nom. Corriger et relancer la fonction';
        }

        return JSON.stringify(assistant);
    }

    /**
     * Fonction qui liste tous les assistants disponibles ainsi que leurs fonctions spécifiques.
     */
    public async get_all_assistants_and_functions(): Promise<string> {
        const res= {};

        const assistants = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .select_vos<GPTAssistantAPIAssistantVO>();

        for (const assistant of assistants) {
            res[assistant.nom] = { description: assistant.description, functions: [] };

            // On récupère les fonctions de l'assistant
            const assistant_functions_ids = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
                .filter_by_id(assistant.id, GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .select_vos<GPTAssistantAPIAssistantFunctionVO>();

            for (const assistant_function_id of assistant_functions_ids) {
                const assistant_function : GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                    .filter_by_id(assistant_function_id.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
                    .select_vo<GPTAssistantAPIFunctionVO>();

                const function_name = assistant_function.gpt_function_name;

                const assistant_parameters: GPTAssistantAPIFunctionParamVO[] = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<GPTAssistantAPIFunctionParamVO>().function_id, assistant_function.id, GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
                    .select_vos<GPTAssistantAPIFunctionParamVO>();
                const function_description = assistant_function.gpt_function_description;
                if (!res[assistant.nom].functions[function_name]) {
                    const parameters = {};
                    for (const assistant_parameter of assistant_parameters) {
                        parameters[assistant_parameter.gpt_funcparam_name] = {
                            description: assistant_parameter.gpt_funcparam_description,
                            type: assistant_parameter.type,
                            required: assistant_parameter.required,
                        };
                    }
                    res[assistant.nom].functions[function_name] = {
                        description: function_description,
                        parameters: parameters
                    };
                }
            }
        }

        return JSON.stringify(res);
    }

    /**
     * Fonction qui permet d'appeler une fonction de l'assistant
     * @param thread_id le thread qui gère la discussion avec l'assistant
     * @param assistant_function_name le nom de la fonction à appeler
     * @param assistant_function_parameters les paramètres de la fonction à appeler
     * @return le résultat de l'appel de la fonction
    **/
    public async call_assistant_function(
        thread_id: number,
        assistant_function_name: string,
        assistant_function_parameters: { [key: string]: any },
    ): Promise<string> {
        if (!thread_id) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver le thread:' + thread_id);
            return 'ERREUR TECHNIQUE: Impossible de trouver le thread. Il peut être pertinent de retenter un appel à la fonction';
        }

        if (!assistant_function_name) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver le nom de la fonction:' + assistant_function_name);
            return 'ERREUR: Impossible de trouver le nom de la fonction. Corriger et relancer la fonction';
        }

        if (!assistant_function_parameters) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver les paramètres de la fonction:' + assistant_function_parameters);
            return 'ERREUR: Impossible de trouver les paramètres de la fonction. Corriger et relancer la fonction';
        }

        const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread_vo) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver le thread:' + thread_id);
            return 'ERREUR: Impossible de trouver le thread. Corriger et relancer la fonction';
        }

        const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_id(thread_vo.current_oselia_assistant_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver l\'assistant:' + thread_vo.current_oselia_assistant_id);
            return 'ERREUR: Impossible de trouver l\'assistant. Corriger et relancer la fonction';
        }

        const assistant_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, assistant_function_name, GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIAssistantFunctionVO>();

        if (!assistant_function) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver la fonction de l\'assistant:' + assistant_function_name);
            return 'ERREUR: Impossible de trouver la fonction de l\'assistant. Corriger et relancer la fonction';
        }

        if (assistant_function.length > 1) {
            ConsoleHandler.error('call_assistant_function:Plusieurs fonctions trouvées pour l\'assistant:' + assistant_function_name);
            return 'ERREUR: Plusieurs fonctions trouvées pour l\'assistant. Corriger et relancer la fonction';
        }
        const assistant_function_id = assistant_function[0].id;
        const assistant_function_parameters_vo: GPTAssistantAPIFunctionParamVO[] = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_id(assistant_function_id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .select_vos<GPTAssistantAPIFunctionParamVO>();

        const assistant_function_parameters_values = {};

        for (const assistant_function_parameter of assistant_function_parameters_vo) {
            const parameter_name = assistant_function_parameter.gpt_funcparam_name;
            if (assistant_function_parameters[parameter_name]) {
                assistant_function_parameters_values[parameter_name] = assistant_function_parameters[parameter_name];
            } else {
                ConsoleHandler.error('call_assistant_function:Impossible de trouver le paramètre de la fonction:' + parameter_name);
                return 'ERREUR: Impossible de trouver le paramètre de la fonction. Corriger et relancer la fonction';
            }
        }
        const run_vo = new GPTAssistantAPIRunVO();
        run_vo.assistant_id = assistant.id;
        run_vo.thread_id = thread_vo.id;
        run_vo.gpt_assistant_id = assistant.gpt_assistant_id;
        run_vo.gpt_thread_id = thread_vo.gpt_thread_id;

        const referrers = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_id(thread_vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrers) {
            ConsoleHandler.error('call_assistant_function:Impossible de trouver le referrer:' + thread_vo.id);
            return 'ERREUR: Impossible de trouver le referrer. Corriger et relancer la fonction';
        }

        const { availableFunctions, availableFunctionsParameters }: {
            availableFunctions: { [functionName: string]: GPTAssistantAPIFunctionVO },
            availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] }
        } = await GPTAssistantAPIServerController.get_availableFunctions_and_availableFunctionsParameters(assistant, thread_vo.user_id, thread_vo.gpt_thread_id);

        const availableFunctionsParametersByParamName: { [function_id: number]: { [param_name: string]: GPTAssistantAPIFunctionParamVO } } = {};
        for (const i in availableFunctionsParameters) {
            const function_id = parseInt(i);
            availableFunctionsParametersByParamName[function_id] = {};
            for (const j in availableFunctionsParameters[i]) {
                const param = availableFunctionsParameters[i][j];
                availableFunctionsParametersByParamName[function_id][param.gpt_funcparam_name] = param;
            }
        }

        // GPTAssistantAPIServerController.do_function_call(
        //     run_vo,
        //     thread_vo,
        //     referrers,
        //     assistant_function,
        //     new OseliaRunFunctionCallVO(),
        //     assistant_function_name,
        //     assistant_function_parameters_values,
        // );

    }



    /**
     * La méthode qui devient une fonction pour l'assistant et qui permet de définir les tâches à venir
     * @param thread_vo le thread qui gère la discussion avec l'assistant
     * @param name le nom de la tâche
     * @param prompt le prompt de la tâche
     * @param weight le poids de la tâche - pour l'ordre d'exécution
     * @param use_validator si la tâche doit être validée automatiquement - par défaut non
     * @param hide_outputs si les sorties doivent être cachées - par défaut non
     * @param in_a_separate_thread si la tâche doit être exécutée dans un thread séparé - par défaut non
     * @param assistant_id l'id de l'assistant à utiliser pour la tâche - par défaut 0 ou null pour indiquer l'assistant actuel
     */
    public async append_new_child_run_step(
        thread_vo: GPTAssistantAPIThreadVO,
        name: string,
        prompt: string,
        weight: number,
        use_splitter: boolean,
        childrens_are_multithreaded: boolean,
        use_validator: boolean,
        hide_outputs: boolean,
        in_a_separate_thread: boolean,
        assistant_id: number,
    ): Promise<string> {

        try {

            // !! FIXME TODO on refuse le split par l'assistant par ce qu'il fait nimp avec ça pour le moment
            use_splitter = false;
            // !! FIXME TODO on refuse le split par l'assistant par ce qu'il fait nimp avec ça pour le moment

            if (!name) {
                ConsoleHandler.error('append_new_child_run_step:Name is mandatory');
                return 'ERREUR: Le nom est obligatoire. Corriger et relancer la fonction';
            }

            if (!prompt) {
                ConsoleHandler.error('append_new_child_run_step:Prompt is mandatory');
                return 'ERREUR: Le prompt est obligatoire. Corriger et relancer la fonction';
            }

            if (weight == null) {
                ConsoleHandler.error('append_new_child_run_step:Weight is mandatory');
                return 'ERREUR: Le poids est obligatoire. Corriger et relancer la fonction';
            }

            if ((!thread_vo) || (!thread_vo.last_gpt_run_id)) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le thread ou le dernier run gpt:' + JSON.stringify(thread_vo));
                return 'ERREUR: Impossible de trouver le thread ou le dernier run gpt. Il peut être pertinent de retenter un appel à la fonction';
            }

            const gpt_run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
                .filter_by_id(thread_vo.last_gpt_run_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIRunVO>();

            if (!gpt_run) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le run gpt:' + thread_vo.last_gpt_run_id);
                return 'ERREUR: Impossible de trouver le run gpt. Il peut être pertinent de retenter un appel à la fonction';
            }

            const oselia_run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);
            if (!oselia_run) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le run oselia associé au run gpt:' + gpt_run.id);
                return 'ERREUR: Impossible de trouver le run oselia associé au run gpt. Il peut être pertinent de retenter un appel à la fonction';
            }

            const prefix_prompt_step_oselia = await ParamsServerController.getParamValueAsString(OseliaRunServerController.PARAM_NAME_STEP_OSELIA_PROMPT_PREFIX);

            if (!prefix_prompt_step_oselia) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le paramètre de configuration:' + OseliaRunServerController.PARAM_NAME_STEP_OSELIA_PROMPT_PREFIX);
                return 'ERREUR: Impossible de trouver le paramètre de configuration. Il peut être pertinent de retenter un appel à la fonction';
            }

            const new_run_step = new OseliaRunVO();

            // Si un assistant_id est fourni on le teste
            if ((!!assistant_id) && (assistant_id != gpt_run.assistant_id)) {
                const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                    .filter_by_id(assistant_id)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIAssistantVO>();

                if (!assistant) {
                    ConsoleHandler.error('append_new_child_run_step:Assistant not found:' + assistant_id);
                    return 'ERREUR: Assistant [id:' + assistant_id + '] non trouvé. Corriger et relancer la fonction';
                }
            }

            new_run_step.assistant_id = (!!assistant_id) ? assistant_id : gpt_run.assistant_id;

            new_run_step.thread_id = in_a_separate_thread ? null : thread_vo.id;
            new_run_step.parent_run_id = oselia_run.id;
            new_run_step.childrens_are_multithreaded = (childrens_are_multithreaded == null) ? false : childrens_are_multithreaded;
            new_run_step.file_id_ranges = oselia_run.file_id_ranges;
            new_run_step.hide_outputs = (hide_outputs == null) ? false : hide_outputs;
            new_run_step.hide_prompt = true;
            new_run_step.initial_content_text = prefix_prompt_step_oselia + prompt;
            new_run_step.initial_prompt_id = null;
            new_run_step.initial_prompt_parameters = null;
            new_run_step.name = name;
            new_run_step.parent_run_id = oselia_run.id;
            new_run_step.start_date = Dates.now();
            new_run_step.state = OseliaRunVO.STATE_TODO;
            new_run_step.thread_title = null;
            new_run_step.use_splitter = (use_splitter == null) ? false : use_splitter;
            new_run_step.use_validator = (use_validator == null) ? false : use_validator;
            new_run_step.user_id = oselia_run.user_id;
            new_run_step.weight = weight;
            new_run_step.referrer_id = oselia_run.referrer_id;


            if (in_a_separate_thread) {
                // On le crée tout de suite pour le lien en parent au thread actuel
                const thread: {
                    thread_gpt: Thread;
                    thread_vo: GPTAssistantAPIThreadVO;
                } = await GPTAssistantAPIServerController.get_thread(new_run_step.user_id, null, new_run_step.oselia_thread_default_assistant_id ? new_run_step.oselia_thread_default_assistant_id : new_run_step.assistant_id);

                const referrers = await query(OseliaReferrerVO.API_TYPE_ID)
                    .filter_by_id(thread_vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                    .exec_as_server()
                    .select_vos<OseliaReferrerVO>();
                if (referrers && (referrers.length > 0)) {
                    for (const referrer of referrers) {
                        await OseliaServerController.link_thread_to_referrer(thread.thread_vo, referrer);
                    }
                }

                new_run_step.thread_id = thread.thread_vo.id;
                thread.thread_vo.thread_title = (thread_vo.thread_title ? '[SUB] ' + thread_vo.thread_title + ' : ' : '[SUB] ') + new_run_step.name;
                thread.thread_vo.needs_thread_title_build = false;
                thread.thread_vo.thread_title_auto_build_locked = true;
                thread.thread_vo.parent_thread_id = thread_vo.id;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread.thread_vo);
            }

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_run_step);

            return 'OK - Tâche ajoutée';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:append_new_child_run_step:Error while appending new child run step:" + error);
            return "Erreur lors de l'ajout de la tâche:" + error + ". Il peut être pertinent de corriger si possible et de retenter un appel à la fonction";
        }
    }

    /**
     * Fonction pour interroger le cache du thread (ou du thread parent de manière récursive)
     * @param thread_vo
     * @param key
     * @returns en priorité la valeur du cache local au thread si on trouve, sinon on cherche dans le cache du thread parent, et si on trouve rien c'est null.
     */
    public async get_cache_value(
        thread_vo: GPTAssistantAPIThreadVO,
        key: string,
    ): Promise<string> {

        /**
         * Par défaut on cherche en local et si on trouve pas on cherche chez le thread_parent si yen a un
         */

        if (!thread_vo) {
            ConsoleHandler.error('get_cache_value:Thread not found');
            return 'ERREUR Technique: Thread non trouvé: réeesayer';
        }

        if (!key) {
            ConsoleHandler.error('get_cache_value:Key is mandatory');
            return 'ERREUR: La clé est obligatoire: corriger et réessayer';
        }

        const cache = await query(OseliaThreadCacheVO.API_TYPE_ID)
            .filter_by_id(thread_vo.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaThreadCacheVO>().key, key)
            .exec_as_server()
            .select_vo<OseliaThreadCacheVO>();

        if (cache) {
            return (cache.value == null) ? '<aucune donnée pour cette clé de cache>' : cache.value;
        }

        if (!thread_vo.parent_thread_id) {
            return '<aucune donnée pour cette clé de cache>';
        }

        const parent_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(thread_vo.parent_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!parent_thread) {
            ConsoleHandler.error('get_cache_value:Parent thread not found');
            return 'ERREUR Technique: Thread parent non trouvé: réeesayer';
        }

        return this.get_cache_value(parent_thread, key);
    }

    /**
     * Fonction pour mettre à jour le cache du thread (ou des threads parents à la demande)
     * @param thread_vo
     * @param key
     * @param value la valeur à mettre à jour au format string
     * @param thread_id si on veut mettre à jour le cache d'un autre thread que le thread actuel (uniquement un thread parent de celui-ci)
     * @returns OK , KO
     */
    public async set_cache_value(
        thread_vo: GPTAssistantAPIThreadVO,
        key: string,
        value: string,
        thread_id: number,
    ): Promise<string> {

        if (!thread_vo) {
            ConsoleHandler.error('set_cache_value:Thread not found');
            return 'ERREUR Technique: Thread non trouvé: réeesayer';
        }

        if (!key) {
            ConsoleHandler.error('set_cache_value:Key is mandatory');
            return 'ERREUR: La clé est obligatoire: corriger et réessayer';
        }

        if (key.indexOf('{') >= 0) {
            ConsoleHandler.error('set_cache_value:Key cannot contain {');
            return 'ERREUR: La clé ne peut pas contenir { : corriger et réeesayer';
        }

        // Si on fourni un thread_id, on doit check qu'il existe et qu'il s'agit d'un thread parent du thread actuel
        if ((!!thread_id) && (thread_id != thread_vo.id)) {

            let thread_parent_id = thread_vo.parent_thread_id;
            while (thread_parent_id && (thread_parent_id != thread_id)) {
                const thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                    .filter_by_id(thread_id)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIThreadVO>();

                if (!thread) {
                    ConsoleHandler.error('set_cache_value:Thread not found:' + thread_id);
                    return 'ERREUR: Thread non trouvé: corriger et réeesayer';
                }
                thread_parent_id = thread.parent_thread_id;
            }

            if (!thread_parent_id) {
                ConsoleHandler.error('set_cache_value:Thread not parent of thread:' + thread_id);
                return 'ERREUR: Thread non parent du thread: corriger et réeesayer';
            }
        }

        // Si on fourni pas de thread_id, on prend le thread actuel
        thread_id = (!!thread_id) ? thread_id : thread_vo.id;

        let cache = await query(OseliaThreadCacheVO.API_TYPE_ID)
            .filter_by_id(thread_id, GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaThreadCacheVO>().key, key)
            .exec_as_server()
            .set_discarded_field_path(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_message_id)
            .select_vo<OseliaThreadCacheVO>();

        if (!cache) {
            cache = new OseliaThreadCacheVO();
            cache.thread_id = thread_id;
            cache.key = key;
        }

        cache.value = value;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cache);

        return 'OK';
    }


    public async accept_join_request(action_url: ActionURLVO, uid: number, req: Request, api_call_id: number): Promise<ActionURLCRVO> {
        if (!action_url.params) {
            ConsoleHandler.error('Impossible de trouver la discussion Oselia pour l\'action URL: ' + action_url.action_name);
            return ActionURLServerTools.create_error_cr(action_url, 'Impossible de trouver la discussion Oselia');
        }
        const params = action_url.params as { asking_user_id: number, target_thread_id: number, thread_message_id: number };
        const asking_user_id = params.asking_user_id;
        const target_thread_id = params.target_thread_id;
        const target_thread_message_id = params.thread_message_id;
        if (!asking_user_id || !target_thread_id || !target_thread_message_id) {
            ConsoleHandler.error('Impossible de trouver l\'utilisateur demandeur, ou le thread visé pour l\'action URL: ' + action_url.action_name);
            return ActionURLServerTools.create_error_cr(action_url, 'Impossible d\'ajouter l\'utilisateur à la conversation Osélia');
        }

        ConsoleHandler.log('ModuleOseliaServer:accept_join_request:Accepting join request:asking_user_id:' + asking_user_id + ':target_thread_id:' + target_thread_id);
        const thread_user_vo = new OseliaThreadUserVO();
        thread_user_vo.thread_id = target_thread_id;
        thread_user_vo.user_id = asking_user_id;
        thread_user_vo.role_id = (await query(OseliaThreadRoleVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaThreadRoleVO>().translatable_name, ModuleOselia.ROLE_USER)
            .exec_as_server()
            .select_vo<OseliaThreadRoleVO>()).id; // User
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_user_vo);

        await PushDataServerController.notifySimpleINFO(
            asking_user_id,
            StackContext.get('CLIENT_TAB_ID'),
            'oselia.join_request.notify.accept.___LABEL___'
        );
        const current_message_action_urls: ActionURLVO[] = await query(ActionURLVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos();
        for (const current_message_action_url of current_message_action_urls) {
            if (current_message_action_url.params && (current_message_action_url.params as { asking_user_id: number, target_thread_id: number, thread_message_id: number }).thread_message_id == target_thread_message_id) {
                current_message_action_url.action_remaining_counter = 0;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(current_message_action_url);
            }
        }
        return ActionURLServerTools.create_info_cr(action_url, 'Ajout dans la conversation Osélia');
    }

    public async refuse_join_request(action_url: ActionURLVO, uid: number): Promise<ActionURLCRVO> {
        const params = action_url.params as { asking_user_id: number, target_thread_id: number, thread_message_id: number };
        const asking_user_id = params.asking_user_id;
        const target_thread_message_id = params.thread_message_id;
        if (!asking_user_id || !target_thread_message_id) {
            ConsoleHandler.error('Impossible de trouver l\'utilisateur demandeur pour l\'action URL: ' + action_url.action_name);
            return ActionURLServerTools.create_error_cr(action_url, 'Impossible de refuser l\'ajout à la conversation Osélia');
        }

        await PushDataServerController.notifySimpleINFO(
            asking_user_id,
            null,
            'oselia.join_request.notify.deny.___LABEL___'
        );

        const current_message_action_urls: ActionURLVO[] = await query(ActionURLVO.API_TYPE_ID)
            .filter_by_text_including(field_names<ActionURLVO>().params, 'thread_message_id: ' + target_thread_message_id.toString())
            .exec_as_server()
            .select_vos();
        for (const action_url_ of current_message_action_urls) {
            action_url_.action_remaining_counter = 0;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(action_url_);
        }

        return ActionURLServerTools.create_info_cr(action_url, 'Refus d\'ajout dans la discussion Oselia');
    }

    private async set_screen_track(track: MediaStreamTrack): Promise<void> {
        ModuleOseliaServer.screen_track = track;
    }

    private async get_screen_track() {
        return ModuleOseliaServer.screen_track;
    }

    private async notify_thread_loaded(client_tab_id: string, event_name: string, event_param?): Promise<void> {
        const uid = StackContext.get('UID');
        await PushDataServerController.notifyEvent(uid, client_tab_id, event_name, event_param);
    }

    private async notify_thread_loading(client_tab_id: string, event_name: string, event_param?): Promise<void> {
        const uid = StackContext.get('UID');
        await PushDataServerController.notifyEvent(uid, client_tab_id, event_name, event_param);
    }

    private async create_thread(
        req: Request,
        res: Response) {

        /**
         * On commence par checker le referrer
         */
        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_origin, ConfigurationService.node_configuration.base_url)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            ConsoleHandler.error('No internal "Self" referrer');
            return;
        }

        const user = await query(UserVO.API_TYPE_ID)
            .filter_by_id(StackContext.get('UID'))
            .exec_as_server()
            .select_vo<UserVO>();
        if ((!user) || user.archived || user.blocked || user.invalidated) {
            ConsoleHandler.error('User not valid:uid:' + user.id);

            await this.send_hook_trigger_datas_to_referrer(
                referrer,
                'post',
                referrer.trigger_hook_open_oselia_db_reject_url,
                ['User not valid (archived, blocked or invalidated):' + user.id],
                referrer.triggers_hook_external_api_authentication_id
            );

            return;
        }

        // ML: Pas sûr de quoi faire ici
        // if (!user_referrer.user_validated) {
        //     // L'utilisateur est lié, tout est ok, mais il n'a pas encore validé la liaison. On l'envoie sur une page de validation

        //     /**
        //      * TODO FIXME vérifier niveau sécu ce qu'on peut faire ou pas à ce niveau... un peu perplexe, mais pour le moment on va login auto
        //      */
        //     if (ModuleAccessPolicyServer.getLoggedUserId() != user.id) {
        //         await ModuleAccessPolicyServer.getInstance().login(user.id);
        //     }

        //     return;
        // }

        /**
         * On récupère le thread : on le crée si on reçoit null, et dans tous les cas on crée et on récupère le thread depuis OpenAI si on ne le connait pas encore
         * Si un assistant est passé en param, on le force dans le thread
         */
        let openai_assistant_id = null;
        const openai_thread_id = null;
        if ((!openai_assistant_id) && referrer.default_assistant_id) {
            const default_assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(referrer.default_assistant_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            openai_assistant_id = default_assistant ? default_assistant.gpt_assistant_id : null;
        }

        const assistant_vo: GPTAssistantAPIAssistantVO =
            openai_assistant_id ? await GPTAssistantAPIServerSyncAssistantsController.get_assistant_or_sync(openai_assistant_id) : null;

        const thread: { thread_gpt: Thread; thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread(
            user.id,
            null,
            assistant_vo ? assistant_vo.id : null,
        );

        /**
         * Si le referrer n'est pas lié au thread, on le lie
         * Si un referrer est déjà lié, et que ce n'est pas celui-ci, on renvoie une erreur
         */
        const current_referrer: OseliaReferrerVO =
            await query(OseliaReferrerVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaThreadReferrerVO>().thread_id, thread.thread_vo.id, OseliaThreadReferrerVO.API_TYPE_ID)
                .set_sort(new SortByVO(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().id, false))
                .exec_as_server()
                .set_limit(1)
                .select_vo<OseliaReferrerVO>();

        if (current_referrer && (current_referrer.id != referrer.id)) {
            ConsoleHandler.error('Thread already linked to another referrer:' + referrer.id + ':' + current_referrer.id);

            await this.send_hook_trigger_datas_to_referrer(
                referrer,
                'post',
                referrer.trigger_hook_open_oselia_db_reject_url,
                ['Thread already linked to another referrer:openai_thread_id:' + openai_thread_id],
                referrer.triggers_hook_external_api_authentication_id
            );

            return;
        }

        if (!current_referrer) {

            const thread_referrer: OseliaThreadReferrerVO = new OseliaThreadReferrerVO();
            thread_referrer.thread_id = thread.thread_vo.id;
            thread_referrer.referrer_id = referrer.id;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_referrer);
        }

        /**
         * TODO FIXME vérifier niveau sécu ce qu'on peut faire ou pas à ce niveau... un peu perplexe, mais pour le moment on va login auto
         */
        if (ModuleAccessPolicyServer.getLoggedUserId() != user.id) {
            await ModuleAccessPolicyServer.getInstance().login(user.id);
        }

        return thread.thread_vo.id;
    }

    private async open_oselia_db(
        referrer_user_ott: string,
        openai_thread_id: string,
        openai_assistant_id: string,
        req: Request,
        call_id:number,
    ): Promise<void> {

        /**
         * On checke le OTT
         */
        const user_referrer_ott = await query(OseliaUserReferrerOTTVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaUserReferrerOTTVO>().ott, referrer_user_ott)
            .exec_as_server()
            .select_vo<OseliaUserReferrerOTTVO>();

        if (!user_referrer_ott) {
            ConsoleHandler.error('OTT not found:' + referrer_user_ott);
            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, '/f/oselia_referrer_not_found');
            return;
        }

        const user_referrer: OseliaUserReferrerVO = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_id(user_referrer_ott.user_referrer_id)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();
        if (!user_referrer) {
            ConsoleHandler.error('Referrer not found:user_referrer_id:' + user_referrer_ott.user_referrer_id);
            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, '/f/oselia_referrer_not_found');
            return;
        }

        /**
         * On commence par checker le referrer
         * Puis le user lié au referrer, et le fait que la liaison soit validée, sinon on renvoie vers la demande de confirmation du lien
         */
        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_id(user_referrer.referrer_id)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            ConsoleHandler.error('Referrer not found:referrer_id:' + user_referrer.referrer_id);
            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, '/f/oselia_referrer_not_found');
            return;
        }

        const user = await query(UserVO.API_TYPE_ID)
            .filter_by_id(user_referrer.user_id)
            .exec_as_server()
            .select_vo<UserVO>();
        if ((!user) || user.archived || user.blocked || user.invalidated) {
            ConsoleHandler.error('User not valid:referrer_user_uid:' + user_referrer.referrer_user_uid + ':uid:' + user_referrer.user_id);

            await this.send_hook_trigger_datas_to_referrer(
                referrer,
                'post',
                referrer.trigger_hook_open_oselia_db_reject_url,
                ['User not valid (archived, blocked or invalidated):' + user_referrer.referrer_user_uid],
                referrer.triggers_hook_external_api_authentication_id
            );
            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, referrer.failed_open_oselia_db_target_url);
            return;
        }

        if (!user_referrer.user_validated) {
            // L'utilisateur est lié, tout est ok, mais il n'a pas encore validé la liaison. On l'envoie sur une page de validation

            /**
             * TODO FIXME vérifier niveau sécu ce qu'on peut faire ou pas à ce niveau... un peu perplexe, mais pour le moment on va login auto
             */
            if (ModuleAccessPolicyServer.getLoggedUserId() != user.id) {
                await ModuleAccessPolicyServer.getInstance().login(user.id);
            }

            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, '/f/oselia_referrer_activation/' + referrer_user_ott + '/' + openai_thread_id + '/' + openai_assistant_id); //TODO FIXME créer la page dédiée
            return;
        }

        /**
         * On récupère le thread : on le crée si on reçoit null, et dans tous les cas on crée et on récupère le thread depuis OpenAI si on ne le connait pas encore
         * Si un assistant est passé en param, on le force dans le thread
         */
        openai_assistant_id = (openai_assistant_id == '_') ? null : openai_assistant_id;
        openai_thread_id = (openai_thread_id == '_') ? null : openai_thread_id;
        if ((!openai_assistant_id) && referrer.default_assistant_id) {
            const default_assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(referrer.default_assistant_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            openai_assistant_id = default_assistant ? default_assistant.gpt_assistant_id : null;
        }


        const assistant_vo: GPTAssistantAPIAssistantVO =
            openai_assistant_id ? await GPTAssistantAPIServerSyncAssistantsController.get_assistant_or_sync(openai_assistant_id) : null;

        if (openai_thread_id) {
            const thread: { thread_gpt: Thread; thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread(
                user.id,
                openai_thread_id,
                assistant_vo ? assistant_vo.id : null,
            );

            /**
             * Si le referrer n'est pas lié au thread, on le lie
             * Si un referrer est déjà lié, et que ce n'est pas celui-ci, on renvoie une erreur
             */
            const current_referrer: OseliaReferrerVO =
                await query(OseliaReferrerVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaThreadReferrerVO>().thread_id, thread.thread_vo.id, OseliaThreadReferrerVO.API_TYPE_ID)
                    .set_sort(new SortByVO(OseliaThreadReferrerVO.API_TYPE_ID, field_names<OseliaThreadReferrerVO>().id, false))
                    .exec_as_server()
                    .set_limit(1)
                    .select_vo<OseliaReferrerVO>();

            if (current_referrer && (current_referrer.id != referrer.id)) {
                ConsoleHandler.error('Thread already linked to another referrer:' + referrer.id + ':' + current_referrer.id);

                await this.send_hook_trigger_datas_to_referrer(
                    referrer,
                    'post',
                    referrer.trigger_hook_open_oselia_db_reject_url,
                    ['Thread already linked to another referrer:openai_thread_id:' + openai_thread_id],
                    referrer.triggers_hook_external_api_authentication_id
                );

                await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, referrer.failed_open_oselia_db_target_url);
                return;
            }

            if (!current_referrer) {

                const thread_referrer: OseliaThreadReferrerVO = new OseliaThreadReferrerVO();
                thread_referrer.thread_id = thread.thread_vo.id;
                thread_referrer.referrer_id = referrer.id;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_referrer);
            }

            /**
             * TODO FIXME vérifier niveau sécu ce qu'on peut faire ou pas à ce niveau... un peu perplexe, mais pour le moment on va login auto
             */
            if (ModuleAccessPolicyServer.getLoggedUserId() != user.id) {
                await ModuleAccessPolicyServer.getInstance().login(user.id);
            }

            ModuleDAOServer.getInstance().deleteVOs_as_server([user_referrer_ott]);

            /**
             * Enfin, on redirige vers la page de discussion avec le paramètre qui va bien pour init le thread
             */
            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, '/f/oselia/' + thread.thread_vo.id);
        } else {
            await ServerAPIController.send_redirect_if_headers_not_already_sent(call_id, '/f/oselia/' + '_' + '/');
        }
    }

    private async send_hook_trigger_datas_to_referrer(
        referrer: OseliaReferrerVO,
        method: "get" | "post" | "put" | "delete",
        url: string,
        datas: any,
        external_api_authentication_id: number,
    ) {

        if ((!referrer) || (!url) || (!method) || (!external_api_authentication_id)) {
            return;
        }

        if (!referrer.activate_trigger_hooks) {
            return;
        }

        await ExternalAPIServerController.call_external_api(
            method,
            url,
            datas,
            external_api_authentication_id
        );
    }

    /**
     * Request to connect a user to a referrer
     * And return a single use token to open Osélia from the referrer
     * @param referrer_code referrer code
     * @param user_email user email
     * @param referrer_user_uid referrer user uid
     * @returns one time token to open Osélia if everything is fine, null otherwise
     */
    private async link_user_to_oselia_referrer(
        referrer_code: string,
        user_email: string,
        referrer_user_uid: string,
    ): Promise<string> {

        try {

            /**
             * On checke le referrer
             * puis l'email : Si on n'a pas le compte, on le crée et on envoie un mail d'init du mot de passe, sinon on crée le lien et on envoie un mail et une notif informant de la demande de connexion
             */
            const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_code, referrer_code)
                .exec_as_server()
                .select_vo<OseliaReferrerVO>();

            if (!referrer) {
                ConsoleHandler.error('Referrer not found:' + referrer_code);
                return null;
            }

            return await this.link_user_to_oselia_referrer_obj(referrer, user_email, referrer_user_uid);

        } catch (error) {
            ConsoleHandler.error('Error while requesting connection:' + error);
        }
        return null;
    }

    /**
     * Request to connect a user to a referrer
     * And return a single use token to open Osélia from the referrer
     * @param referrer Le partenaire qui demande la connexion
     * @param user_email user email
     * @param referrer_user_uid referrer user uid
     * @returns one time token to open Osélia if everything is fine, null otherwise
     */
    private async link_user_to_oselia_referrer_obj(
        referrer: OseliaReferrerVO,
        user_email: string,
        referrer_user_uid: string,
    ): Promise<string> {

        if (!referrer) {
            ConsoleHandler.error('link_user_to_oselia_referrer_obj: No Referrer');
            return null;
        }

        // On sépare 2 fonctionnements : 1 cas où Osélia est utilisé en interne dans le site même qui contient les comptes utilisateurs.
        //  Dans ce cas on ne doit pas en créer, et la liaison doit se faire avec les comptes existants automatiquement.
        // 2ème cas, Osélia est utilisé en externe, et on doit créer les comptes utilisateurs si ils n'existent pas encore, mais on attend la validation pour lier le compte au partenaire
        const is_internal_behaviour = ((referrer.referrer_origin == ConfigurationService.node_configuration.base_url) || ((referrer.referrer_origin + '/') == ConfigurationService.node_configuration.base_url));

        try {

            // Check if the user exists
            let user = await query(UserVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<UserVO>().email, user_email, UserVO.API_TYPE_ID, true)
                .exec_as_server()
                .select_vo<UserVO>();

            if (is_internal_behaviour && !user) {
                ConsoleHandler.error('link_user_to_oselia_referrer_obj:User not found bu internal behaviour:' + user_email);
                return null;
            }

            if (!user) {

                const login = user_email;
                const test_existing_login = await query(UserVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<UserVO>().name, login)
                    .exec_as_server()
                    .select_vo<UserVO>();

                if (test_existing_login) {
                    ConsoleHandler.error('User already exists with login:' + login);
                    return null;
                }

                user = new UserVO();
                user.invalidated = false;
                user.name = login;
                user.email = user_email;
                user.lang_id = referrer.new_user_default_lang_id;

                try {
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(user);
                } catch (error) {
                    ConsoleHandler.error('Error while creating user:' + error);
                    return null;
                }

                await PasswordInitialisation.getInstance().begininitpwd_user(user);
            }

            // Check if the link already exists
            let link = await query(OseliaUserReferrerVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaUserReferrerVO>().user_id, user.id)
                .filter_by_num_eq(field_names<OseliaUserReferrerVO>().referrer_id, referrer.id)
                .filter_by_text_eq(field_names<OseliaUserReferrerVO>().referrer_user_uid, referrer_user_uid)
                .exec_as_server()
                .select_vo<OseliaUserReferrerVO>();

            if (!link) {
                link = new OseliaUserReferrerVO();
                link.actif = true;
                link.referrer_id = referrer.id;
                link.user_id = user.id;
                link.user_validated = is_internal_behaviour;
                link.referrer_user_uid = referrer_user_uid;

                try {
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(link);
                } catch (error) {
                    ConsoleHandler.error('Error while creating link:' + error);
                    return null;
                }
            }

            if ((!link.user_validated) && is_internal_behaviour) {
                link.user_validated = true;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(link);
            }

            const new_ott = new OseliaUserReferrerOTTVO();

            new_ott.user_referrer_id = link.id;
            new_ott.ott = await OseliaUserReferrerOTTVO.generateSecretToken(32);
            new_ott.expires = Date.now() + (1000 * 60 * 60 * 24); // 1 hour

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_ott);

            return new_ott.ott;

        } catch (error) {
            ConsoleHandler.error('Error while requesting connection:' + error);
        }
        return null;
    }

    private async get_referrer_name(referrer_user_ott: string): Promise<string> {
        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaUserReferrerOTTVO>().ott, referrer_user_ott, OseliaUserReferrerOTTVO.API_TYPE_ID)
            .using(OseliaUserReferrerVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        return referrer ? referrer.name : null;
    }

    private async accept_link(referrer_user_ott: string): Promise<void> {

        const uid = await ModuleAccessPolicyServer.getLoggedUserId();
        if (!uid) {
            ConsoleHandler.error('No user logged');
            return;
        }

        const user_referrer = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaUserReferrerOTTVO>().ott, referrer_user_ott, OseliaUserReferrerOTTVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();

        if (!user_referrer) {
            ConsoleHandler.error('User referrer not found:OTT:' + referrer_user_ott + ':' + uid);
            return;
        }

        if (user_referrer.user_validated) {
            ConsoleHandler.warn('User referrer already validated:OTT:' + referrer_user_ott + ':' + uid);
            return;
        }

        user_referrer.user_validated = true;

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(user_referrer);
    }

    private async refuse_link(referrer_user_ott: string): Promise<void> {

        const uid = await ModuleAccessPolicyServer.getLoggedUserId();
        if (!uid) {
            ConsoleHandler.error('No user logged');
            return;
        }

        const user_referrer = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaUserReferrerOTTVO>().ott, referrer_user_ott, OseliaUserReferrerOTTVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();

        if (!user_referrer) {
            ConsoleHandler.error('User referrer not found:OTT:' + referrer_user_ott + ':' + uid);
            return;
        }

        if (user_referrer.user_validated) {
            ConsoleHandler.warn('User referrer already validated:OTT:' + referrer_user_ott + ':' + uid + ' - deleting beacause of refusal');
        }

        await ModuleDAOServer.instance.deleteVOs_as_server([user_referrer]);
    }

    private async account_waiting_link_status(referrer_user_ott: string): Promise<'validated' | 'waiting' | 'none'> {
        const uid = await ModuleAccessPolicyServer.getLoggedUserId();
        if (!uid) {
            ConsoleHandler.error('No user logged');
            return 'none';
        }

        const user_referrer = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaUserReferrerOTTVO>().ott, referrer_user_ott, OseliaUserReferrerOTTVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();

        if (!user_referrer) {
            return 'none';
        }

        return (!user_referrer.user_validated) ? 'waiting' : 'validated';
    }

    private async send_join_request(asking_user_id: number, target_thread_id: number) {
        ConsoleHandler.log('ModuleOseliaServer:send_join_request:Sending join request:asking_user_id:' + asking_user_id + ':target_thread_id:' + target_thread_id);
        try {
            const target_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(target_thread_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadVO>();

            if (target_thread.user_id == asking_user_id) {
                ConsoleHandler.log('ModuleOseliaServer:send_join_request:Asking user is the owner of the thread');
                return;
            }

            const asking_user = await query(UserVO.API_TYPE_ID)
                .filter_by_id(asking_user_id)
                .exec_as_server()
                .select_vo<UserVO>();
            const asking_user_role: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).filter_by_num_eq(field_names<UserRoleVO>().user_id, asking_user.id).exec_as_server().select_vos<UserRoleVO>();

            const owner_user = await query(UserVO.API_TYPE_ID)
                .filter_by_id(target_thread.user_id)
                .exec_as_server()
                .select_vo<UserVO>();

            const target_thread_assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(target_thread.current_default_assistant_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIAssistantVO>();

            if (await ModuleVersionedServer.getInstance().get_robot_user_id() == owner_user.id && !(asking_user_role.find((role) => role.role_id == AccessPolicyServerController.role_admin.id))) {
                ConsoleHandler.log('ModuleOseliaServer:send_join_request:Owner of the thread is a robot');
                return;
            }
            const socket_wrappers: SocketWrapper[] = PushDataServerController.getUserSockets(parseInt(owner_user.id.toString()));
            for (const socket_wrapper of socket_wrappers) {
                for (const room of socket_wrapper.socket.rooms) {
                    try {
                        JSON.parse(room);
                    } catch (error) {
                        continue;
                    }
                    if (JSON.parse(room)._type == 'gpt_assistant_thread' && JSON.parse(room).id == target_thread.id) {
                        ConsoleHandler.log('ModuleOseliaServer:send_join_request:Owner of the thread is on the thread');

                        const new_thread_message = new GPTAssistantAPIThreadMessageVO();
                        new_thread_message.thread_id = target_thread.id;
                        new_thread_message.date = Dates.now();
                        new_thread_message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT;
                        new_thread_message.assistant_id = target_thread.current_default_assistant_id;
                        new_thread_message.user_id = owner_user.id;
                        new_thread_message.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_thread_message)).id;

                        const text_content = new GPTAssistantAPIThreadMessageContentVO();
                        text_content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
                        text_content.content_type_text.value = asking_user.name + " souhaite rejoindre la conversation";
                        text_content.thread_message_id = new_thread_message.id;
                        text_content.gpt_thread_message_id = new_thread_message.gpt_id;
                        text_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(text_content);

                        const accept_action = new ActionURLVO();

                        accept_action.action_name = 'Accepter';
                        accept_action.action_code = ActionURLServerTools.get_unique_code_from_text(accept_action.action_name);
                        accept_action.action_remaining_counter = 1; // infini
                        accept_action.valid_ts_range = RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.now(), Dates.add(Dates.now(), 60, TimeSegment.TYPE_DAY), true, true, TimeSegment.TYPE_DAY);

                        accept_action.action_callback_function_name = reflect<ModuleOseliaServer>().accept_join_request;
                        accept_action.action_callback_module_name = ModuleOseliaServer.getInstance().name;
                        accept_action.params = { asking_user_id: asking_user.id, target_thread_id: target_thread.id, thread_message_id: new_thread_message.id };
                        accept_action.button_bootstrap_type = ActionURLVO.BOOTSTRAP_BUTTON_TYPE_SUCCESS;
                        accept_action.button_translatable_name = 'oselia.join_request.accept';
                        accept_action.button_translatable_name_params_json = null;
                        accept_action.button_fc_icon_classnames = ['fa-duotone', 'fa-badge-check'];
                        accept_action.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(accept_action)).id;
                        const accept_action_owner = new ActionURLUserVO();
                        accept_action_owner.user_id = owner_user.id;
                        accept_action_owner.action_id = accept_action.id;
                        accept_action_owner.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(accept_action_owner)).id;

                        const accept_action_user = new ActionURLUserVO();
                        accept_action_user.user_id = asking_user_id;
                        accept_action_user.action_id = accept_action.id;
                        accept_action_user.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(accept_action_user)).id;


                        const accept_button = new GPTAssistantAPIThreadMessageContentVO();
                        accept_button.content_type_action_url_id = accept_action.id;
                        accept_button.thread_message_id = new_thread_message.id;
                        accept_button.type = GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL;
                        accept_button.gpt_thread_message_id = new_thread_message.gpt_id;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(accept_button);

                        const deny_action = new ActionURLVO();

                        deny_action.action_name = 'Refuser';
                        deny_action.action_code = ActionURLServerTools.get_unique_code_from_text(deny_action.action_name);
                        deny_action.action_remaining_counter = 1; // infini
                        deny_action.valid_ts_range = RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.now(), Dates.add(Dates.now(), 60, TimeSegment.TYPE_DAY), true, true, TimeSegment.TYPE_DAY);

                        deny_action.action_callback_function_name = reflect<ModuleOseliaServer>().refuse_join_request;
                        deny_action.action_callback_module_name = ModuleOseliaServer.getInstance().name;
                        deny_action.params = { asking_user_id: asking_user.id, thread_message_id: new_thread_message.id };

                        deny_action.button_bootstrap_type = ActionURLVO.BOOTSTRAP_BUTTON_TYPE_DANGER;
                        deny_action.button_translatable_name = 'oselia.join_request.deny';
                        deny_action.button_fc_icon_classnames = ['fa-duotone', 'fa-ban'];
                        deny_action.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(deny_action)).id;

                        const deny_action_owner = new ActionURLUserVO();
                        deny_action_owner.user_id = owner_user.id;
                        deny_action_owner.action_id = deny_action.id;
                        deny_action_owner.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(deny_action_owner)).id;

                        const deny_action_user = new ActionURLUserVO();
                        deny_action_user.user_id = asking_user_id;
                        deny_action_user.action_id = deny_action.id;
                        deny_action_user.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(deny_action_user)).id;

                        const deny_button = new GPTAssistantAPIThreadMessageContentVO();
                        deny_button.content_type_action_url_id = deny_action.id;
                        deny_button.thread_message_id = new_thread_message.id;
                        deny_button.type = GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL;
                        deny_button.gpt_thread_message_id = new_thread_message.gpt_id;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(deny_button);

                        await PushDataServerController.notifySimpleINFO(
                            asking_user_id,
                            StackContext.get('CLIENT_TAB_ID'),
                            'oselia.join_request.notify.sent.___LABEL___'
                        );
                        ConsoleHandler.log('ModuleOseliaServer:send_join_request:Sent join request to the owner of the thread');
                        return;
                    }
                }
            }
            ConsoleHandler.log('ModuleOseliaServer:send_join_request:Owner of the thread isn\'t on the thread');
            // Il n'est pas sur le thread, il faut le contacter autrement
            return;
        } catch (error) {
            ConsoleHandler.error('ModuleOseliaServer:send_join_request:Error while sending join request:' + error);
        }
    }

    private async clear_referrers_triggers() {

        const referers_triggers_hooks_cache = ModuleOseliaServer.referers_triggers_hooks_condition_UID_cache;
        ModuleOseliaServer.referers_triggers_hooks_condition_UID_cache = null;

        for (const trigger_type_UID in referers_triggers_hooks_cache) {
            const conditions = referers_triggers_hooks_cache[trigger_type_UID];

            for (const condition_UID in conditions) {
                const handlers = conditions[condition_UID];
                const trigger_hook = ModuleTriggerServer.getInstance().getTriggerHook(trigger_type_UID);

                for (const i in handlers) {
                    const handler = handlers[i];

                    trigger_hook.unregisterHandlerOnThisThread(condition_UID, handler);
                }
            }
        }
    }

    private async clear_reapply_referrers_triggers_OnAllThreads() {
        await ForkedTasksController.broadexec_with_valid_promise_for_await(ModuleOseliaServer.TASK_NAME_clear_reapply_referrers_triggers_OnThisThread);
    }

    /**
     * Ne pas appeler directement, utiliser la méthode clear_reapply_referrers_triggers_OnAllThreads
     */
    private async clear_reapply_referrers_triggers_OnThisThread() {
        this.clear_referrers_triggers();
        this.reapply_referrers_triggers();
    }

    private async reapply_referrers_triggers() {
        const referrers = await query(OseliaReferrerVO.API_TYPE_ID).exec_as_server().select_vos<OseliaReferrerVO>();

        for (const i in referrers) {
            const referrer = referrers[i];

            if (!referrer.activate_trigger_hooks) {
                continue;
            }

            this.reapply_referrer_triggers(referrer);
        }
    }

    private reapply_referrer_triggers(referrer: OseliaReferrerVO) {

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        if (referrer.trigger_hook_gpt_assistant_run_create_url) {
            postCreateTrigger.registerHandler(
                GPTAssistantAPIRunVO.API_TYPE_ID,
                this,
                this.send_post_create_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIRunVO>(referrer, referrer.trigger_hook_gpt_assistant_run_create_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_run_update_url) {
            postUpdateTrigger.registerHandler(
                GPTAssistantAPIRunVO.API_TYPE_ID,
                this,
                this.send_post_update_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIRunVO>(referrer, referrer.trigger_hook_gpt_assistant_run_update_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_run_delete_url) {
            postDeleteTrigger.registerHandler(
                GPTAssistantAPIRunVO.API_TYPE_ID,
                this,
                this.send_post_delete_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIRunVO>(referrer, referrer.trigger_hook_gpt_assistant_run_delete_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_msg_content_create_url) {
            postCreateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_create_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_msg_content_create_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_msg_content_update_url) {
            postUpdateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_update_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_msg_content_update_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_msg_content_delete_url) {
            postDeleteTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_delete_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_msg_content_delete_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_message_file_create_url) {
            postCreateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_create_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_message_file_create_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_message_file_update_url) {
            postUpdateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_update_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_message_file_update_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_message_file_delete_url) {
            postDeleteTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_delete_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_message_file_delete_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_msg_create_url) {
            postCreateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_create_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_msg_create_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_msg_update_url) {
            postUpdateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_update_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_msg_update_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_msg_delete_url) {
            postDeleteTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_delete_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_msg_delete_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_create_url) {
            postCreateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_create_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_create_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_update_url) {
            postUpdateTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_update_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_update_url),
            );
        }

        if (referrer.trigger_hook_gpt_assistant_thread_delete_url) {
            postDeleteTrigger.registerHandler(
                GPTAssistantAPIThreadVO.API_TYPE_ID,
                this,
                this.send_post_delete_hook_trigger_datas_to_referrer_wrapper<GPTAssistantAPIThreadVO>(referrer, referrer.trigger_hook_gpt_assistant_thread_delete_url),
            );
        }
    }

    private send_post_create_hook_trigger_datas_to_referrer_wrapper<T extends IDistantVOBase>(
        referrer: OseliaReferrerVO,
        url: string
    ) {

        return async (created_vo: T) => {
            await this.send_hook_trigger_datas_to_referrer(
                referrer,
                'post',
                url,
                created_vo,
                referrer.triggers_hook_external_api_authentication_id
            );
        };
    }

    private send_post_update_hook_trigger_datas_to_referrer_wrapper<T extends IDistantVOBase>(
        referrer: OseliaReferrerVO,
        url: string
    ) {

        return async (updated_vo: DAOUpdateVOHolder<T>) => {
            await this.send_hook_trigger_datas_to_referrer(
                referrer,
                'post',
                url,
                updated_vo,
                referrer.triggers_hook_external_api_authentication_id
            );
        };
    }

    private send_post_delete_hook_trigger_datas_to_referrer_wrapper<T extends IDistantVOBase>(
        referrer: OseliaReferrerVO,
        url: string
    ) {

        return async (deleted_vo: T) => {
            await this.send_hook_trigger_datas_to_referrer(
                referrer,
                'post',
                url,
                deleted_vo,
                referrer.triggers_hook_external_api_authentication_id
            );
        };
    }

    private async update_authorized_oselia_partners_onc(referrer: OseliaReferrerVO) {
        if (!referrer.referrer_origin) {
            return;
        }

        OseliaServerController.authorized_oselia_partners.push(referrer.referrer_origin);
    }

    private async update_authorized_oselia_partners_ond(referrer: OseliaReferrerVO) {
        if (!referrer.referrer_origin) {
            return;
        }

        const index = OseliaServerController.authorized_oselia_partners.indexOf(referrer.referrer_origin);
        if (index > -1) {
            OseliaServerController.authorized_oselia_partners.splice(index, 1);
        }
    }

    private async update_authorized_oselia_partners_onu(update: DAOUpdateVOHolder<OseliaReferrerVO>) {

        if (!!update.pre_update_vo.referrer_origin) {
            const index = OseliaServerController.authorized_oselia_partners.indexOf(update.pre_update_vo.referrer_origin);
            if (index > -1) {
                OseliaServerController.authorized_oselia_partners.splice(index, 1);
            }
        }

        if (!update.post_update_vo.referrer_origin) {
            return;
        }
        OseliaServerController.authorized_oselia_partners.push(update.post_update_vo.referrer_origin);
    }

    /**
     * Méthode qui télécharge l'image chez OpenAI et la sauvegarde en local et crée le fileVO et le renvoie
     * @param openai_image_url
     * @param local_path
     * @returns
     */
    private async download_image_form_openai_url(
        openai_image_url: string,
        local_path: string,
        is_secured: boolean = false, // On doit garder l'image publique si l'on veut pouvoir la partager et l'utiliser pour upload sur Wordpress par exemple
        secured_access_name: string = null, // TODO FIXME sécuriser les images, en forçant des api de récupération de l'image et autorisation dans des cas spécifiques
    ): Promise<FileVO> {
        return new Promise((resolve, reject) => {

            try {

                axios({
                    url: openai_image_url,
                    responseType: 'stream',
                }).then(async (axios_response) => {

                    await FileServerController.getInstance().makeSureThisFolderExists(local_path.substring(0, local_path.lastIndexOf('/')));
                    axios_response.data.pipe(createWriteStream(local_path))
                        .on('finish', async () => {
                            if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                                ConsoleHandler.log('ModuleOseliaServer:generate_image:Image downloaded and saved successfully.');
                            }

                            const file_vo = new FileVO();
                            file_vo.file_access_policy_name = secured_access_name;
                            file_vo.is_secured = is_secured;
                            file_vo.path = local_path;
                            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(file_vo);

                            // On push l'image à GPT

                            resolve(file_vo);
                        })
                        .on('error', (err) => {
                            ConsoleHandler.error('ModuleOseliaServer:generate_image:Error while saving the image:' + err);
                            reject(err);
                        });
                }).catch(err => {
                    ConsoleHandler.error('ModuleOseliaServer:generate_image:Erreur lors du téléchargement de l\'image :' + err);
                    reject(err);
                });
            } catch (error) {
                ConsoleHandler.error('ModuleOseliaServer:generate_image:Erreur lors du téléchargement de l\'image:' + error);
                reject(error);
            }
        });
    }

    private async init_api_key_from_mdp_preu(vos: DAOUpdateVOHolder<ExternalAPIAuthentificationVO>): Promise<boolean> {
        return this.init_api_key_from_mdp(vos.post_update_vo);
    }
    private async init_api_key_from_mdp(vo: ExternalAPIAuthentificationVO): Promise<boolean> {
        if (vo.basic_login && vo.basic_password && !vo.api_key) {
            switch (vo.type) {
                case ExternalAPIAuthentificationVO.TYPE_API_KEY_BASIC:
                    vo.api_key = 'Basic ' + Buffer.from(vo.basic_login + ':' + vo.basic_password).toString('base64');
                    break;
                case ExternalAPIAuthentificationVO.TYPE_API_KEY_BEARER:
                    vo.api_key = 'Bearer ' + Buffer.from(vo.basic_login + ':' + vo.basic_password).toString('base64');
                    break;
            }
        }
        return true;
    }

    private async get_token_oselia(url: string): Promise<string> {
        const referrer_id = await OseliaController.get_referrer_id(url);

        if (!referrer_id) {
            return null;
        }

        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_id(referrer_id)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            return null;
        }

        const user = await ModuleAccessPolicyServer.getSelfUser();

        if (!user) {
            return null;
        }

        return this.link_user_to_oselia_referrer_obj(
            referrer,
            user.email,
            user.id.toString()
        );
    }

    /**
     * Puisqu'on on ajoute un contenu à la discussion, elle n'est plus vide
     * @param thread_message_content
     */
    private async set_has_content_on_thread_and_update_thread_title(thread_message_content: GPTAssistantAPIThreadMessageContentVO) {
        const thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(thread_message_content.thread_message_id, GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .set_discarded_field_path(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().piped_from_thread_message_id)
            .exec_as_server().select_vo<GPTAssistantAPIThreadVO>();

        let needs_update = false;

        if (thread && !thread.has_content) {
            thread.has_content = true;
            needs_update = true;
        }

        if (!thread.thread_title_auto_build_locked) {
            const thread_messages: GPTAssistantAPIThreadMessageVO[] = await query(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
                .filter_by_id(thread.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<GPTAssistantAPIThreadMessageVO>();

            // Si on a au moins 2 messages, on peut construire le titre
            if (thread_messages.length >= 2) {
                thread.needs_thread_title_build = true;
                needs_update = true;
            }
        }

        if (needs_update) {
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread);
        }
    }

    private async set_thread_oswedev_creation_date(thread: GPTAssistantAPIThreadVO): Promise<boolean> {
        thread.oswedev_created_at = Dates.now();

        if (!thread.thread_title) {
            thread.thread_title = Dates.format_segment(thread.oswedev_created_at, TimeSegment.TYPE_SECOND, false) + ' UTC';
        }
        return true;
    }

    // private async init_missing_thread_titles() {
    //     const threads = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
    //         .filter_is_true(field_names<GPTAssistantAPIThreadVO>().needs_thread_title_build)
    //         .filter_is_false(field_names<GPTAssistantAPIThreadVO>().thread_title_auto_build_locked)
    //         .exec_as_server()
    //         .select_vos<GPTAssistantAPIThreadVO>();

    //     const promise_pipeline = new PromisePipeline(10, 'Patch20240906InitThreadTitles');
    //     for (const i in threads) {
    //         await promise_pipeline.push(async () => {
    //             await ModuleOseliaServer.getInstance().build_thread_title(threads[i]);
    //         });
    //     }
    //     await promise_pipeline.end();
    // }

    private async reset_has_no_run_ready_to_handle_on_thread(run: OseliaRunVO) {
        if ((!run) || (!run.thread_id)) {
            return;
        }

        const thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(run.thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread) {
            return;
        }

        thread.has_no_run_ready_to_handle = false;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread);
    }

    private async reset_has_no_run_ready_to_handle_on_thread_on_u(vo_holder: DAOUpdateVOHolder<OseliaRunVO>) {
        await this.reset_has_no_run_ready_to_handle_on_thread(vo_holder.post_update_vo);
    }

    private async update_oselia_run_step_on_u_gpt_run(vo_holder: DAOUpdateVOHolder<GPTAssistantAPIRunVO>) {
        const gpt_run: GPTAssistantAPIRunVO = vo_holder.post_update_vo;

        if (!gpt_run) {
            return;
        }

        // On update uniquement si le gpt_run est terminé
        if (
            (gpt_run.status != GPTAssistantAPIRunVO.STATUS_COMPLETED) &&
            (gpt_run.status != GPTAssistantAPIRunVO.STATUS_CANCELLED) &&
            (gpt_run.status != GPTAssistantAPIRunVO.STATUS_CANCELLING) &&
            (gpt_run.status != GPTAssistantAPIRunVO.STATUS_EXPIRED) &&
            (gpt_run.status != GPTAssistantAPIRunVO.STATUS_FAILED)
        ) {
            return;
        }

        const run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);

        if (!run) {
            return;
        }

        // Si le run GPT est en erreur, on met le run Osélia en erreur
        switch (gpt_run.status) {
            case GPTAssistantAPIRunVO.STATUS_CANCELLED:
            case GPTAssistantAPIRunVO.STATUS_CANCELLING:
                if (gpt_run.last_error && gpt_run.last_error.message) {
                    run.error_msg = gpt_run.last_error.code + ':' + gpt_run.last_error.message;
                }
                await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_CANCELLED);
                return;
            case GPTAssistantAPIRunVO.STATUS_EXPIRED:
                if (gpt_run.last_error && gpt_run.last_error.message) {
                    run.error_msg = gpt_run.last_error.code + ':' + gpt_run.last_error.message;
                }
                await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_EXPIRED);
                return;
            case GPTAssistantAPIRunVO.STATUS_FAILED:
                if (gpt_run.last_error && gpt_run.last_error.message) {
                    run.error_msg = gpt_run.last_error.code + ':' + gpt_run.last_error.message;
                }
                await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                return;
        }

        let needs_update = true;
        let new_state = null;
        switch (run.state) {
            case OseliaRunVO.STATE_NEEDS_RERUN:
                // On doit relancer le run du coup suite à la fait du gpt_run
                // On crée un nouveau OseliaRun en weight +1 et on décale tous les runs (suivants) de ce niveau de 1
                const current_level_next_runs = await query(OseliaRunVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaRunVO>().parent_run_id, run.parent_run_id)
                    .filter_by_num_sup(field_names<OseliaRunVO>().weight, run.weight)
                    .exec_as_server()
                    .select_vos<OseliaRunVO>();
                for (const i in current_level_next_runs) {
                    current_level_next_runs[i].weight++;
                }
                await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(current_level_next_runs);

                new_state = OseliaRunVO.STATE_RERUN_ASKED;

                const rerun = new OseliaRunVO();
                rerun.assistant_id = run.assistant_id;
                rerun.oselia_thread_default_assistant_id = run.oselia_thread_default_assistant_id;

                rerun.for_each_array_cache_key = run.for_each_array_cache_key;
                rerun.for_each_element_cache_key = run.for_each_element_cache_key;
                rerun.for_each_element_run_template_id = run.for_each_element_run_template_id;
                rerun.for_each_index_cache_key = run.for_each_index_cache_key;
                rerun.run_type = run.run_type;

                rerun.childrens_are_multithreaded = run.childrens_are_multithreaded;
                rerun.file_id_ranges = run.file_id_ranges;
                rerun.hide_outputs = run.hide_outputs;
                rerun.hide_prompt = run.hide_prompt;
                rerun.initial_content_text = run.rerun_new_initial_prompt;
                rerun.initial_prompt_id = null;
                rerun.initial_prompt_parameters = null;
                rerun.name = run.rerun_name;
                rerun.parent_run_id = run.parent_run_id;
                rerun.weight = run.weight + 1;
                rerun.user_id = run.user_id;
                rerun.state = OseliaRunVO.STATE_TODO;
                rerun.start_date = Dates.now();
                rerun.thread_id = run.thread_id;
                rerun.rerun_of_run_id = run.id;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(rerun);
                break;
            case OseliaRunVO.STATE_SPLITTING:

                const children = await query(OseliaRunVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaRunVO>().parent_run_id, run.id)
                    .exec_as_server()
                    .select_vos<OseliaRunVO>();
                if ((!children) || (children.length == 0)) {
                    // Si on a pas d'enfants, il y a eu une erreur dans le gpt_run dédié au split, qui visiblement n'a pas fait son taf correctement
                    run.error_msg = 'No children runs created on a split run, but gpt_run is ended';
                    // FIXME TODO on pourrait ajouter des actions urls en fait au message pour proposer de reboot le split / run
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

                run.split_end_date = Dates.now();
                run.waiting_split_end_start_date = Dates.now();
                new_state = OseliaRunVO.STATE_WAITING_SPLITS_END; // on a pas vraiment besoin du STATE_SPLIT_ENDED, on passe en STATE_WAITING_SPLITS_END directement (et donc les 2 dates)
                break;
            case OseliaRunVO.STATE_RUNNING:
                new_state = OseliaRunVO.STATE_RUN_ENDED;
                run.run_end_date = Dates.now();

                /**
                 * Si le run a généré des splitts dont on attend l'exec, on doit passer en STATE_WAITING_SPLITS_END plutôt que en run_ended
                 */
                const children_post_run = await query(OseliaRunVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaRunVO>().parent_run_id, run.id)
                    .exec_as_server()
                    .select_vos<OseliaRunVO>();
                if ((!children_post_run) || (children_post_run.length == 0)) {
                    break;
                }

                let all_children_ended = true;
                for (const i in children_post_run) {
                    if (OseliaRunBGThread.END_STATES.indexOf(children_post_run[i].state) < 0) {
                        all_children_ended = false;
                        break;
                    }
                }

                if (!all_children_ended) {
                    new_state = OseliaRunVO.STATE_WAITING_SPLITS_END;
                    run.waiting_split_end_start_date = Dates.now();
                }

                break;
            case OseliaRunVO.STATE_VALIDATING:

                // Si on arrive ici, c'est que le gpt_run de validation s'est terminé SANS validation, donc a priori on a un souci à résoudre,
                //  et pour autant, il n'y a pas eu de relance automatique du prompt avec correctif

                // On tente de relancer le run avec un prompt de correction indiquant qu'il faut dans tous les cas valider ou refuser mais on peut pas rester comme ça
                ConsoleHandler.warn('update_oselia_run_step_on_u_gpt_run:Validation GPT Run ended without validation or rerun. This is unexpected:' + run.id + ': auto rerun');

                const assistant = await OseliaRunServerController.get_run_assistant(run);
                const thread = await OseliaRunServerController.get_run_thread(run, assistant);
                const files = await OseliaRunServerController.get_run_files(run);

                const validate_run_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
                    .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().validate_oselia_run)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIFunctionVO>();
                const refuse_run_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
                    .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().refuse_oselia_run)
                    .exec_as_server()
                    .select_vo<GPTAssistantAPIFunctionVO>();

                if ((!validate_run_function) || (!refuse_run_function)) {
                    throw new Error('validate_run:forgot to validate: No validate_run_function or refuse_run_function found');
                }

                const prompt_prefix_validator = await ParamsServerController.getParamValueAsString(
                    OseliaRunServerController.PARAM_NAME_REMEMBER_TO_VALIDATE_PROMPT_PREFIX,
                    'Il est obligatoire de valider ou refuser explicitement le run en appelant la fonction validate_run_function ou refuse_run_function.'
                );

                await GPTAssistantAPIServerController.ask_assistant(
                    assistant.gpt_assistant_id,
                    thread.gpt_thread_id,
                    run.thread_title,
                    prompt_prefix_validator,
                    files,
                    run.user_id,
                    true,
                    run,
                    run.state,
                    [validate_run_function, refuse_run_function],
                    run.referrer_id,
                );

                needs_update = false;
                // //  je sais pas exactement ce que ça veut dire pour le moment, on va en faire un échec, une erreur de validation, et on verra si ça prend du sens par la suite
                // run.error_msg = 'Validation GPT Run ended without validation or rerun. This is unexpected.';
                // await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                break;
            default:
                needs_update = false;
                // throw new Error('update_oselia_run_step_on_u_gpt_run:Unexpected run state:' + run.state + ':' + run.id);
                break;
        }

        if (needs_update) {
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run);
        }

        if (new_state != null) {
            await OseliaRunServerController.update_oselia_run_state(run, new_state);
        }
    }

    private async update_parent_oselia_run_step_on_u_oselia_run(vo_holder: DAOUpdateVOHolder<OseliaRunVO>) {
        const run_vo = vo_holder.post_update_vo;

        if (!run_vo) {
            return;
        }

        // Pas de parent, on ne fait rien
        if (!run_vo.parent_run_id) {
            return;
        }

        // Si on a pas terminé ce run, on ne fait rien
        if (OseliaRunBGThread.END_STATES.indexOf(run_vo.state) < 0) {
            return;
        }

        const parent_run = await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_id(run_vo.parent_run_id)
            .exec_as_server()
            .select_vo<OseliaRunVO>();

        if (!parent_run) {
            return;
        }

        // Si tous les runs enfants sont terminés, on peut passer le parent en terminé
        const children_runs = await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<OseliaRunVO>().parent_run_id, parent_run.id)
            .exec_as_server()
            .select_vos<OseliaRunVO>();

        let all_children_ended = true;
        let has_child_error = false;
        for (const i in children_runs) {
            const child_state = children_runs[i].state;

            if (OseliaRunBGThread.END_STATES.indexOf(child_state) < 0) {
                all_children_ended = false;
                break;
            }

            if (OseliaRunBGThread.ERROR_END_STATES.indexOf(child_state) >= 0) {
                has_child_error = true;
            }
        }

        if (all_children_ended) {

            parent_run.waiting_split_end_end_date = Dates.now();

            if (has_child_error) {
                parent_run.error_msg = 'Some children runs ended with errors/expired/cancelled';
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(parent_run);
                OseliaRunServerController.update_oselia_run_state(parent_run, OseliaRunVO.STATE_ERROR);
            } else {
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(parent_run);
                OseliaRunServerController.update_oselia_run_state(parent_run, OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED);
            }
        }
    }

    private async replay_function_call(function_call_id: number) {

        if (!function_call_id) {
            return;
        }

        const function_call = await query(OseliaRunFunctionCallVO.API_TYPE_ID)
            .filter_by_id(function_call_id)
            .select_vo<OseliaRunFunctionCallVO>();

        if (!function_call) {
            ConsoleHandler.error('replay_function_call:No function_call found for function_call_id:' + function_call_id);
            return;
        }

        const oselia_run = function_call.oselia_run_id ? await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_id(function_call.oselia_run_id)
            .select_vo<OseliaRunVO>() : null;

        const thread_vo = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .filter_by_id(function_call.thread_id)
            .select_vo<GPTAssistantAPIThreadVO>();

        if (!thread_vo) {
            ConsoleHandler.error('replay_function_call:No thread_vo found for function_call_id:' + function_call_id);
            return;
        }

        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_id(function_call.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .using(OseliaThreadReferrerVO.API_TYPE_ID)
            .set_limit(1)
            .select_vo<OseliaReferrerVO>();

        // if (!referrer) {
        //     ConsoleHandler.error('replay_function_call:No referrer found for function_call_id:' + function_call_id);
        //     return;
        // }

        const function_vo = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_id(function_call.gpt_function_id)
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!function_vo) {
            ConsoleHandler.error('replay_function_call:No function_vo found for function_call_id:' + function_call_id);
            return;
        }

        const function_params: GPTAssistantAPIFunctionParamVO[] = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_id(function_call.gpt_function_id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .select_vos<GPTAssistantAPIFunctionParamVO>();

        const availableFunctionsParameters: { [function_id: number]: GPTAssistantAPIFunctionParamVO[] } = {};
        const availableFunctionsParametersByParamName: { [function_id: number]: { [param_name: string]: GPTAssistantAPIFunctionParamVO } } = {};
        const referrer_external_api_by_name: { [external_api_name: string]: OseliaReferrerExternalAPIVO } = {};

        for (const i in function_params) {
            const function_param = function_params[i];

            if (!availableFunctionsParameters[function_param.function_id]) {
                availableFunctionsParameters[function_param.function_id] = [];
            }

            availableFunctionsParameters[function_param.function_id].push(function_param);

            if (!availableFunctionsParametersByParamName[function_param.function_id]) {
                availableFunctionsParametersByParamName[function_param.function_id] = {};
            }

            availableFunctionsParametersByParamName[function_param.function_id][function_param.gpt_funcparam_name] = function_param;
        }

        const referrer_external_apis: OseliaReferrerExternalAPIVO[] = referrer ?
            await query(OseliaReferrerExternalAPIVO.API_TYPE_ID)
                .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<OseliaReferrerExternalAPIVO>()
            : [];

        for (const i in referrer_external_apis) {
            const referrer_external_api = referrer_external_apis[i];
            referrer_external_api_by_name[referrer_external_api.name] = referrer_external_api;
        }

        const oselia_run_function_call_vo = new OseliaRunFunctionCallVO();
        oselia_run_function_call_vo.replay_from_id = function_call.id;

        try {

            await GPTAssistantAPIServerController.do_function_call(
                oselia_run,
                null,
                thread_vo,
                referrer,
                function_vo,
                oselia_run_function_call_vo,
                function_vo.gpt_function_name,
                JSON.stringify(function_call.function_call_parameters_initial),
                availableFunctionsParameters,
                availableFunctionsParametersByParamName,
                referrer_external_api_by_name,
            );

        } catch (error) {
            ConsoleHandler.error('REPLAY function CALL: error: ' + error);

            oselia_run_function_call_vo.end_date = Dates.now();
            oselia_run_function_call_vo.state = OseliaRunFunctionCallVO.STATE_ERROR;
            oselia_run_function_call_vo.error_msg = error;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_function_call_vo);
        }
    }

    private async asap_oselia_run_bgthread() {
        await BGThreadServerController.force_run_asap_by_bgthread_name[OseliaRunBGThread.BGTHREAD_NAME]();
    }

    /**
     * Cette action utilisable pour les events/listeners permet d'instancier directement un oseliarun à partir d'un event
     */
    private async instantiate_oselia_run_from_event(event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO) {

        if (!event || !listener) {
            ConsoleHandler.error('instantiate_oselia_run_from_event:Missing event or listener');
            return;
        }

        if (!listener.oselia_run_template_name) {
            ConsoleHandler.error('instantiate_oselia_run_from_event:Missing listener.oselia_run_template_name');
            return;
        }

        const run_template: OseliaRunTemplateVO = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, listener.oselia_run_template_name)
            .exec_as_server()
            .select_vo<OseliaRunTemplateVO>();

        if (!run_template) {
            ConsoleHandler.error('instantiate_oselia_run_from_event:No run_template found for name:' + listener.oselia_run_template_name);
            return;
        }

        const run = await OseliaRunTemplateServerController.create_run_from_template(
            run_template,
            {},
            {
                [listener.oselia_run_param_cache_key ? listener.oselia_run_param_cache_key : 'PARAM']: JSON.stringify(event.param),
            });

        if (!run) {
            ConsoleHandler.error('instantiate_oselia_run_from_event:No run created from template:' + listener.oselia_run_template_name);
            return;
        }

        if (listener.oselia_run_link_to_event) {
            await this.link_oselia_run_to_event(event, run);
        }

        if (listener.oselia_run_link_to_listener) {
            await this.link_oselia_run_to_listener(listener, run);
        }

        if (listener.oselia_run_linked_to_param) {

            await this.link_oselia_run_to_param(run, event, listener);
        }

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run);
    }

    private async link_oselia_run_to_event(event: EventifyEventInstanceVO, run: OseliaRunVO) {

        // Si l'event est pas encore en base, on l'insère, et on s'arrure que sa conf est aussi en base
        let event_conf: EventifyEventConfVO = null;
        if (!event.event_conf_id) {
            // Si on a pas l'id de la conf on cherche par nom
            event_conf = await query(EventifyEventConfVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<EventifyEventConfVO>().name, event.name)
                .exec_as_server()
                .select_vo<EventifyEventConfVO>();
        } else {
            event_conf = await query(EventifyEventConfVO.API_TYPE_ID)
                .filter_by_id(event.event_conf_id)
                .exec_as_server()
                .select_vo<EventifyEventConfVO>();
        }
        if (!event_conf) {
            event_conf = EventifyEventConfVO.from_instance(event);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(event_conf);
        }

        if (!event_conf.id) {
            ConsoleHandler.error('instantiate_oselia_run_from_event:No event_conf.id found for event_conf:' + event_conf.name);
            return;
        }

        event.event_conf_id = event_conf.id;

        if (!event.id) {
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(event);
        }
        run.event_id = event.id;
    }

    private async link_oselia_run_to_listener(listener: EventifyEventListenerInstanceVO, run: OseliaRunVO) {

        // Si l'listener est pas encore en base, on l'insère, et on s'arrure que sa conf est aussi en base
        let listener_conf: EventifyEventListenerConfVO = null;
        if (!listener.listener_conf_id) {
            // Si on a pas l'id de la conf on cherche par nom
            listener_conf = await query(EventifyEventListenerConfVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<EventifyEventListenerConfVO>().name, listener.name)
                .exec_as_server()
                .select_vo<EventifyEventListenerConfVO>();
        } else {
            listener_conf = await query(EventifyEventListenerConfVO.API_TYPE_ID)
                .filter_by_id(listener.listener_conf_id)
                .exec_as_server()
                .select_vo<EventifyEventListenerConfVO>();
        }
        if (!listener_conf) {
            listener_conf = EventifyEventListenerConfVO.from_instance(listener);
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(listener_conf);
        }

        if (!listener_conf.id) {
            ConsoleHandler.error('instantiate_oselia_run_from_listener:No listener_conf.id found for listener_conf:' + listener_conf.name);
            return;
        }

        listener.listener_conf_id = listener_conf.id;

        if (!listener.id) {
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(listener);
        }
        run.listener_id = listener.id;
    }

    private async link_oselia_run_to_param(
        run: OseliaRunVO,
        event: EventifyEventInstanceVO,
        listener: EventifyEventListenerInstanceVO,
    ) {

        const param = event.param;

        if (!param) {
            return;
        }

        // Si on a un listener.oselia_run_linked_to_param_field_name, on set directement sans discuter
        let has_modif = false;
        if (listener.oselia_run_linked_to_param_field_name) {
            param[listener.oselia_run_linked_to_param_field_name] = run.id;
            has_modif = true;
        } else {
            // Sinon, si on est sur un vo avec un _type et un moduletable on cherche un champ valide pour la liaison (1 et 1 seul)
            const vo_type = param['_type'];

            if (!vo_type) {
                return;
            }

            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];
            if (!fields) {
                return;
            }

            let target_field_name: string = null;
            for (const field_name in fields) {
                const field = fields[field_name];

                if (field.field_type == ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
                    if (field.foreign_ref_vo_type == OseliaRunVO.API_TYPE_ID) {

                        if (target_field_name) {
                            ConsoleHandler.error('link_oselia_run_to_param:More than 1 field found for linking run to param:' + vo_type + ':' + field_name);
                            return;
                        }

                        target_field_name = field_name;
                    }
                }
            }

            param[target_field_name] = run.id;
            has_modif = true;
        }

        // à la fin si on a fait des modifs et que c'est un vo avec un id, on update l'objet en base, sinon on n'insère pas un nouvel objet en base
        if (has_modif && param['_type'] && param['id'] && ModuleTableController.module_tables_by_vo_type[param['_type']]) {
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(param as IDistantVOBase);
        }
    }

    private async pre_u_assistant_update_mem_functions(vo_wrapper: DAOUpdateVOHolder<GPTAssistantAPIAssistantVO>, exec_as_server?: boolean) {

        if (vo_wrapper.post_update_vo.agent_mem_access && !vo_wrapper.pre_update_vo.agent_mem_access) {
            await all_promises([
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().agent_mem_get_entries),
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().agent_mem_get_keys),
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().agent_mem_set_mem),
            ]);
        }
        if (!vo_wrapper.post_update_vo.agent_mem_access && vo_wrapper.pre_update_vo.agent_mem_access) {
            await all_promises([
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().agent_mem_get_entries),
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().agent_mem_get_keys),
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().agent_mem_set_mem),
            ]);
        }

        if (vo_wrapper.post_update_vo.app_mem_access && !vo_wrapper.pre_update_vo.app_mem_access) {
            await all_promises([
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().app_mem_get_entries),
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().app_mem_get_keys),
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().app_mem_set_mem),
            ]);
        }
        if (!vo_wrapper.post_update_vo.app_mem_access && vo_wrapper.pre_update_vo.app_mem_access) {
            await all_promises([
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().app_mem_get_entries),
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().app_mem_get_keys),
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().app_mem_set_mem),
            ]);
        }

        if (vo_wrapper.post_update_vo.user_mem_access && !vo_wrapper.pre_update_vo.user_mem_access) {
            await all_promises([
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().user_mem_get_entries),
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().user_mem_get_keys),
                this.add_function_to_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().user_mem_set_mem),
            ]);
        }
        if (!vo_wrapper.post_update_vo.user_mem_access && vo_wrapper.pre_update_vo.user_mem_access) {
            await all_promises([
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().user_mem_get_entries),
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().user_mem_get_keys),
                this.rmv_function_from_assistant(vo_wrapper.post_update_vo, this.name, reflect<this>().user_mem_set_mem),
            ]);
        }

        return true;
    }

    private async post_c_assistant_update_mem_functions(assistant: GPTAssistantAPIAssistantVO) {

        if (assistant.agent_mem_access) {
            await all_promises([
                this.add_function_to_assistant(assistant, this.name, reflect<this>().agent_mem_get_entries),
                this.add_function_to_assistant(assistant, this.name, reflect<this>().agent_mem_get_keys),
                this.add_function_to_assistant(assistant, this.name, reflect<this>().agent_mem_set_mem),
            ]);
        }

        if (assistant.user_mem_access) {
            await all_promises([
                this.add_function_to_assistant(assistant, this.name, reflect<this>().user_mem_get_entries),
                this.add_function_to_assistant(assistant, this.name, reflect<this>().user_mem_get_keys),
                this.add_function_to_assistant(assistant, this.name, reflect<this>().user_mem_set_mem),
            ]);
        }

        if (assistant.app_mem_access) {
            await all_promises([
                this.add_function_to_assistant(assistant, this.name, reflect<this>().app_mem_get_entries),
                this.add_function_to_assistant(assistant, this.name, reflect<this>().app_mem_get_keys),
                this.add_function_to_assistant(assistant, this.name, reflect<this>().app_mem_set_mem),
            ]);
        }
    }

    private async add_function_to_assistant(assistant: GPTAssistantAPIAssistantVO, module_name: string, function_name: string) {

        const current_link = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_id(assistant.id, GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, module_name, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, function_name, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantFunctionVO>();

        if (current_link) {
            return;
        }

        const function_vo = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, module_name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!function_vo) {
            ConsoleHandler.error('add_function_to_assistant:No function_vo found for module_name:' + module_name + ' function_name:' + function_name);
            return;
        }

        const assistant_function_link = new GPTAssistantAPIAssistantFunctionVO();
        assistant_function_link.assistant_id = assistant.id;
        assistant_function_link.function_id = function_vo.id;

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_function_link);
    }

    private async rmv_function_from_assistant(assistant: GPTAssistantAPIAssistantVO, module_name: string, function_name: string) {

        await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_id(assistant.id, GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, module_name, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, function_name, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .delete_vos();
    }
}
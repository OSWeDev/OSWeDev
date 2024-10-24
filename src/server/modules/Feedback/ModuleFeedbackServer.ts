
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleFeedback from '../../../shared/modules/Feedback/ModuleFeedback';
import FeedbackStateVO from '../../../shared/modules/Feedback/vos/FeedbackStateVO';
import FeedbackVO from '../../../shared/modules/Feedback/vos/FeedbackVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTCompletionAPIConversationVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../../../shared/modules/GPT/vos/GPTCompletionAPIMessageVO';
import MailVO from '../../../shared/modules/Mailer/vos/MailVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../shared/modules/Stats/StatsController';
import TeamsWebhookContentActionCardOpenURITargetVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionCardOpenURITargetVO';
import TeamsWebhookContentActionCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionCardVO';
import TeamsWebhookContentActionOpenUrlVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO';
import TeamsWebhookContentAdaptiveCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAdaptiveCardVO';
import TeamsWebhookContentAttachmentsVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAttachmentsVO';
import TeamsWebhookContentColumnSetVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnSetVO';
import TeamsWebhookContentColumnVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnVO';
import TeamsWebhookContentImageVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentImageVO';
import TeamsWebhookContentSectionVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentTextBlockVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentTextBlockVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import CRUDHandler from '../../../shared/tools/CRUDHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ModuleFileServer from '../File/ModuleFileServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import ModuleGPTServer from '../GPT/ModuleGPTServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ModuleTrelloAPIServer from '../TrelloAPI/ModuleTrelloAPIServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import FeedbackConfirmationMail from './FeedbackConfirmationMail/FeedbackConfirmationMail';
const { parse } = require('flatted/cjs');
export default class ModuleFeedbackServer extends ModuleServerBase {

    public static FEEDBACK_SEND_GPT_RESPONSE_TO_TEAMS: string = 'FEEDBACK_SEND_GPT_RESPONSE_TO_TEAMS';
    public static FEEDBACK_ASSISTANT_ID: string = 'FEEDBACK_ASSISTANT_ID';
    public static FEEDBACK_ASSISTANT_NAME: string = 'Feedback - Assistant pour résumer';

    public static FEEDBACK_TRELLO_LIST_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_LIST_ID';
    public static TEAMS_WEBHOOK_PARAM_NAME: string = 'ModuleFeedbackServer.TEAMS_WEBHOOK';
    public static DASHBOARD_FEEDBACK_ID_PARAM_NAME: string = 'ModuleFeedbackServer.DASHBOARD_FEEDBACK_ID';

    public static FEEDBACK_TRELLO_POSSIBLE_BUG_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_POSSIBLE_BUG_ID';
    public static FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID';
    public static FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID';
    public static FEEDBACK_TRELLO_NOT_SET_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_NOT_SET_ID';
    public static FEEDBACK_TRELLO_RAPPELER_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_RAPPELER_ID';

    public static FEEDBACK_TRELLO_API_LOG_LIMIT_PARAM_NAME: string = 'FEEDBACK_TRELLO_API_LOG_LIMIT';
    public static FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT_PARAM_NAME: string = 'FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT';
    public static FEEDBACK_TRELLO_ROUTE_LIMIT_PARAM_NAME: string = 'FEEDBACK_TRELLO_ROUTE_LIMIT';

    private static TRELLO_LINE_SEPARATOR: string = '\x0A';
    private static TRELLO_SECTION_SEPARATOR: string = ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '---' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

    private static instance: ModuleFeedbackServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleFeedback.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleFeedbackServer.instance) {
            ModuleFeedbackServer.instance = new ModuleFeedbackServer();
        }
        return ModuleFeedbackServer.instance;
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleFeedback.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Feedbacks'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleFeedback.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des feedbacks'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleFeedback.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès front - Feedbacks'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Un incident technique - un comportement inhabituel de la solution - , qui induit une indisponibilité partielle ou totale du service' },
            'feedback_handler.type.incident.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Une erreur logicielle reproductible par rapport au fonctionnement attendu au sein de l\'application' },
            'feedback_handler.type.bug.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Une demande d\'évolution ou une suggestion pour améliorer la solution et répondre mieux à votre besoin' },
            'feedback_handler.type.request.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Tout autre message adressé aux équipes techniques, relatif à une page / un fonctionnement de l\'application' },
            'feedback_handler.type.not_set.tooltip.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Fermer' },
            'feedback_handler.hide.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nécessite au moins une capture écran.' },
            'FeedbackHandlerComponent.needs_at_least_one_screenshot.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Message ou titre obligatoire.' },
            'FeedbackHandlerComponent.needs_message_or_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Message et titre obligatoires.' },
            'FeedbackHandlerComponent.needs_message_and_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Utilisateur et email obligatoires.' },
            'FeedbackHandlerComponent.needs_user_and_email.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Merci de renseigner un téléphone pour être rappelé.' },
            'FeedbackHandlerComponent.needs_phone.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Je souhaite être rappelé' },
            'feedback_handler.wish_be_called.on.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Je souhaite être rappelé' },
            'feedback_handler.wish_be_called.off.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Fichiers' },
            'feedback_handler.attachments.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Captures écran' },
            'feedback_handler.captures.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Vider' },
            'feedback_handler.clear.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'E-mail' },
            'feedback_handler.email.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Faites-nous part de vos suggestions, informez-nous d\'un incident ou d\'un bug, ou laissez-nous simplement un message' },
            'feedback_handler.header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Message' },
            'feedback_handler.message.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Téléphone' },
            'feedback_handler.phone.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Envoyer' },
            'feedback_handler.submit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Titre' },
            'feedback_handler.title.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Bug' },
            'feedback_handler.type.bug.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Incident' },
            'feedback_handler.type.incident.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Type de message' },
            'feedback_handler.type.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Autre' },
            'feedback_handler.type.not_set.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Demande d\'évolution ou proposition d\'amélioration' },
            'feedback_handler.type.request.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Utilisateur' },
            'feedback_handler.user.label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Demande d\'évolution' },
            'feedback.FEEDBACK_TYPE.ENHANCEMENT_REQUEST'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Bug' },
            'feedback.FEEDBACK_TYPE.BUG'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Incident technique' },
            'feedback.FEEDBACK_TYPE.INCIDENT'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Autre' },
            'feedback.FEEDBACK_TYPE.NOT_SET'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Votre retour d\'expérience a bien été transmis. Merci.' },
            'feedback.feedback.success'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Erreur lors de la transmission. Merci de contacter l\'équipe projet pour les en informer.' },
            'feedback.feedback.error'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': '[FEEDBACK:%%VAR%%FEEDBACK_ID%%] Confirmation de réception de votre retour d\'expérience' },
            'mails.feedback.confirmation.subject'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nous avons bien reçu votre retour d\'expérience intitulé "%%VAR%%FEEDBACK_TITLE%%" et allons le traiter rapidement. Nous vous tiendrons informé de son évolution. A des fins de suivi, votre retour d\'expérience porte le numéro %%VAR%%FEEDBACK_ID%%. Toute l\'équipe vous remercie de faire progresser notre solution.' },
            'mails.feedback.confirmation.html'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Une erreur est survenue. Veuillez contacter l\'équipe technique par mail pour faire votre commentaire.' },
            'error_sending_feedback.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Le nom du fichier n\'est pas conforme, pas d\'espace ou de caractères spéciaux' },
            'file_format_error.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nous contacter', 'es-es': 'Contáctenos' },
            'feedback_handler.btn.title.___LABEL___')
        );
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Horaires de préférence', 'es-es': 'Horas preferidas' },
            'feedback_handler.preferred_times_called.label.___LABEL___')
        );
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Je souhaite être rappelé' },
            'feedback_handler.wish_be_called.label.___LABEL___')
        );

        //SurveyComponent - Enquête de satisfaction
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Votre avis', 'es-es': 'Su opinión' },
            'survey.btn.title.___LABEL___')
        );

        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(FeedbackVO.API_TYPE_ID, this, this.pre_create_feedback_assign_default_state);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleFeedback.APINAME_feedback, this.feedback.bind(this));
    }

    private async pre_create_feedback_assign_default_state(feedback: FeedbackVO): Promise<boolean> {

        if (!feedback) {
            return false;
        }

        if (!feedback.state_id) {
            const default_state = await query(FeedbackStateVO.API_TYPE_ID)
                .filter_is_true(field_names<FeedbackStateVO>().is_default_state).select_vo<FeedbackStateVO>();
            if (!default_state) {
                ConsoleHandler.error('pre_create_feedback_assigne_default_state:Aucun état par défaut n\'est défini pour les retours d\'expérience');
                return true;
            }
            feedback.state_id = default_state.id;
        }

        return true;
    }

    /**
     * Ce module nécessite le param FEEDBACK_TRELLO_LIST_ID
     *  Pour trouver le idList => https://customer.io/actions/trello/
     */
    private async feedback(feedback: FeedbackVO): Promise<FeedbackVO> {

        if (!feedback) {
            return null;
        }

        const time_in: number = Dates.now_ms();
        StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "IN");

        const uid = ModuleAccessPolicyServer.getLoggedUserId();
        const CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

        try {

            const user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getUserSession();
            if (!user_session) {
                StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_NO_USER_SESSION");
                return null;
            }

            const FEEDBACK_TRELLO_LIST_ID = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_LIST_ID_PARAM_NAME);
            if (!FEEDBACK_TRELLO_LIST_ID) {
                StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_NO_FEEDBACK_TRELLO_LIST_ID");
                throw new Error('Le module FEEDBACK nécessite la configuration du paramètre FEEDBACK_TRELLO_LIST_ID qui indique le code du tableau Trello à utiliser (cf URL d\'une card de la liste +.json => idList)');
            }

            const FEEDBACK_TRELLO_POSSIBLE_BUG_ID = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_POSSIBLE_BUG_ID_PARAM_NAME);
            const FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID_PARAM_NAME);
            const FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID_PARAM_NAME);
            const FEEDBACK_TRELLO_NOT_SET_ID = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_NOT_SET_ID_PARAM_NAME);
            const FEEDBACK_TRELLO_RAPPELER_ID = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_RAPPELER_ID_PARAM_NAME);
            if ((!FEEDBACK_TRELLO_POSSIBLE_BUG_ID) || (!FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID) || (!FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID) || (!FEEDBACK_TRELLO_NOT_SET_ID)) {
                StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_NO_FEEDBACK_TRELLO_POSSIBLE_BUG_ID");
                throw new Error('Le module FEEDBACK nécessite la configuration des paramètres FEEDBACK_TRELLO_POSSIBLE_BUG_ID,FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID,FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID,FEEDBACK_TRELLO_NOT_SET_ID qui indiquent les codes des marqueurs Trello à utiliser (cf URL d\'une card de la liste +.json => labels:id)');
            }

            // Remplir le feedback avec toutes les infos qui sont connues côté serveur,
            feedback.user_connection_date = user_session.last_load_date_unix;
            feedback.user_id = user_session.uid;
            feedback.user_login_date = user_session.creation_date_unix;

            feedback.is_impersonated = false;
            if (ModuleAccessPolicyServer.getInstance().isLogedAs()) {

                const admin_user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getAdminLogedUserSession();
                feedback.impersonated_from_user_connection_date = admin_user_session.last_load_date_unix;
                feedback.impersonated_from_user_id = admin_user_session.uid;
                feedback.impersonated_from_user_login_date = admin_user_session.creation_date_unix;
                feedback.is_impersonated = true;
            }

            // Puis créer le feedback en base
            const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(feedback);
            if ((!res) || (!res.id)) {
                StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_NO_FEEDBACK_CREATED");
                throw new Error('Failed feedback creation');
            }
            feedback.id = res.id;

            // Créer le Trello associé
            let response;
            const idLabels: string[] = [];
            let trello_message = feedback.message + '\x0A' + '\x0A';

            const user_infos = await this.user_infos_to_string(feedback);
            trello_message += user_infos;
            const feedback_infos = await this.feedback_infos_to_string(feedback);
            trello_message += feedback_infos;

            const screen_captures = await this.screen_captures_to_string(feedback);
            trello_message += screen_captures;
            const attachments = await this.attachments_to_string(feedback);
            trello_message += attachments;

            const routes = await this.routes_to_string(feedback);
            trello_message += routes;
            const console_logs_errors = await this.console_logs_to_string(feedback);
            trello_message += console_logs_errors;

            // let api_logs = await this.api_logs_to_string(feedback);
            // if (ModuleParams.APINAME_feedback_activate_api_logs) { //Api_logs du message , désactivé par défaut.
            //     trello_message += api_logs;
            // }
            switch (feedback.feedback_type) {
                case FeedbackVO.FEEDBACK_TYPE_BUG:
                    idLabels.push(FEEDBACK_TRELLO_POSSIBLE_BUG_ID);
                    break;
                case FeedbackVO.FEEDBACK_TYPE_INCIDENT:
                    idLabels.push(FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID);
                    break;
                case FeedbackVO.FEEDBACK_TYPE_ENHANCEMENT_REQUEST:
                    idLabels.push(FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID);
                    break;
                case FeedbackVO.FEEDBACK_TYPE_NOT_SET:
                    idLabels.push(FEEDBACK_TRELLO_NOT_SET_ID);
                    break;
            }

            let card_name: string = (ConfigurationService.node_configuration.is_main_prod_env ? '[PROD] ' : '[TEST] ') + feedback.title;

            if (feedback.wish_be_called && FEEDBACK_TRELLO_RAPPELER_ID) {
                idLabels.push(FEEDBACK_TRELLO_RAPPELER_ID);
                card_name += " (A RAPPELER)";
            }

            // On peut pas envoyer plus de 16384 chars à l'api trello pour le message
            // Donc on limite à 15000 chars et on met tout dans un fichier dont on donne l'adresse au début du message

            const feedback_file_patch = '/files/feedbacks/feedback_' + Dates.now() + '.txt';
            await ModuleFileServer.getInstance().makeSureThisFolderExists('./files/feedbacks/');
            await ModuleFileServer.getInstance().writeFile('.' + feedback_file_patch, trello_message);

            const envParam: EnvParam = ConfigurationService.node_configuration;
            const file_url = envParam.base_url + feedback_file_patch;

            trello_message = ((trello_message.length > 15000) ? trello_message.substr(0, 15000) + ' ... [truncated 15000 cars]' : trello_message);
            trello_message = '[FEEDBACK FILE : ' + file_url + '](' + file_url + ')' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + trello_message;

            try {

                response = await ModuleTrelloAPIServer.getInstance().create_card(
                    card_name,
                    trello_message,
                    FEEDBACK_TRELLO_LIST_ID,
                    idLabels);
                // idLabels,
                // {
                //     pos: 'top',
                // });
            } catch (error) {
                ConsoleHandler.error(error);
                StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_TRELLO_API");
            }

            // Faire le lien entre le feedback en base et le Trello
            if (response && response.id) {
                feedback.trello_ref = response.id;
            } else {
                ConsoleHandler.error('Failed Trello card creation');
                await TeamsAPIServerController.send_teams_error(
                    'Echec de création de carte Trello',
                    'Impossible de créer la carte Trello pour le feedback ' + feedback.id + ' : ' + feedback.title);
            }

            const ires: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(feedback);
            if ((!ires) || (!ires.id)) {
                StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_INSERTING_FEEDBACK");
                throw new Error('Failed feedback creation');
            }
            feedback.id = ires.id;

            // // On n'attend pas la réponse pour Teams, à cause des temps d'interaction avec GPT
            // this.handle_feedback_gpt_to_teams(feedback, uid, user_infos, feedback_infos, routes, console_logs_errors
            //     // , api_logs
            // );

            // Envoyer un mail pour confirmer la prise en compte du feedback
            const mail: MailVO = await FeedbackConfirmationMail.getInstance().sendConfirmationEmail(feedback);
            feedback.confirmation_mail_id = mail ? mail.id : null;

            await PushDataServerController.notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'feedback.feedback.success', true);

            StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "FEEDBACK_CREATED");
            StatsController.register_stat_DUREE("ModuleFeedback", "feedback", "FEEDBACK_CREATED", Dates.now_ms() - time_in);

            return feedback;
        } catch (error) {
            ConsoleHandler.error(error);
            StatsController.register_stat_COMPTEUR("ModuleFeedback", "feedback", "ERROR_THROWN");
            await PushDataServerController.notifySimpleERROR(uid, CLIENT_TAB_ID, 'feedback.feedback.error', true);
            return null;
        }
    }

    // On va mettre en place un assistant pour remplacer le feedback dans tous les cas, et cette version n'est ni valide, ni utilisée
    // private async handle_feedback_gpt_to_teams(feedback: FeedbackVO, uid: number, user_infos: string, feedback_infos: string, routes: string, console_logs_errors: string
    //     // , api_logs: string
    // ) {
    //     const FEEDBACK_SEND_GPT_RESPONSE_TO_TEAMS = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleFeedbackServer.FEEDBACK_SEND_GPT_RESPONSE_TO_TEAMS, false, 60000);
    //     if (FEEDBACK_SEND_GPT_RESPONSE_TO_TEAMS) {

    //         // const gpt_assistant_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleFeedbackServer.FEEDBACK_ASSISTANT_ID);

    //         // if (!gpt_assistant_id) {
    //         //     ConsoleHandler.error('handle_feedback_gpt_to_teams: Le paramètre ' + ModuleFeedbackServer.FEEDBACK_ASSISTANT_ID + ' doit être renseigné pour envoyer les réponses GPT aux équipes');
    //         //     return;
    //         // }

    //         // const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_id(gpt_assistant_id).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();

    //         // if (!assistant) {
    //         //     ConsoleHandler.error('handle_feedback_gpt_to_teams: L\'assistant GPT ' + gpt_assistant_id + ' n\'existe pas');
    //         //     return;
    //         // }

    //         // const gtp_4_brief: GPTAssistantAPIThreadMessageVO[] = await GPTAssistantAPIServerController.ask_assistant(
    //         //     assistant.gpt_assistant_id,
    //         //     null,
    //         //     ' - Titre du formulaire : ' + feedback.title + ' ' +
    //         //     ' - Message : ' + feedback.message + ' ' +
    //         //     ' - Infos de l\'utilisateur : ' + user_infos +
    //         //     ' - feedback_infos : ' + feedback_infos,
    //         //     null,
    //         //     uid);


    //         const gtp_4_brief = await ModuleGPTServer.getInstance().generate_response(new GPTCompletionAPIConversationVO(), GPTCompletionAPIMessageVO.createNew(
    //             GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_USER,
    //             uid,
    //             'Tu es à la Hotline de Wedev et tu viens de recevoir un formulaire de contact sur la solution ' + ConfigurationService.node_configuration.app_title + '. ' +
    //             // 'Sur cette solution, @julien@wedev.fr s\'occupe du DEV et de la technique, et @Michael s\'occupe de la facturation. ' +
    //             'Tu dois réaliser un résumé en français de 75 à 150 mots de ce formulaire avec les informations qui te semblent pertinentes pour comprendre le besoin client à destination des membre de l\'équipe WEDEV. ' +
    //             'Formattes le message en HTML pour être le plus lisible / synthétique / efficace possible. Le format HTML doit être compatible avec Teams. ' + // du et des bons interlocuteurs dans l\'équipe, en les citant avant de leur indiquer la partie qui les concerne. ' +
    //             'Ci-après les éléments constituant le formulaire de contact client : {' +
    //             ' - Titre du formulaire : ' + feedback.title + ' ' +
    //             ' - Message : ' + feedback.message + ' ' +
    //             ' - Infos de l\'utilisateur : ' + user_infos +
    //             ' - feedback_infos : ' + feedback_infos +
    //             ' - console_logs_errors : ' + console_logs_errors
    //             // ' - api_logs : ' + api_logs
    //         ));
    //         const TEAMS_WEBHOOK: string = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.TEAMS_WEBHOOK_PARAM_NAME);
    //         if (gtp_4_brief && TEAMS_WEBHOOK && gtp_4_brief.content) {
    //             const teamsWebhookContent = new TeamsWebhookContentVO();
    //             const body = [];
    //             const actions = [];
    //             let title_Text = new TeamsWebhookContentTextBlockVO().set_size('Medium').set_weight('Bolder').set_text((ConfigurationService.node_configuration.is_main_prod_env ? '[PROD] ' : '[TEST] ') + 'Nouveau FEEDBACK Utilisateur - ' + ConfigurationService.node_configuration.base_url);
    //             body.push(title_Text);

    //             if (feedback.screen_capture_1_id) {
    //                 await this.handle_screen_capture(feedback.screen_capture_1_id, 1, body);
    //             }
    //             if (feedback.screen_capture_2_id) {
    //                 await this.handle_screen_capture(feedback.screen_capture_2_id, 2, body);
    //             }
    //             if (feedback.screen_capture_3_id) {
    //                 await this.handle_screen_capture(feedback.screen_capture_3_id, 3, body);
    //             }

    //             if (feedback.file_attachment_1_id) {
    //                 await this.handle_file_attachement(feedback.file_attachment_1_id, 1, body);
    //             }
    //             if (feedback.file_attachment_2_id) {
    //                 await this.handle_file_attachement(feedback.file_attachment_2_id, 2, body);
    //             }
    //             if (feedback.file_attachment_3_id) {
    //                 await this.handle_file_attachement(feedback.file_attachment_3_id, 3, body);
    //             }

    //             const feedback_Title = new TeamsWebhookContentTextBlockVO().set_weight('Bolder').set_text(feedback.title);
    //             body.push(feedback_Title);
    //             const feedback_Column = new TeamsWebhookContentColumnSetVO().set_columns([new TeamsWebhookContentColumnVO().set_items([new TeamsWebhookContentTextBlockVO().set_text(gtp_4_brief.content).set_size('small')])]).set_style('emphasis');
    //             body.push(feedback_Column);
    //             // protection contre le cas très spécifique de la création d'une sonde en erreur (qui ne devrait jamais arriver)
    //             const dashboard_feedback_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleFeedbackServer.DASHBOARD_FEEDBACK_ID_PARAM_NAME);
    //             if ((!!feedback.id) && !!dashboard_feedback_id) {
    //                 actions.push(new TeamsWebhookContentActionOpenUrlVO().set_url(ConfigurationService.node_configuration.base_url + 'admin#/dashboard/view/' + dashboard_feedback_id).set_title('Consulter'));
    //             }
    //             teamsWebhookContent.attachments.push(new TeamsWebhookContentAttachmentsVO().set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body).set_actions(actions)));

    //             await TeamsAPIServerController.send_to_teams_webhook(TEAMS_WEBHOOK, teamsWebhookContent);
    //         }
    //     }
    // }

    // private async handle_file_attachement(screen_capture_id: number, num: number, body: any[]) {
    //     const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(screen_capture_id).select_vo<FileVO>();
    //     if (!file) {
    //         return '';
    //     }
    //     const file_url = ConfigurationService.node_configuration.base_url + file.path;
    //     const message = new TeamsWebhookContentTextBlockVO().set_text('[Pièce jointe ' + num + '](\"' + file_url + '\")');
    //     body.push(message);
    // }

    // private async handle_screen_capture(screen_capture_id: number, num: number, body: any[]) {
    //     const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(screen_capture_id).select_vo<FileVO>();
    //     if (!file) {
    //         return '';
    //     }
    //     const file_url = ConfigurationService.node_configuration.base_url + file.path;
    //     const message = new TeamsWebhookContentTextBlockVO().set_text('[Capture écran ' + num + '](\"' + file_url + '\")');
    //     body.push(new TeamsWebhookContentImageVO().set_url(file_url));
    //     body.push(message);
    // }

    // private async api_logs_to_string(feedback: FeedbackVO): Promise<string> {
    //     let FEEDBACK_TRELLO_API_LOG_LIMIT: string = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_API_LOG_LIMIT_PARAM_NAME);
    //     let API_LOG_LIMIT: number = FEEDBACK_TRELLO_API_LOG_LIMIT ? parseInt(FEEDBACK_TRELLO_API_LOG_LIMIT.toString()) : 100;

    //     let apis_log: LightWeightSendableRequestVO[] = parse(feedback.apis_log_json);
    //     let apis_log_message: string = '';
    //     API_LOG_LIMIT = API_LOG_LIMIT - apis_log.length;
    //     let limited: boolean = API_LOG_LIMIT < 0;

    //     for (let i in apis_log) {
    //         let api_log = apis_log[i];

    //         API_LOG_LIMIT++;
    //         if (API_LOG_LIMIT <= 0) {
    //             continue;
    //         }

    //         // On commence par un retour à la ligne aussi puisque sinon la liste fonctionne pas
    //         apis_log_message += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

    //         let type: string = null;
    //         switch (api_log.type) {
    //             case LightWeightSendableRequestVO.API_TYPE_GET:
    //                 type = 'GET';
    //                 break;
    //             case LightWeightSendableRequestVO.API_TYPE_POST:
    //                 type = 'POST';
    //                 break;
    //             case LightWeightSendableRequestVO.API_TYPE_POST_FOR_GET:
    //                 type = 'POST_FOR_GET';
    //                 break;
    //         }

    //         let BASE_URL: string = ConfigurationService.node_configuration.base_url;
    //         let url = FileHandler.getInstance().get_full_url(BASE_URL, api_log.url);
    //         apis_log_message += '1. [' + type + ' - ' + api_log.url + '](' + url + ')';
    //     }

    //     let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
    //     res += '##APIS LOG' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
    //     res += (limited ? ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ...' : '');
    //     res += apis_log_message;
    //     return res;
    // }

    private async console_logs_to_string(feedback: FeedbackVO): Promise<string> {
        const FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT: string = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT_PARAM_NAME);
        const CONSOLE_LOG_LIMIT: number = FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT ? parseInt(FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT.toString()) : 100;
        let limited: boolean = false;

        if (feedback.console_logs && (feedback.console_logs.length > CONSOLE_LOG_LIMIT)) {
            feedback.console_logs.splice(0, feedback.console_logs.length - CONSOLE_LOG_LIMIT);
            limited = true;
        }

        const console_logs_message: string = (feedback.console_logs && feedback.console_logs.length) ?
            ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ' + feedback.console_logs.join(ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ') :
            '';

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##CONSOLE LOGS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += (limited ? ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ...' : '');
        res += console_logs_message;
        return res;
    }

    private async routes_to_string(feedback: FeedbackVO): Promise<string> {
        const FEEDBACK_TRELLO_ROUTE_LIMIT: string = await ModuleParams.getInstance().getParamValueAsString(ModuleFeedbackServer.FEEDBACK_TRELLO_ROUTE_LIMIT_PARAM_NAME);
        let ROUTE_LIMIT: number = FEEDBACK_TRELLO_ROUTE_LIMIT ? parseInt(FEEDBACK_TRELLO_ROUTE_LIMIT.toString()) : 100;
        const envParam: EnvParam = ConfigurationService.node_configuration;

        let routes_message: string = '';
        ROUTE_LIMIT = ROUTE_LIMIT - feedback.routes_fullpaths.length;
        const limited: boolean = ROUTE_LIMIT < 0;

        for (const i in feedback.routes_fullpaths) {
            const route: string = feedback.routes_fullpaths[i];

            ROUTE_LIMIT++;
            if (ROUTE_LIMIT <= 0) {
                continue;
            }

            // On commence par un retour à la ligne aussi puisque sinon la liste fonctionne pas
            routes_message += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
            routes_message += '1. [' + route + '](' + envParam.base_url + '#' + route + ')';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##ROUTES' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += (limited ? ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ...' : '');
        res += routes_message;
        return res;
    }

    private async user_infos_to_string(feedback: FeedbackVO): Promise<string> {
        const envParam: EnvParam = ConfigurationService.node_configuration;

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##USER INFOS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [' + feedback.name + ' | UID ' + feedback.user_id + '](' +
            envParam.base_url + 'admin/#' + CRUDHandler.getUpdateLink(UserVO.API_TYPE_ID, feedback.user_id) + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Connection : ' + Dates.format(feedback.user_connection_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Login : ' + Dates.format(feedback.user_login_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        if (feedback.is_impersonated) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Impersonated from : [Admin user | UID ' + feedback.impersonated_from_user_id + '](' +
                envParam.base_url + 'admin/#' + CRUDHandler.getUpdateLink(UserVO.API_TYPE_ID, feedback.impersonated_from_user_id) + ')';
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Impersonated from : Connection : ' + Dates.format(feedback.impersonated_from_user_connection_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Impersonated from : Login : ' + Dates.format(feedback.impersonated_from_user_login_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        }
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [' + feedback.email + '](mailto:' + feedback.email + ')';

        if (feedback.phone) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [' + feedback.phone + '](tel:' + feedback.phone + ')';
        }

        if (feedback.wish_be_called) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- **Souhaite être rappelé**';
        }

        if (feedback.preferred_times_called) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- **Horaires de préférence : ' + feedback.preferred_times_called + '**';
        }

        return res;
    }

    private async feedback_infos_to_string(feedback: FeedbackVO): Promise<string> {
        const envParam: EnvParam = ConfigurationService.node_configuration;

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##FEEDBACK INFOS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

        let type = '';
        switch (feedback.feedback_type) {
            case FeedbackVO.FEEDBACK_TYPE_BUG:
                type = 'BUG';
                break;
            case FeedbackVO.FEEDBACK_TYPE_INCIDENT:
                type = 'INCIDENT';
                break;
            case FeedbackVO.FEEDBACK_TYPE_ENHANCEMENT_REQUEST:
                type = 'REQUEST';
                break;
            case FeedbackVO.FEEDBACK_TYPE_NOT_SET:
                type = 'NOT_SET';
                break;
        }

        const start_url = envParam.base_url + '#' + feedback.feedback_start_url;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Start URL : [' + start_url + '](' + start_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Start date : ' + Dates.format(feedback.feedback_start_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        const end_url = envParam.base_url + '#' + feedback.feedback_end_url;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Submission URL : [' + end_url + '](' + end_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Submission date : ' + Dates.format(feedback.feedback_end_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Submission type : ' + type;
        return res;
    }

    private async attachments_to_string(feedback: FeedbackVO): Promise<string> {
        const envParam: EnvParam = ConfigurationService.node_configuration;

        if (!feedback.file_attachment_1_id) {
            return '';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##ATTACHMENTS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

        let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(feedback.file_attachment_1_id).select_vo<FileVO>();
        if (!file) {
            return '';
        }
        let file_url = envParam.base_url + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [FILE 1 : ' + file_url + '](' + file_url + ')';
        if (!feedback.file_attachment_2_id) {
            return res;
        }

        file = await query(FileVO.API_TYPE_ID).filter_by_id(feedback.file_attachment_2_id).select_vo<FileVO>();
        if (!file) {
            return res;
        }
        file_url = envParam.base_url + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [FILE 2 : ' + file_url + '](' + file_url + ')';
        if (!feedback.file_attachment_3_id) {
            return res;
        }

        file = await query(FileVO.API_TYPE_ID).filter_by_id(feedback.file_attachment_3_id).select_vo<FileVO>();
        if (!file) {
            return res;
        }
        file_url = envParam.base_url + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [FILE 3 : ' + file_url + '](' + file_url + ')';

        return res;
    }

    private async screen_captures_to_string(feedback: FeedbackVO): Promise<string> {
        const envParam: EnvParam = ConfigurationService.node_configuration;

        if (!feedback.screen_capture_1_id) {
            return '';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##SCREENSHOTS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

        let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(feedback.screen_capture_1_id).select_vo<FileVO>();
        if (!file) {
            return '';
        }
        let file_url = envParam.base_url + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [SCREENSHOT 1 : ' + file_url + '](' + file_url + ')';
        if (ModuleParams.APINAME_feedback_display_screenshots) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '![SCREENSHOT 1 : ' + file_url + '](' + file_url + ')';
        }
        if (!feedback.screen_capture_2_id) {
            return res;
        }

        file = await query(FileVO.API_TYPE_ID).filter_by_id(feedback.screen_capture_2_id).select_vo<FileVO>();
        if (!file) {
            return res;
        }
        file_url = envParam.base_url + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [SCREENSHOT 2 : ' + file_url + '](' + file_url + ')';
        if (ModuleParams.APINAME_feedback_display_screenshots) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '![SCREENSHOT 2 : ' + file_url + '](' + file_url + ')';
        }
        if (!feedback.screen_capture_3_id) {
            return res;
        }

        file = await query(FileVO.API_TYPE_ID).filter_by_id(feedback.screen_capture_3_id).select_vo<FileVO>();
        if (!file) {
            return res;
        }
        file_url = envParam.base_url + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [SCREENSHOT 3 : ' + file_url + '](' + file_url + ')';
        if (ModuleParams.APINAME_feedback_display_screenshots) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '![SCREENSHOT 3 : ' + file_url + '](' + file_url + ')';
        }

        return res;
    }
}
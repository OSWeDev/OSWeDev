import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import LightWeightSendableRequestVO from '../../../shared/modules/AjaxCache/vos/LightWeightSendableRequestVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleFeedback from '../../../shared/modules/Feedback/ModuleFeedback';
import FeedbackVO from '../../../shared/modules/Feedback/vos/FeedbackVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import CRUDHandler from '../../../shared/tools/CRUDHandler';
import FileHandler from '../../../shared/tools/FileHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import IServerUserSession from '../../IServerUserSession';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleTrelloAPIServer from '../TrelloAPI/ModuleTrelloAPIServer';
import FeedbackConfirmationMail from './FeedbackConfirmationMail/FeedbackConfirmationMail';
const { parse } = require('flatted/cjs');

export default class ModuleFeedbackServer extends ModuleServerBase {

    public static FEEDBACK_TRELLO_LIST_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_LIST_ID';

    public static FEEDBACK_TRELLO_POSSIBLE_BUG_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_POSSIBLE_BUG_ID';
    public static FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID';
    public static FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID';
    public static FEEDBACK_TRELLO_NOT_SET_ID_PARAM_NAME: string = 'FEEDBACK_TRELLO_NOT_SET_ID';

    public static FEEDBACK_TRELLO_API_LOG_LIMIT_PARAM_NAME: string = 'FEEDBACK_TRELLO_API_LOG_LIMIT';
    public static FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT_PARAM_NAME: string = 'FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT';
    public static FEEDBACK_TRELLO_ROUTE_LIMIT_PARAM_NAME: string = 'FEEDBACK_TRELLO_ROUTE_LIMIT';

    public static getInstance() {
        if (!ModuleFeedbackServer.instance) {
            ModuleFeedbackServer.instance = new ModuleFeedbackServer();
        }
        return ModuleFeedbackServer.instance;
    }

    private static TRELLO_LINE_SEPARATOR: string = '\x0A';
    private static TRELLO_SECTION_SEPARATOR: string = ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '---' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

    private static instance: ModuleFeedbackServer = null;

    private constructor() {
        super(ModuleFeedback.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleFeedback.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Feedbacks'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleFeedback.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des feedbacks'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleFeedback.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            fr: 'Accès front - Feedbacks'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Un incident technique - un comportement inhabituel de la solution - , qui induit une indisponibilité partielle ou totale du service' },
            'feedback_handler.type.incident.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Une erreur logicielle reproductible par rapport au fonctionnement attendu au sein de l\'application' },
            'feedback_handler.type.bug.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Une demande d\'évolution ou une suggestion pour améliorer la solution et répondre mieux à votre besoin' },
            'feedback_handler.type.request.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Tout autre message adressé aux équipes techniques, relatif à une page / un fonctionnement de l\'application' },
            'feedback_handler.type.not_set.tooltip.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Nécessite au moins une capture écran.' },
            'FeedbackHandlerComponent.needs_at_least_one_screenshot.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Message ou titre obligatoire.' },
            'FeedbackHandlerComponent.needs_message_or_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Message et titre obligatoires.' },
            'FeedbackHandlerComponent.needs_message_and_title.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Utilisateur et email obligatoires.' },
            'FeedbackHandlerComponent.needs_user_and_email.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Fichiers' },
            'feedback_handler.attachments.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Captures écran' },
            'feedback_handler.captures.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Vider' },
            'feedback_handler.clear.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'E-mail' },
            'feedback_handler.email.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Faites-nous part de vos suggestions, informez-nous d\'un incident ou d\'un bug, ou laissez-nous simplement un message' },
            'feedback_handler.header.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Message' },
            'feedback_handler.message.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Téléphone' },
            'feedback_handler.phone.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Envoyer' },
            'feedback_handler.submit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Titre' },
            'feedback_handler.title.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Bug' },
            'feedback_handler.type.bug.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Incident' },
            'feedback_handler.type.incident.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Type de message' },
            'feedback_handler.type.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Autre' },
            'feedback_handler.type.not_set.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Demande d\'évolution ou proposition d\'amélioration' },
            'feedback_handler.type.request.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Utilisateur' },
            'feedback_handler.user.label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Demande d\'évolution' },
            'feedback.FEEDBACK_TYPE.ENHANCEMENT_REQUEST'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Bug' },
            'feedback.FEEDBACK_TYPE.BUG'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Incident technique' },
            'feedback.FEEDBACK_TYPE.INCIDENT'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Autre' },
            'feedback.FEEDBACK_TYPE.NOT_SET'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Votre retour d\'expérience a bien été transmis. Merci.' },
            'feedback.feedback.success'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Erreur lors de la transmission. Merci de contacter l\'équipe projet pour les en informer.' },
            'feedback.feedback.error'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: '[FEEDBACK:%%VAR%%FEEDBACK_ID%%] Confirmation de réception de votre retour d\'expérience' },
            'mails.feedback.confirmation.subject'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Nous avons bien reçu votre retour d\'expérience intitulé "%%VAR%%FEEDBACK_TITLE%%" et allons le traiter rapidement. Nous vous tiendrons informé de son évolution. A des fins de suivi, votre retour d\'expérience porte le numéro %%VAR%%FEEDBACK_ID%%. Toute l\'équipe vous remercie de faire progresser notre solution.' },
            'mails.feedback.confirmation.html'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Une erreur est survenue. Veuillez contacter l\'équipe technique par mail pour faire votre commentaire.' },
            'error_sending_feedback.___LABEL___'));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleFeedback.APINAME_feedback, this.feedback.bind(this));
    }

    /**
     * Ce module nécessite le param FEEDBACK_TRELLO_LIST_ID
     *  Pour trouver le idList => https://customer.io/actions/trello/
     */
    private async feedback(feedback: FeedbackVO): Promise<boolean> {

        if (!feedback) {
            return false;
        }

        let uid = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
        let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');

        try {

            let user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getUserSession();
            if (!user_session) {
                return false;
            }

            let FEEDBACK_TRELLO_LIST_ID = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_LIST_ID_PARAM_NAME);
            if (!FEEDBACK_TRELLO_LIST_ID) {
                throw new Error('Le module FEEDBACK nécessite la configuration du paramètre FEEDBACK_TRELLO_LIST_ID qui indique le code du tableau Trello à utiliser (cf URL d\'une card de la liste +.json => idList)');
            }

            let FEEDBACK_TRELLO_POSSIBLE_BUG_ID = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_POSSIBLE_BUG_ID_PARAM_NAME);
            let FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID_PARAM_NAME);
            let FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID_PARAM_NAME);
            let FEEDBACK_TRELLO_NOT_SET_ID = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_NOT_SET_ID_PARAM_NAME);
            if ((!FEEDBACK_TRELLO_POSSIBLE_BUG_ID) || (!FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID) || (!FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID) || (!FEEDBACK_TRELLO_NOT_SET_ID)) {
                throw new Error('Le module FEEDBACK nécessite la configuration des paramètres FEEDBACK_TRELLO_POSSIBLE_BUG_ID,FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID,FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID,FEEDBACK_TRELLO_NOT_SET_ID qui indiquent les codes des marqueurs Trello à utiliser (cf URL d\'une card de la liste +.json => labels:id)');
            }

            // Remplir le feedback avec toutes les infos qui sont connues côté serveur,
            feedback.user_connection_date = moment(user_session.last_load_date_unix).utc(true);
            feedback.user_id = user_session.uid;
            feedback.user_login_date = moment(user_session.creation_date_unix).utc(true);

            feedback.is_impersonated = false;
            if (ModuleAccessPolicyServer.getInstance().isLogedAs()) {

                let admin_user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getAdminLogedUserSession();
                feedback.impersonated_from_user_connection_date = moment(admin_user_session.last_load_date_unix).utc(true);
                feedback.impersonated_from_user_id = admin_user_session.uid;
                feedback.impersonated_from_user_login_date = moment(admin_user_session.creation_date_unix).utc(true);
                feedback.is_impersonated = true;
            }

            // Puis créer le feedback en base
            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(feedback);
            if ((!res) || (!res.id)) {
                throw new Error('Failed feedback creation');
            }
            feedback.id = res.id;

            // Créer le Trello associé
            let response;
            let trello_api = await ModuleTrelloAPIServer.getInstance().getTrelloAPI();
            let label_id = null;
            let trello_message = feedback.message + '\x0A' + '\x0A';

            trello_message += await this.user_infos_to_string(feedback);
            trello_message += await this.feedback_infos_to_string(feedback);

            trello_message += await this.screen_captures_to_string(feedback);
            trello_message += await this.attachments_to_string(feedback);

            trello_message += await this.routes_to_string(feedback);
            trello_message += await this.console_logs_to_string(feedback);
            trello_message += await this.api_logs_to_string(feedback);

            switch (feedback.feedback_type) {
                case FeedbackVO.FEEDBACK_TYPE_BUG:
                    label_id = FEEDBACK_TRELLO_POSSIBLE_BUG_ID;
                    break;
                case FeedbackVO.FEEDBACK_TYPE_INCIDENT:
                    label_id = FEEDBACK_TRELLO_POSSIBLE_INCIDENT_ID;
                    break;
                case FeedbackVO.FEEDBACK_TYPE_ENHANCEMENT_REQUEST:
                    label_id = FEEDBACK_TRELLO_POSSIBLE_REQUEST_ID;
                    break;
                case FeedbackVO.FEEDBACK_TYPE_NOT_SET:
                    label_id = FEEDBACK_TRELLO_NOT_SET_ID;
                    break;
            }

            // On peut pas envoyer plus de 16384 chars à l'api trello pour le message
            // Donc on limite à 15000 chars et on met tout dans un fichier dont on donne l'adresse au début du message

            let feedback_file_patch = '/files/feedbacks/feedback_' + moment().utc(true).unix() + '.txt';
            await ModuleFileServer.getInstance().makeSureThisFolderExists('./files/feedbacks/');
            await ModuleFileServer.getInstance().writeFile('.' + feedback_file_patch, trello_message);

            let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();
            let file_url = envParam.BASE_URL + feedback_file_patch;

            trello_message = ((trello_message.length > 15000) ? trello_message.substr(0, 15000) + ' ... [truncated 15000 cars]' : trello_message);
            trello_message = '[FEEDBACK FILE : ' + file_url + '](' + file_url + ')' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + trello_message;

            response = await trello_api.card.create({
                name: feedback.title,
                desc: trello_message,
                pos: 'top',
                idList: FEEDBACK_TRELLO_LIST_ID, //REQUIRED
                idLabels: [label_id],
            });

            // Faire le lien entre le feedback en base et le Trello
            feedback.trello_ref = response;
            let ires: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(feedback);
            feedback.id = ires.id;

            // Envoyer un mail pour confirmer la prise en compte du feedback
            await FeedbackConfirmationMail.getInstance().sendConfirmationEmail(feedback);

            await PushDataServerController.getInstance().notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'feedback.feedback.success', true);

            return true;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'feedback.feedback.error', true);
            return false;
        }
    }

    private async api_logs_to_string(feedback: FeedbackVO): Promise<string> {
        let FEEDBACK_TRELLO_API_LOG_LIMIT: string = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_API_LOG_LIMIT_PARAM_NAME);
        let API_LOG_LIMIT: number = FEEDBACK_TRELLO_API_LOG_LIMIT ? parseInt(FEEDBACK_TRELLO_API_LOG_LIMIT.toString()) : 100;

        let apis_log: LightWeightSendableRequestVO[] = parse(feedback.apis_log_json);
        let apis_log_message: string = '';
        API_LOG_LIMIT = API_LOG_LIMIT - apis_log.length;
        let limited: boolean = API_LOG_LIMIT < 0;

        for (let i in apis_log) {
            let api_log = apis_log[i];

            API_LOG_LIMIT++;
            if (API_LOG_LIMIT <= 0) {
                continue;
            }

            // On commence par un retour à la ligne aussi puisque sinon la liste fonctionne pas
            apis_log_message += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

            let type: string = null;
            switch (api_log.type) {
                case LightWeightSendableRequestVO.API_TYPE_GET:
                    type = 'GET';
                    break;
                case LightWeightSendableRequestVO.API_TYPE_POST:
                    type = 'POST';
                    break;
                case LightWeightSendableRequestVO.API_TYPE_POST_FOR_GET:
                    type = 'POST_FOR_GET';
                    break;
            }

            let BASE_URL: string = ConfigurationService.getInstance().getNodeConfiguration().BASE_URL;
            let url = FileHandler.getInstance().get_full_url(BASE_URL, api_log.url);
            apis_log_message += '1. [' + type + ' - ' + api_log.url + '](' + url + ')';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##APIS LOG' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += (limited ? ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ...' : '');
        res += apis_log_message;
        return res;
    }

    private async console_logs_to_string(feedback: FeedbackVO): Promise<string> {
        let FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT: string = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT_PARAM_NAME);
        let CONSOLE_LOG_LIMIT: number = FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT ? parseInt(FEEDBACK_TRELLO_CONSOLE_LOG_LIMIT.toString()) : 100;
        let limited: boolean = false;

        if (feedback.console_logs && (feedback.console_logs.length > CONSOLE_LOG_LIMIT)) {
            feedback.console_logs.splice(0, feedback.console_logs.length - CONSOLE_LOG_LIMIT);
            limited = true;
        }

        let console_logs_message: string = (feedback.console_logs && feedback.console_logs.length) ?
            ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ' + feedback.console_logs.join(ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ') :
            '';

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##CONSOLE LOGS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += (limited ? ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ...' : '');
        res += console_logs_message;
        return res;
    }

    private async routes_to_string(feedback: FeedbackVO): Promise<string> {
        let FEEDBACK_TRELLO_ROUTE_LIMIT: string = await ModuleParams.getInstance().getParamValue(ModuleFeedbackServer.FEEDBACK_TRELLO_ROUTE_LIMIT_PARAM_NAME);
        let ROUTE_LIMIT: number = FEEDBACK_TRELLO_ROUTE_LIMIT ? parseInt(FEEDBACK_TRELLO_ROUTE_LIMIT.toString()) : 100;
        let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        let routes_message: string = '';
        ROUTE_LIMIT = ROUTE_LIMIT - feedback.routes_fullpaths.length;
        let limited: boolean = ROUTE_LIMIT < 0;

        for (let i in feedback.routes_fullpaths) {
            let route: string = feedback.routes_fullpaths[i];

            ROUTE_LIMIT++;
            if (ROUTE_LIMIT <= 0) {
                continue;
            }

            // On commence par un retour à la ligne aussi puisque sinon la liste fonctionne pas
            routes_message += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
            routes_message += '1. [' + route + '](' + envParam.BASE_URL + '#' + route + ')';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##ROUTES' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += (limited ? ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '1. ...' : '');
        res += routes_message;
        return res;
    }

    private async user_infos_to_string(feedback: FeedbackVO): Promise<string> {
        let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##USER INFOS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [' + feedback.name + ' | UID ' + feedback.user_id + '](' +
            envParam.BASE_URL + 'admin/#' + CRUDHandler.getUpdateLink(UserVO.API_TYPE_ID, feedback.user_id) + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Connection : ' + ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(feedback.user_connection_date);
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Login : ' + ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(feedback.user_login_date);
        if (feedback.is_impersonated) {
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Impersonated from : [Admin user | UID ' + feedback.impersonated_from_user_id + '](' +
                envParam.BASE_URL + 'admin/#' + CRUDHandler.getUpdateLink(UserVO.API_TYPE_ID, feedback.impersonated_from_user_id) + ')';
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Impersonated from : Connection : ' + ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(feedback.impersonated_from_user_connection_date);
            res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Impersonated from : Login : ' + ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(feedback.impersonated_from_user_login_date);
        }
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [' + feedback.email + '](mailto:' + feedback.email + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [' + feedback.phone + '](tel:' + feedback.phone + ')';
        return res;
    }

    private async feedback_infos_to_string(feedback: FeedbackVO): Promise<string> {
        let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

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

        let start_url = envParam.BASE_URL + '#' + feedback.feedback_start_url;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Start URL : [' + start_url + '](' + start_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Start date : ' + ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(feedback.feedback_start_date);
        let end_url = envParam.BASE_URL + '#' + feedback.feedback_end_url;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Submission URL : [' + end_url + '](' + end_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Submission date : ' + ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(feedback.feedback_end_date);
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- Submission type : ' + type;
        return res;
    }

    private async attachments_to_string(feedback: FeedbackVO): Promise<string> {
        let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        if (!feedback.file_attachment_1_id) {
            return '';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##ATTACHMENTS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

        let file: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, feedback.file_attachment_1_id);
        if (!file) {
            return '';
        }
        let file_url = envParam.BASE_URL + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [FILE 1 : ' + file_url + '](' + file_url + ')';
        if (!feedback.file_attachment_2_id) {
            return res;
        }

        file = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, feedback.file_attachment_2_id);
        if (!file) {
            return res;
        }
        file_url = envParam.BASE_URL + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [FILE 2 : ' + file_url + '](' + file_url + ')';
        if (!feedback.file_attachment_3_id) {
            return res;
        }

        file = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, feedback.file_attachment_3_id);
        if (!file) {
            return res;
        }
        file_url = envParam.BASE_URL + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [FILE 3 : ' + file_url + '](' + file_url + ')';

        return res;
    }

    private async screen_captures_to_string(feedback: FeedbackVO): Promise<string> {
        let envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        if (!feedback.screen_capture_1_id) {
            return '';
        }

        let res: string = ModuleFeedbackServer.TRELLO_SECTION_SEPARATOR;
        res += '##SCREENSHOTS' + ModuleFeedbackServer.TRELLO_LINE_SEPARATOR;

        let file: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, feedback.screen_capture_1_id);
        if (!file) {
            return '';
        }
        let file_url = envParam.BASE_URL + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [SCREENSHOT 1 : ' + file_url + '](' + file_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '![SCREENSHOT 1 : ' + file_url + '](' + file_url + ')';
        if (!feedback.screen_capture_2_id) {
            return res;
        }

        file = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, feedback.screen_capture_2_id);
        if (!file) {
            return res;
        }
        file_url = envParam.BASE_URL + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [SCREENSHOT 2 : ' + file_url + '](' + file_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '![SCREENSHOT 2 : ' + file_url + '](' + file_url + ')';
        if (!feedback.screen_capture_3_id) {
            return res;
        }

        file = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, feedback.screen_capture_3_id);
        if (!file) {
            return res;
        }
        file_url = envParam.BASE_URL + file.path;
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '- [SCREENSHOT 3 : ' + file_url + '](' + file_url + ')';
        res += ModuleFeedbackServer.TRELLO_LINE_SEPARATOR + '![SCREENSHOT 3 : ' + file_url + '](' + file_url + ')';

        return res;
    }
}
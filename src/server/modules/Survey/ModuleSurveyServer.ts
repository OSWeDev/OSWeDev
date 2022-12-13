
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleSurvey from '../../../shared/modules/Survey/ModuleSurvey';
import SurveyVO from '../../../shared/modules/Survey/vos/SurveyVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IServerUserSession from '../../IServerUserSession';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
const { parse } = require('flatted/cjs');

export default class ModuleSurveyServer extends ModuleServerBase {



    public static getInstance() {
        if (!ModuleSurveyServer.instance) {
            ModuleSurveyServer.instance = new ModuleSurveyServer();
        }
        return ModuleSurveyServer.instance;
    }

    private static instance: ModuleSurveyServer = null;

    private constructor() {
        super(ModuleSurvey.getInstance().name);
    }

    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSurvey.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Surveys'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSurvey.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des surveys'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleSurvey.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            'fr-fr': 'Accès front - Surveys'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async configure() {

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Un incident technique - un comportement inhabituel de la solution - , qui induit une indisponibilité partielle ou totale du service' },
            'survey.type.incident.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Une erreur logicielle reproductible par rapport au fonctionnement attendu au sein de l\'application' },
            'survey.type.bug.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Une demande d\'évolution ou une suggestion pour améliorer la solution et répondre mieux à votre besoin' },
            'survey.type.request.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Tout autre message adressé aux équipes techniques, relatif à une page / un fonctionnement de l\'application' },
            'survey.type.not_set.tooltip.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Fermer' },
            'survey.hide.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Vider' },
            'survey.clear.___LABEL___'));

        //Header
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Faites-nous part de vos suggestions, informez-nous d\'un incident ou d\'un bug, ou laissez-nous simplement un message' },
            'survey.header.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Message' },
            'survey.message.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Envoyer' },
            'survey.submit.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Bug' },
            'survey.type.bug.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Incident' },
            'survey.type.incident.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Type de message' },
            'survey.type.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Autre' },
            'survey.type.not_set.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Demande d\'évolution ou proposition d\'amélioration' },
            'survey.type.request.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Votre retour d\'expérience a bien été transmis. Merci.' },
            'survey.survey.success'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Erreur lors de la transmission. Merci de contacter l\'équipe projet pour les en informer.' },
            'survey.survey.error'));


        //SurveyComponent - Enquête de satisfaction
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Votre avis', 'es-es': 'Su opinión' },
            'survey.btn.title.___LABEL___')
        );
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleSurvey.APINAME_survey, this.survey.bind(this));
    }

    /**
     * Ce module nécessite le param FEEDBACK_TRELLO_LIST_ID
     *  Pour trouver le idList => https://customer.io/actions/trello/
     */
    private async survey(survey: SurveyVO): Promise<boolean> {

        if (!survey) {
            return false;
        }

        let uid = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
        let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');

        try {

            let user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getUserSession();
            if (!user_session) {
                return false;
            }


            // Remplir le survey avec toutes les infos qui sont connues côté serveur, le user_id est ici !
            survey.user_id = user_session.uid;

            if (ModuleAccessPolicyServer.getInstance().isLogedAs()) {

                let admin_user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getAdminLogedUserSession();

            }

            // Puis créer le survey en base
            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(survey);
            if ((!res) || (!res.id)) {
                throw new Error('Failed survey creation');
            }
            survey.id = res.id;


            await PushDataServerController.getInstance().notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'survey.survey.success', true);

            return true;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'survey.survey.error', true);
            return false;
        }
    }






}

import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleSurvey from '../../../shared/modules/Survey/ModuleSurvey';
import SurveyVO from '../../../shared/modules/Survey/vos/SurveyVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
const { parse } = require('flatted/cjs');

export default class ModuleSurveyServer extends ModuleServerBase {



    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSurveyServer.instance) {
            ModuleSurveyServer.instance = new ModuleSurveyServer();
        }
        return ModuleSurveyServer.instance;
    }

    private static instance: ModuleSurveyServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSurvey.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSurvey.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Surveys'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSurvey.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des surveys'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleSurvey.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès front - Surveys'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Fermer' },
            'survey.hide.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Enquête de satisfaction' },
            'survey.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Votre avis compte' },
            'survey.header.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Appreciez vous la solution ?' },
            'survey.header_2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Faites nous un retour !' },
            'survey.header_3.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Votre avis' },
            'survey.rating.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Message' },
            'survey.message.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Des remarques ?' },
            'survey.message.remarque.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Envoyer' },
            'survey.submit.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Sans opinion' },
            'survey.SURVEY_TYPE.NO_OPINION'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Mauvais' },
            'survey.SURVEY_TYPE.BAD'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Moyen' },
            'survey.SURVEY_TYPE.MEDIOCRE'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Bien' },
            'survey.SURVEY_TYPE.GOOD'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Très bien' },
            'survey.SURVEY_TYPE.VERY_GOOD'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Avis obligatoire' },
            'survey.needs_opinion.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Votre retour d\'expérience a bien été transmis. Merci.' },
            'survey.survey.success'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Erreur lors de la transmission. Merci de contacter l\'équipe projet pour les en informer.' },
            'survey.survey.error'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Une erreur est survenue. Veuillez contacter l\'équipe technique par mail pour faire votre commentaire.' },
            'survey.error_sending_feedback.___LABEL___'));


        //SurveyComponent - Enquête de satisfaction
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Votre avis', 'es-es': 'Su opinión' },
            'survey.btn.title.___LABEL___')
        );
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleSurvey.APINAME_survey, this.survey.bind(this));
    }

    /**
     * Ce module nécessite le param FEEDBACK_TRELLO_LIST_ID
     *  Pour trouver le idList => https://customer.io/actions/trello/
     */
    private async survey(survey: SurveyVO): Promise<boolean> {

        if (!survey) {
            return false;
        }

        const uid = ModuleAccessPolicyServer.getLoggedUserId();
        const CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

        try {

            const user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getUserSession();
            if (!user_session) {
                return false;
            }


            // Remplir le survey avec toutes les infos qui sont connues côté serveur, le user_id est ici !
            survey.user_id = user_session.uid;

            if (ModuleAccessPolicyServer.getInstance().isLogedAs()) {

                const admin_user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getAdminLogedUserSession();

            }

            // Puis créer le survey en base
            const res: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(survey);
            if ((!res) || (!res.id)) {
                throw new Error('Failed survey creation');
            }
            survey.id = res.id;


            await PushDataServerController.notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'survey.survey.success', true);

            return true;
        } catch (error) {
            ConsoleHandler.error(error);
            await PushDataServerController.notifySimpleERROR(uid, CLIENT_TAB_ID, 'survey.survey.error', true);
            return false;
        }
    }






}
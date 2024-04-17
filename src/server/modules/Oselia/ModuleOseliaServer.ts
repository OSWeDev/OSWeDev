import { Request, Response } from 'express';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaUserReferrerVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerVO';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ExternalAPIServerController from '../API/ExternalAPIServerController';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import PasswordInitialisation from '../AccessPolicy/PasswordInitialisation/PasswordInitialisation';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { Assistant } from 'openai/resources/beta/assistants/assistants';
import { Thread } from 'openai/resources/beta/threads/threads';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';

export default class ModuleOseliaServer extends ModuleServerBase {

    private static instance: ModuleOseliaServer = null;

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

        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_get_referrer_name, this.get_referrer_name.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_accept_link, this.accept_link.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_refuse_link, this.refuse_link.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

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

        let POLICY_GET_REFERRER_NAME: AccessPolicyVO = new AccessPolicyVO();
        POLICY_GET_REFERRER_NAME.group_id = group.id;
        POLICY_GET_REFERRER_NAME.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_GET_REFERRER_NAME.translatable_name = ModuleOselia.POLICY_GET_REFERRER_NAME;
        POLICY_GET_REFERRER_NAME = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_GET_REFERRER_NAME, DefaultTranslationVO.create_new({
            'fr-fr': 'Demander le nom du referrer par son code'
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
    }

    private async open_oselia_db(
        referrer_code: string,
        referrer_user_uid: string,
        openai_thread_id: string,
        openai_assistant_id: string,
        req: Request,
        res: Response
    ): Promise<void> {
        /**
         * On commence par checker le referrer
         * Puis le user lié au referrer, et le fait que la liaison soit validée, sinon on renvoie vers la demande de confirmation du lien
         */
        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_code, referrer_code)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            ConsoleHandler.error('Referrer not found:' + referrer_code);
            res.redirect('/#/oselia_referrer_not_found'); // FIXME TODO créer une page dédiée
            return;
        }

        const user_referrer: OseliaUserReferrerVO = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaUserReferrerVO>().referrer_user_uid, referrer_user_uid)
            .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();
        if (!user_referrer) {
            ConsoleHandler.error('User not linked to referrer_user_uid:' + referrer_user_uid);

            await ExternalAPIServerController.call_external_api(
                'post',
                referrer.trigger_hook_open_oselia_db_reject_url,
                ['User not linked to referrer_user_uid:' + referrer_user_uid],
                referrer.triggers_hook_external_api_authentication_id
            );

            res.redirect(referrer.failed_open_oselia_db_target_url);
            return;
        }

        const user = await query(UserVO.API_TYPE_ID)
            .filter_by_id(user_referrer.id, OseliaUserReferrerVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<UserVO>();
        if (user.archived || user.blocked || user.invalidated) {
            ConsoleHandler.error('User not valid:referrer_user_uid:' + referrer_user_uid + ':uid:' + user.id);

            await ExternalAPIServerController.call_external_api(
                'post',
                referrer.trigger_hook_open_oselia_db_reject_url,
                ['User not valid (archived, blocked or invalidated):' + referrer_user_uid],
                referrer.triggers_hook_external_api_authentication_id
            );

            res.redirect(referrer.failed_open_oselia_db_target_url);
            return;
        }

        if (!user_referrer.user_validated) {
            // L'utilisateur est lié, tout est ok, mais il n'a pas encore validé la liaison. On l'envoie sur une page de validation
            res.redirect('/#/oselia_referrer_activation/' + referrer_code + '/' + referrer_user_uid + '/' + (openai_thread_id ? openai_thread_id : '') + '/' + (openai_assistant_id ? openai_assistant_id : '')); //TODO FIXME créer la page dédiée
            return;
        }

        /**
         * On récupère le thread : on le crée si on reçoit null, et dans tous les cas on crée et on récupère le thread depuis OpenAI si on ne le connait pas encore
         * Si un assistant est passé en param, on le force dans le thread
         */
        const assistant: { assistant_gpt: Assistant; assistant_vo: GPTAssistantAPIAssistantVO } =
            openai_assistant_id ? await GPTAssistantAPIServerController.get_assistant(openai_assistant_id) : null;
        const thread: { thread_gpt: Thread; thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread(
            user.id,
            openai_thread_id,
            assistant && assistant.assistant_vo ? assistant.assistant_vo.id : null,
        );

        /**
         * Si le referrer n'est pas lié au thread, on le lie
         * Si un referrer est déjà lié, et que ce n'est pas celui-ci, on renvoie une erreur
         */
        if (referrer.id != thread.thread_vo.referrer_id) {
            if (thread.thread_vo.referrer_id) {
                ConsoleHandler.error('Thread already linked to another referrer:' + referrer.id + ':' + thread.thread_vo.referrer_id);

                await ExternalAPIServerController.call_external_api(
                    'post',
                    referrer.trigger_hook_open_oselia_db_reject_url,
                    ['Thread already linked to another referrer:' + openai_thread_id],
                    referrer.triggers_hook_external_api_authentication_id
                );

                res.redirect(referrer.failed_open_oselia_db_target_url);
                return;
            }

            thread.thread_vo.referrer_id = referrer.id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread.thread_vo);
        }

        /**
         * Enfin, on redirige vers la page de discussion avec le paramètre qui va bien pour init le thread
         */
        res.redirect('/#/oselia/' + thread.thread_vo.id);
    }

    /**
     * Request to connect a user to a referrer
     * @param referrer_code referrer code
     * @param user_email user email
     * @param referrer_user_uid referrer user uid
     * @returns error string if any, null otherwise
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
                return 'Referrer not found:' + referrer_code;
            }

            // Check if the user exists
            let user = await query(UserVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<UserVO>().email, user_email, UserVO.API_TYPE_ID, true)
                .exec_as_server()
                .select_vo<UserVO>();

            if (!user) {

                const login = user_email;
                const test_existing_login = await query(UserVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<UserVO>().name, login)
                    .exec_as_server()
                    .select_vo<UserVO>();

                if (test_existing_login) {
                    ConsoleHandler.error('User already exists with login:' + login);
                    return 'User already exists with login:' + login;
                }

                user = new UserVO();
                user.invalidated = false;
                user.name = login;
                user.email = user_email;
                user.lang_id = referrer.new_user_default_lang_id;

                try {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user);
                } catch (error) {
                    ConsoleHandler.error('Error while creating user:' + error);
                    return 'Error while creating user:' + error;
                }

                await PasswordInitialisation.getInstance().begininitpwd_user(user);
            }

            // Check if the link already exists
            let link = await query(OseliaUserReferrerVO.API_TYPE_ID)
                .filter_by_id(user.id, UserVO.API_TYPE_ID)
                .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
                .exec_as_server()
                .select_vo<OseliaUserReferrerVO>();

            // Si le lien existe mais le referrer_user_uid est différent, on signale une erreur
            if (link && (link.referrer_user_uid != referrer_user_uid)) {
                ConsoleHandler.error('Link already exists with different referrer_user_uid:yours:' + referrer_user_uid + ', existing:' + link.referrer_user_uid);
                return 'Link already exists with different referrer_user_uid:yours:' + referrer_user_uid + ', existing:' + link.referrer_user_uid;
            }

            if (!link) {
                link = new OseliaUserReferrerVO();
                link.actif = true;
                link.referrer_id = referrer.id;
                link.user_id = user.id;
                link.user_validated = false;
                link.referrer_user_uid = referrer_user_uid;

                try {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(link);
                } catch (error) {
                    ConsoleHandler.error('Error while creating link:' + error);
                    return 'Error while creating link:' + error;
                }
            }
        } catch (error) {
            ConsoleHandler.error('Error while requesting connection:' + error);
            return 'Error while requesting connection:' + error;
        }

        return null;
    }

    private async get_referrer_name(referrer_code: string): Promise<string> {
        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_code, referrer_code)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        return referrer ? referrer.name : null;
    }

    private async accept_link(referrer_code: string): Promise<void> {

        const uid = await ModuleAccessPolicyServer.getLoggedUserId();
        if (!uid) {
            ConsoleHandler.error('No user logged');
            return;
        }

        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_code, referrer_code)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            ConsoleHandler.error('Referrer not found:' + referrer_code);
            return;
        }

        const user_referrer = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
            .filter_by_id(uid, UserVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();

        if (!user_referrer) {
            ConsoleHandler.error('User referrer not found:' + referrer_code + ':' + uid);
            return;
        }

        if (user_referrer.user_validated) {
            ConsoleHandler.warn('User referrer already validated:' + referrer_code + ':' + uid);
            return;
        }

        user_referrer.user_validated = true;

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user_referrer);
    }

    private async refuse_link(referrer_code: string): Promise<void> {

        const uid = await ModuleAccessPolicyServer.getLoggedUserId();
        if (!uid) {
            ConsoleHandler.error('No user logged');
            return;
        }

        const referrer = await query(OseliaReferrerVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaReferrerVO>().referrer_code, referrer_code)
            .exec_as_server()
            .select_vo<OseliaReferrerVO>();

        if (!referrer) {
            ConsoleHandler.error('Referrer not found:' + referrer_code);
            return;
        }

        const user_referrer = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_id(referrer.id, OseliaReferrerVO.API_TYPE_ID)
            .filter_by_id(uid, UserVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();

        if (!user_referrer) {
            ConsoleHandler.error('User referrer not found:' + referrer_code + ':' + uid);
            return;
        }

        if (user_referrer.user_validated) {
            ConsoleHandler.warn('User referrer already validated:' + referrer_code + ':' + uid + ' - deleting beacause of refusal');
        }

        await ModuleDAOServer.getInstance().deleteVOs_as_server([user_referrer]);
    }
}
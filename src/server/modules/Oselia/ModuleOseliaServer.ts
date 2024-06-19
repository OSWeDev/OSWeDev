import axios from 'axios';
import { Request, Response } from 'express';
import { createWriteStream } from 'fs';
import { ImagesResponse } from 'openai/resources';
import { Thread } from 'openai/resources/beta/threads/threads';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ActionURLCRVO from '../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIRunVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIRunVO';
import GPTAssistantAPIThreadMessageContentImageFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentImageFileVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';
import OseliaUserReferrerOTTVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerOTTVO';
import OseliaUserReferrerVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ExternalAPIServerController from '../API/ExternalAPIServerController';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import PasswordInitialisation from '../AccessPolicy/PasswordInitialisation/PasswordInitialisation';
import ActionURLServerTools from '../ActionURL/ActionURLServerTools';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import ModuleGPTServer from '../GPT/ModuleGPTServer';
import GPTAssistantAPIServerSyncAssistantsController from '../GPT/sync/GPTAssistantAPIServerSyncAssistantsController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import OseliaServerController from './OseliaServerController';
import FileServerController from '../File/FileServerController';

export default class ModuleOseliaServer extends ModuleServerBase {

    private static instance: ModuleOseliaServer = null;

    private static referers_triggers_hooks_condition_UID_cache: { [trigger_type_UID: string]: { [condition_UID: string]: [(params: unknown, exec_as_server?: boolean) => Promise<unknown>] } } = {};
    private static TASK_NAME_clear_reapply_referrers_triggers_OnThisThread: string = 'ModuleOseliaServer.clear_reapply_referrers_triggers_OnThisThread';

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
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_account_waiting_link_status, this.account_waiting_link_status.bind(this));
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

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Ajotuer un commentaire' },
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

        ForkedTasksController.register_task(ModuleOseliaServer.TASK_NAME_clear_reapply_referrers_triggers_OnThisThread, this.clear_reapply_referrers_triggers_OnThisThread.bind(this));

        // AJOUTER les triggers existants pour les referrer + les triggers pour ajouter/supprimer les triggers en fonction de la mise à jour des referrers
        // Le plus simple est probablement de stocker un tableau des triggers qui sont mis en place par ce système, et pour toute modif et au démarrage de l'appli de clear / reapply
        await this.clear_reapply_referrers_triggers_OnThisThread();

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        postCreateTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.clear_reapply_referrers_triggers_OnAllThreads);
        postUpdateTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.clear_reapply_referrers_triggers_OnAllThreads);
        postDeleteTrigger.registerHandler(OseliaReferrerVO.API_TYPE_ID, this, this.clear_reapply_referrers_triggers_OnAllThreads);

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
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_thread_message);

                    const image_content = new GPTAssistantAPIThreadMessageContentVO();
                    image_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
                    image_content.thread_message_id = new_thread_message.id;
                    image_content.content_type_image_file = new GPTAssistantAPIThreadMessageContentImageFileVO();
                    image_content.content_type_image_file.file_id = new_file_vo.id;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(image_content);

                    if (ConfigurationService.node_configuration.debug_openai_generate_image) {
                        ConsoleHandler.log('ModuleOseliaServer:generate_image:created message:' + new_thread_message.id + ' with content:' + image_content.id);
                    }
                }
            }

            return n > 1 ? 'Images générées avec succès' : 'Image générée avec succès';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:generate_image:Error while generating image:" + error);
            return 'Erreur lors de la génération de l\'image:' + error;
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

    public async open_oselia_db_from_action_url(action_url: ActionURLVO, uid: number, req: Request, res: Response): Promise<ActionURLCRVO> {

        if (!action_url.params_json) {
            ConsoleHandler.error('Impossible de trouver la discussion Oselia pour l\'action URL: ' + action_url.action_name);
            return ActionURLServerTools.create_error_cr(action_url, 'Impossible de trouver la discussion Oselia');
        }

        res.redirect('/f/oselia/' + action_url.params_json);
        return ActionURLServerTools.create_info_cr(action_url, 'Redirection vers la discussion avec Osélia');
    }


    private async open_oselia_db(
        referrer_user_ott: string,
        openai_thread_id: string,
        openai_assistant_id: string,
        req: Request,
        res: Response
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
            res.redirect('/f/oselia_referrer_not_found');
            return;
        }

        const user_referrer: OseliaUserReferrerVO = await query(OseliaUserReferrerVO.API_TYPE_ID)
            .filter_by_id(user_referrer_ott.user_referrer_id)
            .exec_as_server()
            .select_vo<OseliaUserReferrerVO>();
        if (!user_referrer) {
            ConsoleHandler.error('Referrer not found:user_referrer_id:' + user_referrer_ott.user_referrer_id);
            res.redirect('/f/oselia_referrer_not_found');
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
            res.redirect('/f/oselia_referrer_not_found');
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

            res.redirect(referrer.failed_open_oselia_db_target_url);
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

            res.redirect('/f/oselia_referrer_activation/' + referrer_user_ott + '/' + openai_thread_id + '/' + openai_assistant_id); //TODO FIXME créer la page dédiée
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

            res.redirect(referrer.failed_open_oselia_db_target_url);
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
        res.redirect('/f/oselia/' + thread.thread_vo.id);
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
                    return null;
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
                link.user_validated = false;
                link.referrer_user_uid = referrer_user_uid;

                try {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(link);
                } catch (error) {
                    ConsoleHandler.error('Error while creating link:' + error);
                    return null;
                }
            }

            const new_ott = new OseliaUserReferrerOTTVO();

            new_ott.user_referrer_id = link.id;
            new_ott.ott = OseliaUserReferrerOTTVO.generateSecretToken(32);
            new_ott.expires = Date.now() + (1000 * 60 * 60 * 24); // 1 hour

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_ott);

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

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user_referrer);
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

        await ModuleDAOServer.getInstance().deleteVOs_as_server([user_referrer]);
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
        is_secured: boolean = true,
        secured_access_name: string = ModuleOselia.POLICY_GENERATED_IMAGES_FO_ACCESS,
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
                            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file_vo);

                            // On push l'image à GPT

                            resolve(file_vo);
                        })
                        .on('error', (err) => {
                            ConsoleHandler.error('ModuleOseliaServer:generate_image:Error while saving the image:', err);
                            reject(err);
                        })
                }).catch(err => {
                    ConsoleHandler.error('ModuleOseliaServer:generate_image:Erreur lors du téléchargement de l\'image :', err);
                    reject(err);
                });
            } catch (error) {
                ConsoleHandler.error('ModuleOseliaServer:generate_image:Erreur lors du téléchargement de l\'image:', error);
                reject(error);
            }
        });
    }
}
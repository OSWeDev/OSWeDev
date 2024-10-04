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
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ActionURLCRVO from '../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
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
import OseliaController from '../../../shared/modules/Oselia/OseliaController';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaThreadReferrerVO from '../../../shared/modules/Oselia/vos/OseliaThreadReferrerVO';
import OseliaUserReferrerOTTVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerOTTVO';
import OseliaUserReferrerVO from '../../../shared/modules/Oselia/vos/OseliaUserReferrerVO';
import TeamsWebhookContentActionOpenUrlVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ExternalAPIServerController from '../API/ExternalAPIServerController';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import PasswordInitialisation from '../AccessPolicy/PasswordInitialisation/PasswordInitialisation';
import ActionURLServerTools from '../ActionURL/ActionURLServerTools';
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
import PushDataServerController from '../PushData/PushDataServerController';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import OseliaRunServerController from './OseliaRunServerController';
import OseliaServerController from './OseliaServerController';
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
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_set_screen_track, this.set_screen_track.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleOselia.APINAME_get_screen_track, this.get_screen_track.bind(this));
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

        postCreateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.reset_has_no_run_ready_to_handle_on_thread);
        postUpdateTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.reset_has_no_run_ready_to_handle_on_thread_on_u);
        postDeleteTrigger.registerHandler(OseliaRunVO.API_TYPE_ID, this, this.reset_has_no_run_ready_to_handle_on_thread);

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
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_thread_message);

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
            const base64Image = fs.readFileSync(image_path, { encoding: 'base64' });

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
                    const messages_contents: string = await this.get_thread_text_content(thread_vo.id);

                    const new_thread = (await GPTAssistantAPIServerController.get_thread(null, null, assistant.id)).thread_vo;

                    const file_name = 'oselia_' + new_thread.gpt_thread_id + '.txt';
                    const text_file = new FileVO();
                    text_file.path = ModuleFile.FILES_ROOT + 'upload/' + file_name;
                    text_file.id = (await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(text_file)).id;

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

    public async open_oselia_db_from_action_url(action_url: ActionURLVO, uid: number, req: Request, res: Response): Promise<ActionURLCRVO> {

        if (!action_url.params_json) {
            ConsoleHandler.error('Impossible de trouver la discussion Oselia pour l\'action URL: ' + action_url.action_name);
            return ActionURLServerTools.create_error_cr(action_url, 'Impossible de trouver la discussion Oselia');
        }

        res.redirect('/f/oselia/' + action_url.params_json);
        return ActionURLServerTools.create_info_cr(action_url, 'Redirection vers la discussion avec Osélia');
    }

    /**
     * Fonction pour l'assistant qui permet de valider un run oselia
     * @param thread_vo le thread qui gère la discussion avec l'assistant
     */
    public async validate_oselia_run(
        thread_vo: GPTAssistantAPIThreadVO,
    ) {
        if ((!thread_vo) || (!thread_vo.last_gpt_run_id)) {
            ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le thread ou le dernier run gpt:' + JSON.stringify(thread_vo));
            return;
        }

        const gpt_run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_id(thread_vo.last_gpt_run_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();

        if (!gpt_run) {
            ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le run gpt:' + thread_vo.last_gpt_run_id);
            return;
        }

        const oselia_run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);
        if (!oselia_run) {
            ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le run oselia associé au run gpt:' + gpt_run.id);
            return;
        }

        await OseliaRunServerController.update_oselia_run_state(oselia_run, OseliaRunVO.STATE_VALIDATION_ENDED);
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
    ) {
        if ((!thread_vo) || (!thread_vo.last_gpt_run_id)) {
            ConsoleHandler.error('refuse_oselia_run:Impossible de trouver le thread ou le dernier run gpt:' + JSON.stringify(thread_vo));
            return;
        }

        const gpt_run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
            .filter_by_id(thread_vo.last_gpt_run_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIRunVO>();

        if (!gpt_run) {
            ConsoleHandler.error('refuse_oselia_run:Impossible de trouver le run gpt:' + thread_vo.last_gpt_run_id);
            return;
        }

        const oselia_run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);
        if (!oselia_run) {
            ConsoleHandler.error('refuse_oselia_run:Impossible de trouver le run oselia associé au run gpt:' + gpt_run.id);
            return;
        }

        oselia_run.rerun_new_initial_prompt = rerun_new_initial_prompt;
        oselia_run.rerun_reason = rerun_reason;
        oselia_run.rerun_name = rerun_name;
        await OseliaRunServerController.update_oselia_run_state(oselia_run, OseliaRunVO.STATE_NEEDS_RERUN);
    }

    /**
     * La méthode qui devient une fonction pour l'assistant et qui permet de définir les tâches à venir
     * @param thread_vo le thread qui gère la discussion avec l'assistant
     * @param name le nom de la tâche
     * @param prompt le prompt de la tâche
     * @param weight le poids de la tâche - pour l'ordre d'exécution
     * @param use_validator si la tâche doit être validée automatiquement - par défaut non pour le moment
     * @param hide_outputs si les sorties doivent être cachées - par défaut non pour le moment
     */
    public async append_new_child_run_step(
        thread_vo: GPTAssistantAPIThreadVO,
        name: string,
        prompt: string,
        weight: number,
        use_validator: boolean,
        hide_outputs: boolean,
    ): Promise<string> {

        try {

            if ((!thread_vo) || (!thread_vo.last_gpt_run_id)) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le thread ou le dernier run gpt:' + JSON.stringify(thread_vo));
                return;
            }

            const gpt_run = await query(GPTAssistantAPIRunVO.API_TYPE_ID)
                .filter_by_id(thread_vo.last_gpt_run_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIRunVO>();

            if (!gpt_run) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le run gpt:' + thread_vo.last_gpt_run_id);
                return;
            }

            const oselia_run = await OseliaRunServerController.get_oselia_run_from_grp_run_id(gpt_run.id);
            if (!oselia_run) {
                ConsoleHandler.error('append_new_child_run_step:Impossible de trouver le run oselia associé au run gpt:' + gpt_run.id);
                return;
            }

            const new_run_step = new OseliaRunVO();

            // TODO FIXME : on peut envisager par la suite de changer d'assistant pour les sous-étapes. Cela dit on
            //  aura peut-etre surtout une autre fonction qui défini un run à par entière, issue du realtime, et qui
            //  lui se demandera quel assistant est adapté
            new_run_step.assistant_id = gpt_run.assistant_id;

            new_run_step.thread_id = thread_vo.id;
            new_run_step.parent_run_id = oselia_run.id;
            new_run_step.childrens_are_multithreaded = false; // On ne propose pas de créer un split pour le moment donc ce param est inutile.
            new_run_step.file_id_ranges = oselia_run.file_id_ranges;
            new_run_step.hide_outputs = hide_outputs;
            new_run_step.hide_prompt = true;
            new_run_step.initial_content_text = prompt;
            new_run_step.initial_prompt_id = null;
            new_run_step.initial_prompt_parameters = null;
            new_run_step.name = name;
            new_run_step.parent_run_id = oselia_run.id;
            new_run_step.start_date = Dates.now();
            new_run_step.state = OseliaRunVO.STATE_TODO;
            new_run_step.thread_title = null;
            new_run_step.use_splitter = false;
            new_run_step.use_validator = use_validator;
            new_run_step.user_id = oselia_run.user_id;
            new_run_step.weight = weight;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_run_step);

            return 'OK - Tâche ajoutée';
        } catch (error) {
            ConsoleHandler.error("ModuleOseliaServer:append_new_child_run_step:Error while appending new child run step:" + error);
            return "Erreur lors de l'ajout de la tâche:" + error;
        }
    }

    private async set_screen_track(track: MediaStreamTrack): Promise<void> {
        ModuleOseliaServer.screen_track = track;
    }

    private async get_screen_track() {
        return ModuleOseliaServer.screen_track;
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
                link.user_validated = is_internal_behaviour;
                link.referrer_user_uid = referrer_user_uid;

                try {
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(link);
                } catch (error) {
                    ConsoleHandler.error('Error while creating link:' + error);
                    return null;
                }
            }

            if ((!link.user_validated) && is_internal_behaviour) {
                link.user_validated = true;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(link);
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
                            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file_vo);

                            // On push l'image à GPT

                            resolve(file_vo);
                        })
                        .on('error', (err) => {
                            ConsoleHandler.error('ModuleOseliaServer:generate_image:Error while saving the image:', err);
                            reject(err);
                        });
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

    private async init_api_key_from_mdp_preu(vos: DAOUpdateVOHolder<ExternalAPIAuthentificationVO>): Promise<boolean> {
        return await this.init_api_key_from_mdp(vos.post_update_vo);
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

        return await this.link_user_to_oselia_referrer_obj(
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
            .using(GPTAssistantAPIThreadMessageVO.API_TYPE_ID)
            .using(GPTAssistantAPIThreadVO.API_TYPE_ID)
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
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread);
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
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread);
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
                await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(current_level_next_runs);

                run.state = OseliaRunVO.STATE_DONE;

                const rerun = new OseliaRunVO();
                rerun.assistant_id = run.assistant_id;
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
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(rerun);
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
                run.state = OseliaRunVO.STATE_WAITING_SPLITS_END; // on a pas vraiment besoin du STATE_SPLIT_ENDED, on passe en STATE_WAITING_SPLITS_END directement (et donc les 2 dates)
                break;
            case OseliaRunVO.STATE_RUNNING:
                run.state = OseliaRunVO.STATE_RUN_ENDED;
                run.run_end_date = Dates.now();
                break;
            case OseliaRunVO.STATE_VALIDATING:

                // Si on arrive ici, c'est que le gpt_run de validation s'est terminé SANS validation, donc a priori on a un souci à résoudre,
                //  et pour autant, il n'y a pas eu de relance automatique du prompt avec correctif
                //  je sais pas exactement ce que ça veut dire pour le moment, on va en faire un échec, une erreur de validation, et on verra si ça prend du sens par la suite
                run.error_msg = 'Validation GPT Run ended without validation or rerun. This is unexpected.';
                await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                break;
            default:
                needs_update = false;
                // throw new Error('update_oselia_run_step_on_u_gpt_run:Unexpected run state:' + run.state + ':' + run.id);
                break;
        }

        if (needs_update) {
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(run);
        }
    }

    private async update_parent_oselia_run_step_on_u_oselia_run(vo_holder: DAOUpdateVOHolder<OseliaRunVO>) {
        const run_vo = vo_holder.post_update_vo;

        if (!run_vo) {
            return;
        }

        // Pas de parent, on ne fait rien
        if (!run_vo.parent_id) {
            return;
        }

        // Si on a pas terminé ce run, on ne fait rien
        if (run_vo.state != OseliaRunVO.STATE_RUN_ENDED) {
            return;
        }

        const parent_run = await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_id(run_vo.parent_id)
            .exec_as_server()
            .select_vo<OseliaRunVO>();

        if (!parent_run) {
            return;
        }

        // Si tous les runs enfants sont terminés, on peut passer le parent en terminé
        const children_runs = await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_id(parent_run.id, OseliaRunVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<OseliaRunVO>();

        let all_children_ended = true;
        for (const i in children_runs) {
            if (children_runs[i].state != OseliaRunVO.STATE_RUN_ENDED) {
                all_children_ended = false;
                break;
            }
        }

        if (all_children_ended) {
            parent_run.state = OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED;
            parent_run.waiting_split_end_end_date = Dates.now();
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(parent_run);
        }
    }
}
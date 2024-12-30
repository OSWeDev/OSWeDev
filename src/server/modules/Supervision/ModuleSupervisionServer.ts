
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemURL from '../../../shared/modules/Supervision/interfaces/ISupervisedItemURL';
import ModuleSupervision from '../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import SupervisedProbeVO from '../../../shared/modules/Supervision/vos/SupervisedProbeVO';
import TeamsWebhookContentActionOpenUrlVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO';
import TeamsWebhookContentAdaptiveCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAdaptiveCardVO';
import TeamsWebhookContentAttachmentsVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAttachmentsVO';
import TeamsWebhookContentColumnSetVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnSetVO';
import TeamsWebhookContentColumnVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnVO';
import TeamsWebhookContentImageVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentImageVO';
import TeamsWebhookContentTextBlockVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentTextBlockVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import SupervisionBGThread from './bgthreads/SupervisionBGThread';
import SupervisedCRONServerController from './cron_supervision/SupervisedCRONServerController';
import SupervisionCronWorkersHandler from './SupervisionCronWorkersHandler';
import SupervisionServerController from './SupervisionServerController';
import VarNbSupervisedItemByProbeStateController from './vars/VarNbSupervisedItemByProbeStateController';

export default class ModuleSupervisionServer extends ModuleServerBase {

    public static ON_NEW_UNREAD_ERROR_TEAMS_GROUPID_PARAM_NAME: string = 'Supervision.ON_NEW_UNREAD_ERROR_TEAMS_GROUPID';
    public static ON_BACK_TO_NORMAL_TEAMS_GROUPID_PARAM_NAME: string = 'Supervision.ON_BACK_TO_NORMAL_TEAMS_GROUPID';

    public static ON_NEW_UNREAD_ERROR_TEAMS_CHANNELID_PARAM_NAME: string = 'Supervision.ON_NEW_UNREAD_ERROR_TEAMS_CHANNELID';
    public static ON_BACK_TO_NORMAL_TEAMS_CHANNELID_PARAM_NAME: string = 'Supervision.ON_BACK_TO_NORMAL_TEAMS_CHANNELID';

    private static instance: ModuleSupervisionServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSupervision.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSupervisionServer.instance) {
            ModuleSupervisionServer.instance = new ModuleSupervisionServer();
        }
        return ModuleSupervisionServer.instance;
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons() {
        SupervisionCronWorkersHandler.getInstance();
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleSupervision.APINAME_execute_manually, this.execute_manually.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleSupervision.APINAME_refresh_one_manually, this.refresh_one_manually.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        ModuleBGThreadServer.getInstance().registerBGThread(SupervisionBGThread.getInstance());

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Nb de crons en retard'
        }, 'sup_cron_graph_data_label.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supervision'
        }, 'menu.menuelements.admin.SupervisionAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Supervision'
        }, 'menu.menuelements.admin.SupervisionDashboard.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ERROR'
        }, 'supervision.STATE_ERROR'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ERROR - READ'
        }, 'supervision.STATE_ERROR_READ'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'OK'
        }, 'supervision.STATE_OK'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'PAUSED'
        }, 'supervision.STATE_PAUSED'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'UNKNOWN'
        }, 'supervision.STATE_UNKOWN'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'WARN'
        }, 'supervision.STATE_WARN'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'WARN - READ'
        }, 'supervision.STATE_WARN_READ'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tout'
        }, 'supervision.dashboard.all.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Catégories'
        }, 'supervision.dashboard.category.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Catégories'
        }, 'menu.menuelements.admin.SupervisedCategoryVO.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Types de sonde'
        }, 'supervision.dashboard.types_de_sonde.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Recherche par nom de ligne'
        }, 'supervision.filter_text.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Tout sélectionner/désélectionner'
        }, 'supervision.change_state.select_all.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marquer comme lu(s)'
        }, 'supervision.change_state.to_read.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Marquer comme non lu(s)'
        }, 'supervision.change_state.to_unread.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Fermer'
        }, 'supervision.item_modal.close.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Masquer le graph'
        }, 'supervision.item.graph.on.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Afficher le graph'
        }, 'supervision.item.graph.off.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur'
        }, 'supervision.legend.STATE_ERROR.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur prise en compte'
        }, 'supervision.legend.STATE_ERROR_READ.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Valide'
        }, 'supervision.legend.STATE_OK.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'En pause ou non défini'
        }, 'supervision.legend.STATE_PAUSED_et_STATE_UNKOWN.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Warning'
        }, 'supervision.legend.STATE_WARN.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Warning prise en compte'
        }, 'supervision.legend.STATE_WARN_READ.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Rafraîchir l'affichage"
        }, 'supervised_item_controls.desc_btn.reload.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Forcer le recalcul de la sonde"
        }, 'supervised_item_controls.desc_btn.invalidate.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Sortir de la pause"
        }, 'supervised_item_controls.desc_btn.switch_paused_turn_off.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Mettre en pause"
        }, 'supervised_item_controls.desc_btn.switch_paused_turn_on.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Indiquer comme non lu"
        }, 'supervised_item_controls.desc_btn.switch_read_turn_off.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Indiquer comme lu"
        }, 'supervised_item_controls.desc_btn.switch_read_turn_on.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Etat lu non disponible"
        }, 'supervised_item_controls.desc_btn.switch_read_disabled.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Ordonner par catégorie"
        }, 'supervision_type_widget_component.order_by_categories.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Afficher les compteurs d'état"
        }, 'supervision_type_widget_component.show_counter.___LABEL___'));

        /**
         * On gère l'historique des valeurs
         */
        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        for (const vo_type in SupervisionController.getInstance().registered_controllers) {
            preUpdateTrigger.registerHandler(vo_type, this, this.onPreU_SUP_ITEM_HISTORIZE);
            preCreateTrigger.registerHandler(vo_type, this, this.onpreC_SUP_ITEM);
        }

        await this.configure_vars();

        SupervisedCRONServerController.getInstance();
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSupervision.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Supervision'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSupervision.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration de la Supervision'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleSupervision.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'acces à la Supervision front et MAJ items'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let fo_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        fo_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        fo_access_dependency.src_pol_id = fo_access.id;
        fo_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        fo_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(fo_access_dependency);
    }

    private async onPreU_SUP_ITEM_HISTORIZE(vo_update_handler: DAOUpdateVOHolder<ISupervisedItem>): Promise<boolean> {

        /**
         * On veut changer la date et historiser que si on est en train de stocker une nouvelle valeur.
         *  - Si la valeur change, ok
         *  - Sinon,
         *      - Si le nom change, ko
         *      - Si le status change vers ou depuis paused, ko
         *      - Si un champs spécifique à ce type (pas dans les champs ISupervised) ko
         *      - Sinon ok
         */

        // Si on passe pas en pause, on stocke tout de suite en statut pre pause
        if (vo_update_handler.post_update_vo && (vo_update_handler.post_update_vo.state != SupervisionController.STATE_PAUSED)) {
            vo_update_handler.post_update_vo.state_before_pause = vo_update_handler.post_update_vo.state;
        }

        let has_new_value: boolean = true;
        if (vo_update_handler.pre_update_vo.last_value === vo_update_handler.post_update_vo.last_value) {

            if (vo_update_handler.pre_update_vo.name != vo_update_handler.post_update_vo.name) {
                has_new_value = false;
            }
            if ((vo_update_handler.pre_update_vo.state == SupervisionController.STATE_PAUSED) || (vo_update_handler.post_update_vo.state == SupervisionController.STATE_PAUSED)) {
                has_new_value = false;
            }
            if (vo_update_handler.post_update_vo.state == SupervisionController.STATE_UNKOWN) {
                has_new_value = false;
            }

            if (has_new_value) {
                const moduletablefields = ModuleTableController.module_tables_by_vo_type[vo_update_handler.post_update_vo._type].get_fields();
                for (const i in moduletablefields) {
                    const moduletablefield = moduletablefields[i];

                    switch (moduletablefield.field_name) {
                        case "name":
                        case "last_update":
                        case "last_value":
                        case "creation_date":
                        case "first_update":
                        case "state":
                        case "state_before_pause":
                            break;
                        default:
                            if (vo_update_handler.pre_update_vo[moduletablefield.field_name] != vo_update_handler.post_update_vo[moduletablefield.field_name]) {
                                has_new_value = false;
                            }
                    }
                }
            }
        }

        if (has_new_value) {

            /**
             * Si on identifie une nouvelle valeur => et différente, et qu'il s'agit d'une erreur non lue, on envoie le script, de même que si la nouvelle valeur est ok et l'ancienne
             *  une erreur (lue ou non lue)
             */
            if ((vo_update_handler.post_update_vo.state != vo_update_handler.pre_update_vo.state) && (vo_update_handler.post_update_vo.state == SupervisionController.STATE_ERROR) &&
                (vo_update_handler.pre_update_vo.state != SupervisionController.STATE_ERROR_READ)) {
                await ModuleSupervisionServer.getInstance().on_new_unread_error(vo_update_handler.post_update_vo);
            }
            if ((vo_update_handler.post_update_vo.state == SupervisionController.STATE_OK) && (
                (vo_update_handler.pre_update_vo.state == SupervisionController.STATE_ERROR_READ) || (vo_update_handler.pre_update_vo.state == SupervisionController.STATE_ERROR))) {
                await ModuleSupervisionServer.getInstance().on_back_to_normal(vo_update_handler.post_update_vo);
            }

            if (!vo_update_handler.post_update_vo.first_update) {
                vo_update_handler.post_update_vo.first_update = Dates.now();
            }
            vo_update_handler.post_update_vo.last_update = Dates.now();

            /**
             * On historise
             */
            const historique: ISupervisedItem = new ModuleTableController.vo_constructor_by_vo_type[vo_update_handler.post_update_vo._type]() as ISupervisedItem;

            const moduletablefields = ModuleTableController.module_tables_by_vo_type[vo_update_handler.post_update_vo._type].get_fields();
            for (const i in moduletablefields) {
                const moduletablefield = moduletablefields[i];

                historique[moduletablefield.field_name] = vo_update_handler.pre_update_vo[moduletablefield.field_name];
            }
            historique._type = SupervisionController.getInstance().getSupHistVoType(vo_update_handler.post_update_vo._type);

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(historique);
        }

        return true;
    }

    private async onpreC_SUP_ITEM(supervised_item: ISupervisedItem): Promise<boolean> {

        if (!supervised_item.probe_id) {
            // Dirty JFE : je ne sais pas comment automatiser ou forcer ceci autrement
            // si la sonde (necessaire au fonctionnement du compteur d'item par status) n'existe pas encore on la cree
            let probe: SupervisedProbeVO = await query(SupervisedProbeVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<SupervisedProbeVO>().sup_item_api_type_id, supervised_item._type)
                .select_vo<SupervisedProbeVO>();

            if (!probe) {
                probe = new SupervisedProbeVO();
                probe.sup_item_api_type_id = supervised_item._type;
                probe.category_id = supervised_item.category_id;
                const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(probe);

                if (!res) {
                    ConsoleHandler.error(' Impossible de créer la sonde pour le type ' + supervised_item._type);
                }
                probe.id = res.id;
            }

            if (!!probe?.id && supervised_item.probe_id != probe.id) {
                supervised_item.probe_id = probe.id;
            }
        }

        supervised_item.creation_date = Dates.now();
        if (supervised_item.state == null) {
            supervised_item.state = SupervisionController.STATE_UNKOWN;
        }

        if (supervised_item.state != SupervisionController.STATE_UNKOWN) {
            supervised_item.first_update = Dates.now();
            supervised_item.last_update = Dates.now();

            if (supervised_item.state == SupervisionController.STATE_ERROR) {
                await ModuleSupervisionServer.getInstance().on_new_unread_error(supervised_item);
            }
        }

        return true;
    }

    private async on_new_unread_error(supervised_item: ISupervisedItem) {
        const group_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleSupervisionServer.ON_NEW_UNREAD_ERROR_TEAMS_GROUPID_PARAM_NAME);
        const channel_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleSupervisionServer.ON_NEW_UNREAD_ERROR_TEAMS_CHANNELID_PARAM_NAME);

        if ((!group_id) || (!channel_id)) {
            ConsoleHandler.error('ModuleSuperVisionServer.on_new_unread_error: missing group_id or channel_id:' + ModuleSupervisionServer.ON_NEW_UNREAD_ERROR_TEAMS_GROUPID_PARAM_NAME + ' / ' + ModuleSupervisionServer.ON_NEW_UNREAD_ERROR_TEAMS_CHANNELID_PARAM_NAME);
            return;
        }

        if (ConfigurationService.node_configuration.block_mail_delivery) {
            return;
        }

        // Si on a une catégorie sans notif, on sort
        if (supervised_item.category_id) {
            const category: SupervisedCategoryVO = await query(SupervisedCategoryVO.API_TYPE_ID).filter_by_id(supervised_item.category_id).select_vo<SupervisedCategoryVO>();

            if (category && !category.notify) {
                return;
            }
        }

        const message: TeamsWebhookContentVO = new TeamsWebhookContentVO();
        const body = [];
        const actions = [];
        const title_Text = new TeamsWebhookContentTextBlockVO().set_text((ConfigurationService.node_configuration.is_main_prod_env ? '[PROD] ' : '[TEST] ') + 'Supervision - Nouvelle ERREUR');
        body.push(title_Text);
        const error_Image = new TeamsWebhookContentImageVO().set_url(ConfigurationService.node_configuration.base_url + "vuejsclient/public/img/error.png").set_size('medium');
        body.push(error_Image);
        const error_Column = new TeamsWebhookContentColumnSetVO().set_columns([new TeamsWebhookContentColumnVO().set_items([new TeamsWebhookContentTextBlockVO().set_text('ERREUR : [' + supervised_item.name + '](\"' + ConfigurationService.node_configuration.base_url + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id + '\")')])]).set_style('emphasis');
        body.push(error_Column);

        // protection contre le cas très spécifique de la création d'une sonde en erreur (qui ne devrait jamais arriver)
        if (supervised_item.id) {
            actions.push(new TeamsWebhookContentActionOpenUrlVO().set_url(ConfigurationService.node_configuration.base_url + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id).set_title('Consulter'));
        }

        const urls: ISupervisedItemURL[] = SupervisionController.getInstance().registered_controllers[supervised_item._type].get_urls(supervised_item);
        for (const i in urls) {
            const url = urls[i];
            actions.push(new TeamsWebhookContentActionOpenUrlVO().set_url(url.url).set_title(url.label));
        }

        message.attachments.push(new TeamsWebhookContentAttachmentsVO().set_name("Supervision").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body).set_actions(actions)));
        await TeamsAPIServerController.send_to_teams_webhook(channel_id, group_id, message);
    }

    private async on_back_to_normal(supervised_item: ISupervisedItem) {
        const group_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleSupervisionServer.ON_BACK_TO_NORMAL_TEAMS_GROUPID_PARAM_NAME);
        const channel_id: string = await ModuleParams.getInstance().getParamValueAsString(ModuleSupervisionServer.ON_BACK_TO_NORMAL_TEAMS_CHANNELID_PARAM_NAME);

        if ((!group_id) || (!channel_id)) {
            ConsoleHandler.error('ModuleSuperVisionServer.on_back_to_normal: missing group_id or channel_id:' + ModuleSupervisionServer.ON_BACK_TO_NORMAL_TEAMS_GROUPID_PARAM_NAME + ' / ' + ModuleSupervisionServer.ON_BACK_TO_NORMAL_TEAMS_CHANNELID_PARAM_NAME);
            return;
        }

        if (ConfigurationService.node_configuration.block_mail_delivery) {
            return;
        }

        // Si on a une catégorie sans notif, on sort
        if (supervised_item.category_id) {
            const category: SupervisedCategoryVO = await query(SupervisedCategoryVO.API_TYPE_ID).filter_by_id(supervised_item.category_id).select_vo<SupervisedCategoryVO>();

            if (category && !category.notify) {
                return;
            }
        }

        const message: TeamsWebhookContentVO = new TeamsWebhookContentVO();
        const body = [];
        const actions = [];
        const title_Text = new TeamsWebhookContentTextBlockVO().set_text((ConfigurationService.node_configuration.is_main_prod_env ? '[PROD] ' : '[TEST] ') + 'Supervision - Retour a la normale');
        body.push(title_Text);
        const ok_Image = new TeamsWebhookContentImageVO().set_url(ConfigurationService.node_configuration.base_url + "vuejsclient/public/img/ok.png").set_size('medium');
        body.push(ok_Image);
        const ok_Column = new TeamsWebhookContentColumnSetVO().set_columns([new TeamsWebhookContentColumnVO().set_items([new TeamsWebhookContentTextBlockVO().set_text('Retour a la normale : [' + supervised_item.name + '](\"' + ConfigurationService.node_configuration.base_url + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id + '\")')])]).set_style('emphasis');
        body.push(ok_Column);
        actions.push(new TeamsWebhookContentActionOpenUrlVO().set_url(ConfigurationService.node_configuration.base_url + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id).set_title('Consulter'));

        const urls: ISupervisedItemURL[] = SupervisionController.getInstance().registered_controllers[supervised_item._type].get_urls(supervised_item);
        for (const i in urls) {
            const url = urls[i];
            actions.push(new TeamsWebhookContentActionOpenUrlVO().set_url(url.url).set_title(url.label));
        }

        message.attachments.push(new TeamsWebhookContentAttachmentsVO().set_name("Supervision").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body).set_actions(actions)));
        await TeamsAPIServerController.send_to_teams_webhook(channel_id, group_id, message);
    }

    // istanbul ignore next: cannot test execute_manually
    private async execute_manually(text: string) {
        if (!text) {
            return null;
        }

        if (!SupervisionServerController.getInstance().registered_controllers[text]) {
            return null;
        }

        await SupervisionServerController.getInstance().registered_controllers[text].work_all();
    }

    // istanbul ignore next: cannot test refresh_one_manually
    private async refresh_one_manually(api_type_id: string, name: string) {
        if (!api_type_id) {
            return null;
        }

        if (!SupervisionServerController.getInstance().registered_controllers[api_type_id]) {
            return null;
        }

        await SupervisionServerController.getInstance().registered_controllers[api_type_id].work_one(await ModuleDAO.getInstance().getNamedVoByName(api_type_id, name));
    }

    private async configure_vars() {
        await VarNbSupervisedItemByProbeStateController.getInstance().initialize();
    }
}
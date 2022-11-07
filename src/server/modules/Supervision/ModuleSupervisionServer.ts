
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemURL from '../../../shared/modules/Supervision/interfaces/ISupervisedItemURL';
import ModuleSupervision from '../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import TeamsWebhookContentActionCardOpenURITargetVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionCardOpenURITargetVO';
import TeamsWebhookContentActionCardVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionCardVO';
import TeamsWebhookContentSectionVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentVO from '../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTeamsAPIServer from '../TeamsAPI/ModuleTeamsAPIServer';
import SupervisionBGThread from './bgthreads/SupervisionBGThread';
import SupervisionCronWorkersHandler from './SupervisionCronWorkersHandler';
import SupervisionServerController from './SupervisionServerController';

export default class ModuleSupervisionServer extends ModuleServerBase {

    public static ON_NEW_UNREAD_ERROR_TEAMS_WEBHOOK_PARAM_NAME: string = 'Supervision.ON_NEW_UNREAD_ERROR_TEAMS_WEBHOOK';
    public static ON_BACK_TO_NORMAL_TEAMS_WEBHOOK_PARAM_NAME: string = 'Supervision.ON_BACK_TO_NORMAL_TEAMS_WEBHOOK';

    public static getInstance() {
        if (!ModuleSupervisionServer.instance) {
            ModuleSupervisionServer.instance = new ModuleSupervisionServer();
        }
        return ModuleSupervisionServer.instance;
    }

    private static instance: ModuleSupervisionServer = null;

    private constructor() {
        super(ModuleSupervision.getInstance().name);
    }

    public registerCrons() {
        SupervisionCronWorkersHandler.getInstance();
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleSupervision.APINAME_execute_manually, this.execute_manually.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleSupervision.APINAME_refresh_one_manually, this.refresh_one_manually.bind(this));
    }

    public async configure() {
        ModuleBGThreadServer.getInstance().registerBGThread(SupervisionBGThread.getInstance());

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supervision'
        }, 'menu.menuelements.admin.SupervisionAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supervision'
        }, 'menu.menuelements.admin.SupervisionDashboard.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'ERROR'
        }, 'supervision.STATE_ERROR'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'ERROR - READ'
        }, 'supervision.STATE_ERROR_READ'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'OK'
        }, 'supervision.STATE_OK'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'PAUSED'
        }, 'supervision.STATE_PAUSED'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'UNKNOWN'
        }, 'supervision.STATE_UNKOWN'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'WARN'
        }, 'supervision.STATE_WARN'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'WARN - READ'
        }, 'supervision.STATE_WARN_READ'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout'
        }, 'supervision.dashboard.all.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Catégories'
        }, 'supervision.dashboard.category.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Catégories'
        }, 'menu.menuelements.admin.SupervisedCategoryVO.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Types de sonde'
        }, 'supervision.dashboard.types_de_sonde.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Recherche par nom de ligne'
        }, 'supervision.filter_text.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout sélectionner/désélectionner'
        }, 'supervision.change_state.select_all.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Marquer comme lu(s)'
        }, 'supervision.change_state.to_read.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Marquer comme non lu(s)'
        }, 'supervision.change_state.to_unread.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Fermer'
        }, 'supervision.item_modal.close.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Masquer le graph'
        }, 'supervision.item.graph.on.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Afficher le graph'
        }, 'supervision.item.graph.off.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur'
        }, 'supervision.legend.STATE_ERROR.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur prise en compte'
        }, 'supervision.legend.STATE_ERROR_READ.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valide'
        }, 'supervision.legend.STATE_OK.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'En pause ou non défini'
        }, 'supervision.legend.STATE_PAUSED_et_STATE_UNKOWN.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Warning'
        }, 'supervision.legend.STATE_WARN.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Warning prise en compte'
        }, 'supervision.legend.STATE_WARN_READ.___LABEL___'));


        /**
         * On gère l'historique des valeurs
         */
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        for (let vo_type in SupervisionController.getInstance().registered_controllers) {
            preUpdateTrigger.registerHandler(vo_type, this, this.onPreU_SUP_ITEM_HISTORIZE);
            preCreateTrigger.registerHandler(vo_type, this, this.onpreC_SUP_ITEM);
        }
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSupervision.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Supervision'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSupervision.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration de la Supervision'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
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
                let moduletablefields = VOsTypesManager.getInstance().moduleTables_by_voType[vo_update_handler.post_update_vo._type].get_fields();
                for (let i in moduletablefields) {
                    let moduletablefield = moduletablefields[i];

                    switch (moduletablefield.field_id) {
                        case "name":
                        case "last_update":
                        case "last_value":
                        case "creation_date":
                        case "first_update":
                        case "state":
                        case "state_before_pause":
                            break;
                        default:
                            if (vo_update_handler.pre_update_vo[moduletablefield.field_id] != vo_update_handler.post_update_vo[moduletablefield.field_id]) {
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
            let historique: ISupervisedItem = VOsTypesManager.getInstance().moduleTables_by_voType[vo_update_handler.post_update_vo._type].getNewVO() as ISupervisedItem;

            let moduletablefields = VOsTypesManager.getInstance().moduleTables_by_voType[vo_update_handler.post_update_vo._type].get_fields();
            for (let i in moduletablefields) {
                let moduletablefield = moduletablefields[i];

                historique[moduletablefield.field_id] = vo_update_handler.pre_update_vo[moduletablefield.field_id];
            }
            historique._type = SupervisionController.getInstance().getSupHistVoType(vo_update_handler.post_update_vo._type);

            await ModuleDAO.getInstance().insertOrUpdateVO(historique);
        }

        return true;
    }

    private async onpreC_SUP_ITEM(supervised_item: ISupervisedItem): Promise<boolean> {
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
        let webhook: string = await ModuleParams.getInstance().getParamValue(ModuleSupervisionServer.ON_NEW_UNREAD_ERROR_TEAMS_WEBHOOK_PARAM_NAME);

        if (!webhook) {
            return;
        }

        if (ConfigurationService.getInstance().node_configuration.BLOCK_MAIL_DELIVERY) {
            return;
        }

        // Si on a une catégorie sans notif, on sort
        if (supervised_item.category_id) {
            let category: SupervisedCategoryVO = await query(SupervisedCategoryVO.API_TYPE_ID).filter_by_id(supervised_item.category_id).select_vo<SupervisedCategoryVO>();

            if (category && !category.notify) {
                return;
            }
        }

        let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();
        message.title = 'Supervision - Nouvelle ERREUR';
        message.summary = 'ERREUR : ' + supervised_item.name;
        message.sections.push(
            new TeamsWebhookContentSectionVO().set_text('<blockquote>ERREUR : <a href=\"' + ConfigurationService.getInstance().node_configuration.BASE_URL + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id + '\">' + supervised_item.name + '</a></blockquote>')
                .set_activityImage(ConfigurationService.getInstance().node_configuration.BASE_URL + "vuejsclient/public/img/error.png"));

        // protection contre le cas très spécifique de la création d'une sonde en erreur (qui ne devrait jamais arriver)
        if (!!supervised_item.id) {
            message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name('Consulter').set_targets([
                new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(
                    ConfigurationService.getInstance().node_configuration.BASE_URL + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id)]));
        }

        let urls: ISupervisedItemURL[] = SupervisionController.getInstance().registered_controllers[supervised_item._type].get_urls(supervised_item);
        for (let i in urls) {
            let url = urls[i];

            message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name(url.label).set_targets([
                new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(url.url)]));
        }

        await ModuleTeamsAPIServer.getInstance().send_to_teams_webhook(webhook, message);
    }

    private async on_back_to_normal(supervised_item: ISupervisedItem) {
        let webhook: string = await ModuleParams.getInstance().getParamValue(ModuleSupervisionServer.ON_BACK_TO_NORMAL_TEAMS_WEBHOOK_PARAM_NAME);

        if (!webhook) {
            return;
        }

        if (ConfigurationService.getInstance().node_configuration.BLOCK_MAIL_DELIVERY) {
            return;
        }

        // Si on a une catégorie sans notif, on sort
        if (supervised_item.category_id) {
            let category: SupervisedCategoryVO = await query(SupervisedCategoryVO.API_TYPE_ID).filter_by_id(supervised_item.category_id).select_vo<SupervisedCategoryVO>();

            if (category && !category.notify) {
                return;
            }
        }

        let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();
        message.title = 'Supervision - Retour a la normale';
        message.summary = 'OK : ' + supervised_item.name;
        message.sections.push(
            new TeamsWebhookContentSectionVO().set_text('<blockquote>Retour a la normale : <a href=\"' + ConfigurationService.getInstance().node_configuration.BASE_URL + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id + '\">' + supervised_item.name + '</a></blockquote>')
                .set_activityImage(ConfigurationService.getInstance().node_configuration.BASE_URL + "vuejsclient/public/img/ok.png"));
        message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name('Consulter').set_targets([
            new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(
                ConfigurationService.getInstance().node_configuration.BASE_URL + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id)]));

        let urls: ISupervisedItemURL[] = SupervisionController.getInstance().registered_controllers[supervised_item._type].get_urls(supervised_item);
        for (let i in urls) {
            let url = urls[i];

            message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name(url.label).set_targets([
                new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(url.url)]));
        }

        await ModuleTeamsAPIServer.getInstance().send_to_teams_webhook(webhook, message);
    }

    private async execute_manually(text: string) {
        if (!text) {
            return null;
        }

        if (!SupervisionServerController.getInstance().registered_controllers[text]) {
            return null;
        }

        await SupervisionServerController.getInstance().registered_controllers[text].work_all();
    }

    private async refresh_one_manually(api_type_id: string, name: string) {
        if (!api_type_id) {
            return null;
        }

        if (!SupervisionServerController.getInstance().registered_controllers[api_type_id]) {
            return null;
        }

        await SupervisionServerController.getInstance().registered_controllers[api_type_id].work_one(await ModuleDAO.getInstance().getNamedVoByName(api_type_id, name));
    }
}
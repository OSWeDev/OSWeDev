import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemURL from '../../../shared/modules/Supervision/interfaces/ISupervisedItemURL';
import ModuleSupervision from '../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../shared/modules/Supervision/SupervisionController';
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
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTeamsAPIServer from '../TeamsAPI/ModuleTeamsAPIServer';
import SupervisionCronWorkersHandler from './SupervisionCronWorkersHandler';

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

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supervision'
        }, 'menu.menuelements.SupervisionAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supervision'
        }, 'menu.menuelements.SupervisionDashboard.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'ERROR'
        }, 'supervision.STATE_ERROR'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'ERROR - READ'
        }, 'supervision.STATE_ERROR_READ'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'OK'
        }, 'supervision.STATE_OK'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'PAUSED'
        }, 'supervision.STATE_PAUSED'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'UNKNOWN'
        }, 'supervision.STATE_UNKOWN'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'WARN'
        }, 'supervision.STATE_WARN'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'WARN - READ'
        }, 'supervision.STATE_WARN_READ'));


        /**
         * On gère l'historique des valeurs
         */
        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);

        for (let vo_type in SupervisionController.getInstance().registered_controllers) {
            preUpdateTrigger.registerHandler(vo_type, this.onPreU_SUP_ITEM_HISTORIZE.bind(this));
            preCreateTrigger.registerHandler(vo_type, this.onpreC_SUP_ITEM.bind(this));
        }
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSupervision.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Supervision'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSupervision.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration de la Supervision'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    private async onPreU_SUP_ITEM_HISTORIZE(supervised_item: ISupervisedItem) {

        /**
         * On veut changer la date et historiser que si on est en train de stocker une nouvelle valeur.
         *  - Si la valeur change, ok
         *  - Sinon,
         *      - Si le nom change, ko
         *      - Si le status change vers ou depuis paused, ko
         *      - Si un champs spécifique à ce type (pas dans les champs ISupervised) ko
         *      - Sinon ok
         */
        let old = await ModuleDAO.getInstance().getVoById<ISupervisedItem>(supervised_item._type, supervised_item.id);

        // Si on passe pas en pause, on stocke tout de suite en statut pre pause
        if (supervised_item && (supervised_item.state != SupervisionController.STATE_PAUSED)) {
            supervised_item.state_before_pause = supervised_item.state;
        }

        let has_new_value: boolean = true;
        if (old.last_value === supervised_item.last_value) {

            if (old.name != supervised_item.name) {
                has_new_value = false;
            }
            if ((old.state == SupervisionController.STATE_PAUSED) || (supervised_item.state == SupervisionController.STATE_PAUSED)) {
                has_new_value = false;
            }
            if (supervised_item.state == SupervisionController.STATE_UNKOWN) {
                has_new_value = false;
            }

            if (has_new_value) {
                let moduletablefields = VOsTypesManager.getInstance().moduleTables_by_voType[supervised_item._type].get_fields();
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
                            if (old[moduletablefield.field_id] != supervised_item[moduletablefield.field_id]) {
                                has_new_value = false;
                            }
                    }
                }
            }
        }

        if (has_new_value) {

            /**
             * Si on identifie une nouvelle valeur, et qu'il s'agit d'une erreur non lue, on envoie le script, de même que si la nouvelle valeur est ok et l'ancienne
             *  une erreur (lue ou non lue)
             */
            if (supervised_item.state == SupervisionController.STATE_ERROR) {
                await this.on_new_unread_error(supervised_item);
            }
            if ((supervised_item.state == SupervisionController.STATE_OK) && (
                (old.state == SupervisionController.STATE_ERROR_READ) || (old.state == SupervisionController.STATE_ERROR))) {
                await this.on_back_to_normal(supervised_item);
            }

            if (!supervised_item.first_update) {
                supervised_item.first_update = moment().utc(true);
            }
            supervised_item.last_update = moment().utc(true);

            /**
             * On historise
             */
            let historique: ISupervisedItem = VOsTypesManager.getInstance().moduleTables_by_voType[supervised_item._type].getNewVO() as ISupervisedItem;

            let moduletablefields = VOsTypesManager.getInstance().moduleTables_by_voType[supervised_item._type].get_fields();
            for (let i in moduletablefields) {
                let moduletablefield = moduletablefields[i];

                historique[moduletablefield.field_id] = old[moduletablefield.field_id];
            }
            historique._type = SupervisionController.getInstance().getSupHistVoType(supervised_item._type);

            await ModuleDAO.getInstance().insertOrUpdateVO(historique);
        }

        return true;
    }

    private async onpreC_SUP_ITEM(supervised_item: ISupervisedItem): Promise<boolean> {
        supervised_item.creation_date = moment().utc(true);
        if (supervised_item.state == null) {
            supervised_item.state = SupervisionController.STATE_UNKOWN;
        }

        if (supervised_item.state != SupervisionController.STATE_UNKOWN) {
            supervised_item.first_update = moment().utc(true);
            supervised_item.last_update = moment().utc(true);

            if (supervised_item.state == SupervisionController.STATE_ERROR) {
                await this.on_new_unread_error(supervised_item);
            }
        }

        return true;
    }

    private async on_new_unread_error(supervised_item: ISupervisedItem) {
        let webhook: string = await ModuleParams.getInstance().getParamValue(ModuleSupervisionServer.ON_NEW_UNREAD_ERROR_TEAMS_WEBHOOK_PARAM_NAME);

        if (!webhook) {
            return;
        }

        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {
            return;
        }

        let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();
        message.title = 'Supervision - Nouvelle ERREUR';
        message.summary = 'ERREUR : ' + supervised_item.name;
        message.sections.push(
            new TeamsWebhookContentSectionVO().set_text('<blockquote>ERREUR : <a href=\"' + ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + 'admin/#/supervision/item/' + supervised_item._type + '/' + supervised_item.id + '\">' + supervised_item.name + '</a></blockquote>')
                .set_activityImage(ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + "vuejsclient/public/img/error.png"));

        // protection contre le cas très spécifique de la création d'une sonde en erreur (qui ne devrait jamais arriver)
        if (!!supervised_item.id) {
            message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name('Consulter').set_targets([
                new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(
                    ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + 'admin/#/supervision/item/' + supervised_item._type + '/' + supervised_item.id)]));
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

        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {
            return;
        }

        let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();
        message.title = 'Supervision - Retour a la normale';
        message.summary = 'OK : ' + supervised_item.name;
        message.sections.push(
            new TeamsWebhookContentSectionVO().set_text('<blockquote>Retour a la normale : <a href=\"' + ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + 'admin/#/supervision/item/' + supervised_item._type + '/' + supervised_item.id + '\">' + supervised_item.name + '</a></blockquote>')
                .set_activityImage(ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + "vuejsclient/public/img/ok.png"));
        message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name('Consulter').set_targets([
            new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(
                ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + 'admin/#/supervision/item/' + supervised_item._type + '/' + supervised_item.id)]));

        let urls: ISupervisedItemURL[] = SupervisionController.getInstance().registered_controllers[supervised_item._type].get_urls(supervised_item);
        for (let i in urls) {
            let url = urls[i];

            message.potentialAction.push(new TeamsWebhookContentActionCardVO().set_type("OpenUri").set_name(url.label).set_targets([
                new TeamsWebhookContentActionCardOpenURITargetVO().set_os('default').set_uri(url.url)]));
        }

        await ModuleTeamsAPIServer.getInstance().send_to_teams_webhook(webhook, message);
    }
}
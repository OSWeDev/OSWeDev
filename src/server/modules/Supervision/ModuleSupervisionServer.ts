import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ModuleSupervision from '../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../shared/modules/Supervision/SupervisionController';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleSupervisionServer extends ModuleServerBase {

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

        for (let i in SupervisionController.getInstance().registered_api_types) {
            let registered_api_type = SupervisionController.getInstance().registered_api_types[i];
            preUpdateTrigger.registerHandler(registered_api_type.vo_type, this.onPreU_SUP_ITEM_HISTORIZE.bind(this));
            preCreateTrigger.registerHandler(registered_api_type.vo_type, this.onpreC_SUP_ITEM.bind(this));
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

                historique[moduletablefield.field_id] = supervised_item[moduletablefield.field_id];
            }
            historique._type = SupervisionController.getInstance().getSupHistVoType(supervised_item._type);

            await ModuleDAO.getInstance().insertOrUpdateVO(historique);
        }
    }

    private async onpreC_SUP_ITEM(sup_pdv_lid: ISupervisedItem): Promise<boolean> {
        sup_pdv_lid.creation_date = moment().utc(true);
        if (sup_pdv_lid.state == null) {
            sup_pdv_lid.state = SupervisionController.STATE_UNKOWN;
        }

        if (sup_pdv_lid.state != SupervisionController.STATE_UNKOWN) {
            sup_pdv_lid.first_update = moment().utc(true);
            sup_pdv_lid.last_update = moment().utc(true);
        }

        return true;
    }
}
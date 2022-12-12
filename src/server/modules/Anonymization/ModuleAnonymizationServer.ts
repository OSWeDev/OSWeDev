import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAnonymization from '../../../shared/modules/Anonymization/ModuleAnonymization';
import AnonymizationFieldConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import ForkServerController from '../Fork/ForkServerController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ServerAnonymizationController from './ServerAnonymizationController';

export default class ModuleAnonymizationServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAnonymizationServer.instance) {
            ModuleAnonymizationServer.instance = new ModuleAnonymizationServer();
        }
        return ModuleAnonymizationServer.instance;
    }

    private static instance: ModuleAnonymizationServer = null;

    private constructor() {
        super(ModuleAnonymization.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAnonymization.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Anonymisation'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAnonymization.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration de l\'anonymisation'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Ville' },
            'anonym_conf.anonymizer.city'
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Prénom' },
            'anonym_conf.anonymizer.firstname',
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Nom' },
            'anonym_conf.anonymizer.lastname',
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Prénom Nom' },
            'anonym_conf.anonymizer.fullname',
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Téléphone' },
            'anonym_conf.anonymizer.phone',
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Email' },
            'anonym_conf.anonymizer.email',
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Code Postal' },
            'anonym_conf.anonymizer.postal',
        ));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Adresse' },
            'anonym_conf.anonymizer.address'
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Anonymisation' },
            'menu.menuelements.anonym_field_conf.___LABEL___'
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Anonymisation' },
            'menu.menuelements.admin.AnonymizationAdminVueModule.___LABEL___'
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Modification impossible sur data anonymisée.' },
            "check_is_anonymise.failed" + DefaultTranslation.DEFAULT_LABEL_EXTENSION
        ));

        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        postCreateTrigger.registerHandler(AnonymizationFieldConfVO.API_TYPE_ID, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().reload_conf);
        postUpdateTrigger.registerHandler(AnonymizationFieldConfVO.API_TYPE_ID, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().reload_conf);
        postDeleteTrigger.registerHandler(AnonymizationFieldConfVO.API_TYPE_ID, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().reload_conf);
        postCreateTrigger.registerHandler(AnonymizationUserConfVO.API_TYPE_ID, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().reload_conf);
        postUpdateTrigger.registerHandler(AnonymizationUserConfVO.API_TYPE_ID, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().reload_conf);
        postDeleteTrigger.registerHandler(AnonymizationUserConfVO.API_TYPE_ID, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().reload_conf);

        if (ForkServerController.getInstance().is_main_process) {
            await ServerAnonymizationController.getInstance().reload_conf();
        }
    }

    public async late_configuration(): Promise<void> {
        for (let i in VOsTypesManager.moduleTables_by_voType) {
            let moduletable = VOsTypesManager.moduleTables_by_voType[i];

            // ModuleDAOServer.getInstance().registerAccessHook(moduletable.vo_type, ModuleDAO.DAO_ACCESS_TYPE_READ, ServerAnonymizationController.getInstance().anonymise.bind(ServerAnonymizationController.getInstance()));
            //TODO FIXME à faire en fait aujourd'hui ce n'est pas fait
            // ModuleDAOServer.getInstance().registerContextAccessHook(moduletable.vo_type, ServerAnonymizationController.getInstance().anonymiseContextAccessHook.bind(ServerAnonymizationController.getInstance()));

            // On doit refuser d'insérer/modifier des vos anonymisés
            ModuleDAOServer.getInstance().registerAccessHook(moduletable.vo_type, ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().check_is_anonymise);
            ModuleDAOServer.getInstance().registerAccessHook(moduletable.vo_type, ModuleDAO.DAO_ACCESS_TYPE_DELETE, ServerAnonymizationController.getInstance(), ServerAnonymizationController.getInstance().check_is_anonymise);
        }
    }
}
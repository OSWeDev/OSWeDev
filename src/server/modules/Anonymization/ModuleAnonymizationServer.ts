import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAnonymization from '../../../shared/modules/Anonymization/ModuleAnonymization';
import AnonymizationFieldConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import AnonymizationUserConfVO from '../../../shared/modules/Anonymization/vos/AnonymizationUserConfVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import ForkServerController from '../Fork/ForkServerController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ServerAnonymizationController from './ServerAnonymizationController';

export default class ModuleAnonymizationServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAnonymizationServer.instance) {
            ModuleAnonymizationServer.instance = new ModuleAnonymizationServer();
        }
        return ModuleAnonymizationServer.instance;
    }

    private static instance: ModuleAnonymizationServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAnonymization.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAnonymization.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Anonymisation'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleAnonymization.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration de l\'anonymisation'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Ville' },
            'anonym_conf.anonymizer.city'
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Prénom' },
            'anonym_conf.anonymizer.firstname',
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Nom' },
            'anonym_conf.anonymizer.lastname',
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Prénom Nom' },
            'anonym_conf.anonymizer.fullname',
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Téléphone' },
            'anonym_conf.anonymizer.phone',
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Email' },
            'anonym_conf.anonymizer.email',
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Code Postal' },
            'anonym_conf.anonymizer.postal',
        ));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Adresse' },
            'anonym_conf.anonymizer.address'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Anonymisation' },
            'menu.menuelements.anonym_field_conf.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Anonymisation' },
            'menu.menuelements.admin.AnonymizationAdminVueModule.___LABEL___'
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Modification impossible sur data anonymisée.' },
            "check_is_anonymise.failed" + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION
        ));

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        postCreateTrigger.registerHandler(AnonymizationFieldConfVO.API_TYPE_ID, ServerAnonymizationController, ServerAnonymizationController.reload_conf);
        postUpdateTrigger.registerHandler(AnonymizationFieldConfVO.API_TYPE_ID, ServerAnonymizationController, ServerAnonymizationController.reload_conf);
        postDeleteTrigger.registerHandler(AnonymizationFieldConfVO.API_TYPE_ID, ServerAnonymizationController, ServerAnonymizationController.reload_conf);
        postCreateTrigger.registerHandler(AnonymizationUserConfVO.API_TYPE_ID, ServerAnonymizationController, ServerAnonymizationController.reload_conf);
        postUpdateTrigger.registerHandler(AnonymizationUserConfVO.API_TYPE_ID, ServerAnonymizationController, ServerAnonymizationController.reload_conf);
        postDeleteTrigger.registerHandler(AnonymizationUserConfVO.API_TYPE_ID, ServerAnonymizationController, ServerAnonymizationController.reload_conf);

        if (ForkServerController.is_main_process()) {
            await ServerAnonymizationController.reload_conf();
        }
    }

    public async late_configuration(is_generator: boolean): Promise<void> {
        for (const i in ModuleTableController.module_tables_by_vo_type) {
            const moduletable = ModuleTableController.module_tables_by_vo_type[i];

            // ModuleDAOServer.getInstance().registerAccessHook(moduletable.vo_type, ModuleDAO.DAO_ACCESS_TYPE_READ, ServerAnonymizationController.anonymise.bind(ServerAnonymizationController));
            //TODO FIXME à faire en fait aujourd'hui ce n'est pas fait
            // ModuleDAOServer.getInstance().registerContextAccessHook(moduletable.vo_type, ServerAnonymizationController.anonymiseContextAccessHook.bind(ServerAnonymizationController));

            // On doit refuser d'insérer/modifier des vos anonymisés
            ModuleDAOServer.getInstance().registerAccessHook(moduletable.vo_type, ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ServerAnonymizationController, ServerAnonymizationController.check_is_anonymise);
            ModuleDAOServer.getInstance().registerAccessHook(moduletable.vo_type, ModuleDAO.DAO_ACCESS_TYPE_DELETE, ServerAnonymizationController, ServerAnonymizationController.check_is_anonymise);
        }
    }
}
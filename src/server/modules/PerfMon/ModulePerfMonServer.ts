import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModulePerfMon from '../../../shared/modules/PerfMon/ModulePerfMon';
import PerfMonLineTypeVO from '../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PerfMonConfController from './PerfMonConfController';

export default class ModulePerfMonServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModulePerfMonServer.instance) {
            ModulePerfMonServer.instance = new ModulePerfMonServer();
        }
        return ModulePerfMonServer.instance;
    }

    private static instance: ModulePerfMonServer = null;

    private constructor() {
        super(ModulePerfMon.getInstance().name);
    }

    public async configure() {

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Types de performance' },
            'menu.menuelements.perfmon_line_type.___LABEL___'));

        let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUpdateTrigger.registerHandler(PerfMonLineTypeVO.API_TYPE_ID, PerfMonConfController.getInstance().throttled_update_cached_perf_conf);
        let postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        postDeleteTrigger.registerHandler(PerfMonLineTypeVO.API_TYPE_ID, PerfMonConfController.getInstance().throttled_update_cached_perf_conf);
        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(PerfMonLineTypeVO.API_TYPE_ID, PerfMonConfController.getInstance().throttled_update_cached_perf_conf);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModulePerfMon.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'PerfMon'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModulePerfMon.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des PerfMon'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }
}
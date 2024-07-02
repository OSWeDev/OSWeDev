import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
import ModuleAccessPolicy from "../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import AccessPolicyGroupVO from "../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO";
import AccessPolicyVO from "../../../shared/modules/AccessPolicy/vos/AccessPolicyVO";
import PolicyDependencyVO from "../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO";
import ModuleChatModal from '../../../shared/modules/ChatModal/ModuleChatModal';
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import AccessPolicyServerController from "../AccessPolicy/AccessPolicyServerController";
import ModuleAccessPolicyServer from "../AccessPolicy/ModuleAccessPolicyServer";
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from "../ModulesManagerServer";

export default class ModuleChatModalServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleChatModalServer.instance) {
            ModuleChatModalServer.instance = new ModuleChatModalServer();
        }
        return ModuleChatModalServer.instance;
    }

    private static instance: ModuleChatModalServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleChatModal.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleChatModal.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'ChatModal'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleChatModal.POLICY_FO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès ChatModal'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_FO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }
}
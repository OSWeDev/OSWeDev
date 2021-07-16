import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleMenu from '../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../shared/modules/Menu/vos/MenuElementVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleMenuServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleMenuServer.instance) {
            ModuleMenuServer.instance = new ModuleMenuServer();
        }
        return ModuleMenuServer.instance;
    }

    private static instance: ModuleMenuServer = null;

    private constructor() {
        super(ModuleMenu.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleMenu.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Menus'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleMenu.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des menus'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleMenu.APINAME_get_menu, this.get_menu.bind(this));
    }

    private async get_menu(app_name: string): Promise<MenuElementVO[]> {

        let res: MenuElementVO[] = [];

        let all = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<MenuElementVO>(
            MenuElementVO.API_TYPE_ID,
            null,
            null,
            'app_name',
            [app_name]);
        for (let i in all) {
            let elt = all[i];

            if (!elt.access_policy_name) {
                res.push(elt);
                continue;
            }

            if (ModuleAccessPolicy.getInstance().checkAccess(elt.access_policy_name)) {
                res.push(elt);
            }
        }

        return res;
    }
}
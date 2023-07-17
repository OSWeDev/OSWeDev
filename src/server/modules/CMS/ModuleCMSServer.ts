import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import IInstantiatedPageComponent from '../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import ModuleCMS from '../../../shared/modules/CMS/ModuleCMS';
import TemplateComponentVO from '../../../shared/modules/CMS/vos/TemplateComponentVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import WeightHandler from '../../../shared/tools/WeightHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleCMSServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleCMSServer.instance) {
            ModuleCMSServer.instance = new ModuleCMSServer();
        }
        return ModuleCMSServer.instance;
    }

    private static instance: ModuleCMSServer = null;

    private constructor() {
        super(ModuleCMS.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleCMS.APINAME_getPageComponents, this.getPageComponents.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModuleCMS.APINAME_registerTemplateComponent, this.registerTemplateComponent.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleCMS.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'CMS'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleCMS.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            'fr-fr': 'Accès aux pages CMS'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleCMS.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = bo_access.id;
        dependency.depends_on_pol_id = fo_access.id;
        dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(dependency);
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    private async getPageComponents(num: number): Promise<IInstantiatedPageComponent[]> {
        let res: IInstantiatedPageComponent[] = [];

        for (let i in ModuleCMS.getInstance().registered_template_components_by_type) {

            let registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components_by_type[i];

            let type_page_components: IInstantiatedPageComponent[] = await query(registered_template_component.type_id).filter_by_num_eq('page_id', num).select_vos<IInstantiatedPageComponent>();

            res = res.concat(type_page_components);
        }

        WeightHandler.getInstance().sortByWeight(res);

        return res;
    }
}
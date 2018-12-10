import ModuleCMS from '../../../shared/modules/CMS/ModuleCMS';
import ModuleServerBase from '../ModuleServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TemplateComponentVO from '../../../shared/modules/CMS/vos/TemplateComponentVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import IInstantiatedPageComponent from '../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import WeightHandler from '../../../shared/tools/WeightHandler';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleCMSServer extends ModuleServerBase {

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

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCMS.APINAME_getPageComponents, this.getPageComponents.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCMS.APINAME_registerTemplateComponent, this.registerTemplateComponent.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleCMS.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'CMS'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        fo_access.translatable_name = ModuleCMS.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            fr: 'Accès aux pages CMS'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleCMS.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = bo_access.id;
        dependency.depends_on_pol_id = fo_access.id;
        dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(dependency);
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    private async registerTemplateComponent(templateComponent: TemplateComponentVO): Promise<TemplateComponentVO> {
        if (!ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id]) {

            if (!templateComponent.id) {
                let bdd_components: TemplateComponentVO[] = await ModuleDAOServer.getInstance().selectAll<TemplateComponentVO>(TemplateComponentVO.API_TYPE_ID, "where type_id = $1", [templateComponent.type_id]);
                if ((bdd_components) && (bdd_components.length >= 1)) {
                    templateComponent = bdd_components[0];
                }
            }

            if (!templateComponent.id) {
                let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(templateComponent);
                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    return null;
                }
                templateComponent.id = parseInt(insertOrDeleteQueryResult.id);
            }

            ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id] = templateComponent;
        }

        return ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id];
    }

    private async getPageComponents(param: NumberParamVO): Promise<IInstantiatedPageComponent[]> {
        let res: IInstantiatedPageComponent[] = [];

        for (let i in ModuleCMS.getInstance().registered_template_components_by_type) {

            let registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components_by_type[i];

            let type_page_components: IInstantiatedPageComponent[] = await ModuleDAOServer.getInstance().selectAll<IInstantiatedPageComponent>(registered_template_component.type_id, 'where page_id = $1', [param.num]);

            res = res.concat(type_page_components);
        }

        WeightHandler.getInstance().sortByWeight(res);

        return res;
    }
}
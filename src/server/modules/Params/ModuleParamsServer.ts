
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleParamsServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleParamsServer.instance) {
            ModuleParamsServer.instance = new ModuleParamsServer();
        }
        return ModuleParamsServer.instance;
    }

    private static instance: ModuleParamsServer = null;

    private constructor() {
        super(ModuleParams.getInstance().name);
    }

    public async configure() {

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Paramètres' },
            'menu.menuelements.admin.param.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Paramètres' },
            'menu.menuelements.admin.ParamsAdminVueModule.___LABEL___'));

    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValue, this.getParamValue.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_setParamValue, this.setParamValue.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_setParamValue_if_not_exists, this.setParamValue_if_not_exists.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleParams.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Params'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleParams.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des Params'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async setParamValue(param_name: string, param_value: string | number | boolean) {
        let param: ParamVO = await ModuleDAO.getInstance().getNamedVoByName<ParamVO>(ParamVO.API_TYPE_ID, param_name);

        if (!param) {
            param = new ParamVO();
            param.name = param_name;
        }
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
    }

    public async setParamValue_if_not_exists(param_name: string, param_value: string | number | boolean) {
        let param: ParamVO = await ModuleDAO.getInstance().getNamedVoByName<ParamVO>(ParamVO.API_TYPE_ID, param_name);

        if (!!param) {
            return;
        }

        param = new ParamVO();
        param.name = param_name;
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
    }

    public async getParamValue(text: string): Promise<string> {
        let param: ParamVO = await ModuleDAO.getInstance().getNamedVoByName<ParamVO>(ParamVO.API_TYPE_ID, text);
        return param ? param.value : null;
    }
}
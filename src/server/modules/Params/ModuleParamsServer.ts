import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ParamsManager from '../../../shared/modules/Params/ParamsManager';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import ParamsServerController from './ParamsServerController';

export default class ModuleParamsServer extends ModuleServerBase {

    public static TASK_NAME_delete_params_cache = 'ModuleAccessPolicyServer.delete_params_cache';
    public static instance: ModuleParamsServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleParams.getInstance().name);

        ForkedTasksController.register_task(ModuleParamsServer.TASK_NAME_delete_params_cache, ParamsServerController.delete_params_cache);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleParamsServer.instance) {
            ModuleParamsServer.instance = new ModuleParamsServer();
        }
        return ModuleParamsServer.instance;
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Paramètres' },
            'menu.menuelements.admin.param.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Paramètres' },
            'menu.menuelements.admin.ParamsAdminVueModule.___LABEL___'));

        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handleTriggerPostCreateParam);

        const postUpateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUpateTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handleTriggerPostUpdateParam);

        const postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        postDeleteTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handleTriggerPostDeleteParam);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        // APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValue, this.getParamValue.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsString, ParamsServerController.getParamValueAsString.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsInt, ParamsServerController.getParamValueAsInt.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsBoolean, ParamsServerController.getParamValueAsBoolean.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsFloat, ParamsServerController.getParamValueAsFloat.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_setParamValue, ParamsServerController.setParamValue.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_setParamValue_if_not_exists, ParamsServerController.setParamValue_if_not_exists.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleParams.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Params'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleParams.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des Params'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    private async handleTriggerPostCreateParam(vo: ParamVO) {
        return ForkedTasksController.broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, vo) as any as Promise<void>;
    }

    private async handleTriggerPostUpdateParam(update: DAOUpdateVOHolder<ParamVO>) {
        await ForkedTasksController.broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, update.pre_update_vo);
        await ForkedTasksController.broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, update.post_update_vo);
    }

    private async handleTriggerPostDeleteParam(vo: ParamVO) {
        return ForkedTasksController.broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, vo) as any as Promise<void>;
    }
}
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';

export default class ModuleParamsServer extends ModuleServerBase {

    public static TASK_NAME_delete_params_cache = 'ModuleAccessPolicyServer.delete_params_cache';

    public static getInstance() {
        if (!ModuleParamsServer.instance) {
            ModuleParamsServer.instance = new ModuleParamsServer();
        }
        return ModuleParamsServer.instance;
    }

    private static instance: ModuleParamsServer = null;

    private throttled_param_cache_value: { [param_name: string]: any } = {};
    private throttled_param_cache_lastupdate_ms: { [param_name: string]: number } = {};
    private semaphore_param: { [param_name: string]: Promise<any> } = {};

    private constructor() {
        super(ModuleParams.getInstance().name);

        ForkedTasksController.getInstance().register_task(ModuleParamsServer.TASK_NAME_delete_params_cache, this.delete_params_cache.bind(this));
    }

    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Paramètres' },
            'menu.menuelements.admin.param.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Paramètres' },
            'menu.menuelements.admin.ParamsAdminVueModule.___LABEL___'));

        let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        postCreateTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handleTriggerPostCreateParam);

        let postUpateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        postUpateTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handleTriggerPostUpdateParam);

        let postDeleteTrigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);
        postDeleteTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handleTriggerPostDeleteParam);
    }

    public registerServerApiHandlers() {
        // APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValue, this.getParamValue.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsString, this.getParamValueAsString.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsInt, this.getParamValueAsInt.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsBoolean, this.getParamValueAsBoolean.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_getParamValueAsFloat, this.getParamValueAsFloat.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_setParamValue, this.setParamValue.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleParams.APINAME_setParamValue_if_not_exists, this.setParamValue_if_not_exists.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleParams.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Params'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleParams.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des Params'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async setParamValue_as_server(param_name: string, param_value: string | number | boolean, exec_as_server: boolean = true) {
        await this._setParamValue(param_name, param_value, true);
    }

    public async setParamValue(param_name: string, param_value: string | number | boolean) {
        await this._setParamValue(param_name, param_value, false);
    }

    public async setParamValue_if_not_exists(param_name: string, param_value: string | number | boolean) {
        let param: ParamVO = await query(ParamVO.API_TYPE_ID).filter_by_text_eq('name', param_name, ParamVO.API_TYPE_ID, true).select_vo<ParamVO>();

        if (!!param) {
            return;
        }

        param = new ParamVO();
        param.name = param_name;
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
    }

    public async getParamValueAsString_as_server(param_name: string, default_if_undefined: string = null, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<string> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? param_value : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    public async getParamValueAsInt_as_server(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<number> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseInt(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    public async getParamValueAsBoolean_as_server(param_name: string, default_if_undefined: boolean = false, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<boolean> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? (parseInt(param_value) != 0) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    public async getParamValueAsFloat_as_server(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<number> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseFloat(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    public async getParamValueAsString(param_name: string, default_if_undefined: string = null, max_cache_age_ms: number = null): Promise<string> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? param_value : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            false);
    }

    public async getParamValueAsInt(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null): Promise<number> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseInt(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            false);
    }

    public async getParamValueAsBoolean(param_name: string, default_if_undefined: boolean = false, max_cache_age_ms: number = null): Promise<boolean> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? (parseInt(param_value) != 0) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            false);
    }

    public async getParamValueAsFloat(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null): Promise<number> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseFloat(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            false);
    }

    private async handleTriggerPostCreateParam(vo: ParamVO) {
        await ForkedTasksController.getInstance().broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, vo);
    }

    private async handleTriggerPostUpdateParam(update: DAOUpdateVOHolder<ParamVO>) {
        await ForkedTasksController.getInstance().broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, update.pre_update_vo);
        await ForkedTasksController.getInstance().broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, update.post_update_vo);
    }

    private async handleTriggerPostDeleteParam(vo: ParamVO) {
        await ForkedTasksController.getInstance().broadexec(ModuleParamsServer.TASK_NAME_delete_params_cache, vo);
    }

    private delete_params_cache(vo: ParamVO) {
        delete this.throttled_param_cache_value[vo.name];
        delete this.throttled_param_cache_lastupdate_ms[vo.name];
        delete this.semaphore_param[vo.name];
    }

    private async getParamValue(
        text: string,
        transformer: (param_value: string) => any,
        default_if_undefined: string | number | boolean,
        max_cache_age_ms: number,
        exec_as_server: boolean = false): Promise<any> {

        if (max_cache_age_ms) {
            if (this.throttled_param_cache_lastupdate_ms[text] && (this.throttled_param_cache_lastupdate_ms[text] + max_cache_age_ms > Dates.now_ms())) {
                return this.throttled_param_cache_value[text];
            }
        }

        if (this.semaphore_param[text]) {
            /**
             * Cas d'un param qu'on demande en boucle ou avant le chargement en cours qui initialise le cache.
             *   On attend que le chargement en cours se termine et on retourne la valeur.
             */
            return await this.semaphore_param[text];
        }

        this.semaphore_param[text] = new Promise(async (resolve, reject) => {

            let param: ParamVO = null;
            try {
                param = await query(ParamVO.API_TYPE_ID)
                    .filter_by_text_eq('name', text, ParamVO.API_TYPE_ID, true)
                    .exec_as_server(exec_as_server)
                    .select_vo<ParamVO>();
            } catch (error) {
                ConsoleHandler.error('getParamValue:' + text + ':' + error);
            }
            let res = param ? transformer(param.value) : default_if_undefined;

            this.throttled_param_cache_lastupdate_ms[text] = Dates.now_ms();
            this.throttled_param_cache_value[text] = res;

            resolve(res);
        });
        return await this.semaphore_param[text];
    }

    private async _setParamValue(param_name: string, param_value: string | number | boolean, exec_as_server: boolean = false) {
        let param: ParamVO = await query(ParamVO.API_TYPE_ID)
            .filter_by_text_eq('name', param_name, ParamVO.API_TYPE_ID, true)
            .exec_as_server(exec_as_server)
            .select_vo<ParamVO>();

        if (!param) {
            param = new ParamVO();
            param.name = param_name;
        }
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(param, exec_as_server);
    }
}
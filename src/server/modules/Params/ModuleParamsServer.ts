
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

    private throttled_param_cache_value: { [param_name: string]: any } = {};
    private throttled_param_cache_lastupdate_ms: { [param_name: string]: number } = {};

    private constructor() {
        super(ModuleParams.getInstance().name);
    }

    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Paramètres' },
            'menu.menuelements.admin.param.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Paramètres' },
            'menu.menuelements.admin.ParamsAdminVueModule.___LABEL___'));

    }

    public registerServerApiHandlers() {
        // APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValue, this.getParamValue.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValueAsString, this.getParamValueAsString.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValueAsInt, this.getParamValueAsInt.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValueAsBoolean, this.getParamValueAsBoolean.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValueAsFloat, this.getParamValueAsFloat.bind(this));
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
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async setParamValue(param_name: string, param_value: string | number | boolean) {
        let param: ParamVO = await query(ParamVO.API_TYPE_ID).filter_by_text_eq('name', param_name, ParamVO.API_TYPE_ID, true).select_vo<ParamVO>();

        if (!param) {
            param = new ParamVO();
            param.name = param_name;
        }
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
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

    public async getParamValueAsString(param_name: string, default_if_undefined: string = null, max_cache_age_ms: number = null): Promise<string> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? param_value : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms);
    }

    public async getParamValueAsInt(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null): Promise<number> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseInt(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms);
    }

    public async getParamValueAsBoolean(param_name: string, default_if_undefined: boolean = false, max_cache_age_ms: number = null): Promise<boolean> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? (parseInt(param_value) != 0) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms);
    }

    public async getParamValueAsFloat(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null): Promise<number> {
        return await this.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseFloat(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms);
    }

    private async getParamValue(
        text: string,
        transformer: (param_value: string) => any,
        default_if_undefined: string | number | boolean,
        max_cache_age_ms: number): Promise<any> {

        if (max_cache_age_ms) {
            if (this.throttled_param_cache_lastupdate_ms[text] && (this.throttled_param_cache_lastupdate_ms[text] + max_cache_age_ms > Dates.now_ms())) {
                return this.throttled_param_cache_value[text];
            }
        }

        let param: ParamVO = await query(ParamVO.API_TYPE_ID).filter_by_text_eq('name', text, ParamVO.API_TYPE_ID, true).select_vo<ParamVO>();
        let res = param ? transformer(param.value) : default_if_undefined;

        this.throttled_param_cache_lastupdate_ms[text] = Dates.now_ms();
        this.throttled_param_cache_value[text] = res;

        return res;
    }
}
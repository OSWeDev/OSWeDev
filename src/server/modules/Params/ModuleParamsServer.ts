import * as moment from 'moment';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import SetParamParamVO from '../../../shared/modules/Params/vos/apis/SetParamParamVO';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';

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

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Paramètres' },
            'menu.menuelements.param.___LABEL___'));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleParams.APINAME_getParamValue, this.getParamValue.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleParams.APINAME_setParamValue, this.setParamValue.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleParams.APINAME_setParamValue_if_not_exists, this.setParamValue_if_not_exists.bind(this));
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

    public async setParamValue(set_param: SetParamParamVO) {
        let param: ParamVO = await ModuleDAO.getInstance().getNamedVoByName<ParamVO>(ParamVO.API_TYPE_ID, set_param.param_name);

        if (!param) {
            param = new ParamVO();
            param.name = set_param.param_name;
        }
        param.value = set_param.param_value;
        param.last_up_date = moment().utc(true);
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
    }

    public async setParamValue_if_not_exists(set_param: SetParamParamVO) {
        let param: ParamVO = await ModuleDAO.getInstance().getNamedVoByName<ParamVO>(ParamVO.API_TYPE_ID, set_param.param_name);

        if (!!param) {
            return;
        }

        param = new ParamVO();
        param.name = set_param.param_name;
        param.value = set_param.param_value;
        param.last_up_date = moment().utc(true);
        await ModuleDAO.getInstance().insertOrUpdateVO(param);
    }

    public async getParamValue(get_param: StringParamVO): Promise<string> {
        let param: ParamVO = await ModuleDAO.getInstance().getNamedVoByName<ParamVO>(ParamVO.API_TYPE_ID, get_param.text);
        return param ? param.value : null;
    }
}
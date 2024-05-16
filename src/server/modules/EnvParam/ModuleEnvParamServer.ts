import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleEnvParam from '../../../shared/modules/EnvParam/ModuleEnvParam';
import EnvParamsVO from '../../../shared/modules/EnvParam/vos/EnvParamsVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import EnvHandler from '../../../shared/tools/EnvHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleEnvParamServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleEnvParamServer.instance) {
            ModuleEnvParamServer.instance = new ModuleEnvParamServer();
        }
        return ModuleEnvParamServer.instance;
    }

    private static instance: ModuleEnvParamServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleEnvParam.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> { }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Modification du paramètre..."
        }, 'EnvParamsComponent.on_edit_field.start.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Erreur lors de la modification du paramètre."
        }, 'EnvParamsComponent.on_edit_field.error.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Paramètre modifié avec succès."
        }, 'EnvParamsComponent.on_edit_field.ok.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Static Env Params"
        }, 'menu.menuelements.admin.EnvParams.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Static Env Params"
        }, 'menu.menuelements.admin.EnvParamsAdminVueModule.___LABEL___'));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleEnvParam.APINAME_set_env_param_string, this.set_env_param_string.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEnvParam.APINAME_set_env_param_boolean, this.set_env_param_boolean.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEnvParam.APINAME_set_env_param_number, this.set_env_param_number.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleEnvParam.APINAME_get_env_params, this.get_env_params.bind(this));
    }

    public async set_env_param_string(code: string, value: string): Promise<boolean> {
        ConfigurationService.node_configuration[code] = value;
        EnvHandler[code] = value;
        return true;
    }

    public async set_env_param_boolean(code: string, value: boolean): Promise<boolean> {
        ConfigurationService.node_configuration[code] = value;
        EnvHandler[code] = value;
        return true;
    }

    public async set_env_param_number(code: string, value: number): Promise<boolean> {
        ConfigurationService.node_configuration[code] = value;
        EnvHandler[code] = value;
        return true;
    }

    public async get_env_params(): Promise<EnvParamsVO> {
        const res: EnvParamsVO = new EnvParamsVO();

        const fields = ModuleTableController.module_tables_by_vo_type[EnvParamsVO.API_TYPE_ID].get_fields();
        for (const i in fields) {
            const field = fields[i];
            res[field.field_id] = ConfigurationService.node_configuration[field.field_id];
        }
        return res;
    }
}
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleEnvParam from '../../../shared/modules/EnvParam/ModuleEnvParam';
import EnvParamsVO from '../../../shared/modules/EnvParam/vos/EnvParamsVO';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import EnvHandler from '../../../shared/tools/EnvHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ForkMessageController from '../Fork/ForkMessageController';
import ModuleServerBase from '../ModuleServerBase';
import SetEnvParamThreadMessage from './vos/SetEnvParamThreadMessage';

export default class ModuleEnvParamServer extends ModuleServerBase {

    public static UPDATE_ENVPARAM_EVENT_BASE_NAME: string = 'ModuleEnvParamServer.UPDATE_ENVPARAM.';

    private static instance: ModuleEnvParamServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleEnvParam.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleEnvParamServer.instance) {
            ModuleEnvParamServer.instance = new ModuleEnvParamServer();
        }
        return ModuleEnvParamServer.instance;
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> { }

    // istanbul ignore next: cannot test configure
    public async configure() {

        ForkMessageController.register_message_handler(SetEnvParamThreadMessage.FORK_MESSAGE_TYPE, this.set_env_param.bind(this));

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

    public set_env_param(msg: SetEnvParamThreadMessage): void {
        ConfigurationService.node_configuration[msg.message_content.env_param_name] = msg.message_content.env_param_value;
        EnvHandler[msg.message_content.env_param_name] = msg.message_content.env_param_value;
        EventsController.emit_event(EventifyEventInstanceVO.new_event(
            ModuleEnvParamServer.UPDATE_ENVPARAM_EVENT_BASE_NAME + msg.message_content.env_param_name, msg.message_content.env_param_value));
    }

    public async set_env_param_string(code: string, value: string): Promise<boolean> {
        this.broadcast_set_env_param(code, value);
        return true;
    }

    public async set_env_param_boolean(code: string, value: boolean): Promise<boolean> {
        this.broadcast_set_env_param(code, value);
        return true;
    }

    public async set_env_param_number(code: string, value: number): Promise<boolean> {
        this.broadcast_set_env_param(code, value);
        return true;
    }

    public async get_env_params(): Promise<EnvParamsVO> {
        const res: EnvParamsVO = new EnvParamsVO();

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[EnvParamsVO.API_TYPE_ID];
        for (const i in fields) {
            const field = fields[i];
            res[field.field_id] = ConfigurationService.node_configuration[field.field_id];
        }
        return res;
    }

    private async broadcast_set_env_param(code: string, value: boolean | string | number) {
        await ForkMessageController.broadcast(new SetEnvParamThreadMessage({ env_param_name: code, env_param_value: value }));
    }
}
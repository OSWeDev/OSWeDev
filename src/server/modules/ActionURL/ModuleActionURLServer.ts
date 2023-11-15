
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleActionURL from '../../../shared/modules/ActionURL/ModuleActionURL';
import ActionURLUserVO from '../../../shared/modules/ActionURL/vos/ActionURLUserVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleActionURLServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleActionURLServer.instance) {
            ModuleActionURLServer.instance = new ModuleActionURLServer();
        }
        return ModuleActionURLServer.instance;
    }

    private static instance: ModuleActionURLServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleActionURL.getInstance().name);
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> { }

    // istanbul ignore next: cannot test configure
    public async configure() { }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleActionURL.APINAME_action_url, this.action_url.bind(this));
    }

    /**
     * On appelle le callback (si tout est ok) et on passe en param le action_url et l'uid (et les req: Request, res: Response de l'API)
     * Par ailleurs on met à jour le compteur de l'action_url
     * @param code
     * @returns
     */
    private async action_url(code: string, req: Request, res: Response): Promise<void> {

        let uid = ModuleAccessPolicyServer.getLoggedUserId();

        /**
         * On ne gère pas d'action anonyme pour le moment
         */
        if (!uid) {
            ConsoleHandler.error('Anonymous user cannot use action_url:' + code);
            return;
        }

        let action_url = await query(ActionURLVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<ActionURLUserVO>().user_id, uid, ActionURLUserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<ActionURLVO>().action_code, code)
            .filter_by_num_not_eq(field_names<ActionURLVO>().action_remaining_counter, 0)
            .exec_as_server()
            .select_vo<ActionURLVO>();

        if (!action_url) {
            ConsoleHandler.error('No action_url found for code:' + code + ': or this user does not have access to it:' + uid + ': or this action_url has no remaining counter.');
            return;
        }

        if (!action_url.action_callback_module_name) {
            ConsoleHandler.error('No action_callback_module_name found for action_url:' + code);
            return;
        }

        let module_instance = ModulesManager.getInstance().getModuleByNameAndRole(action_url.action_callback_module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME);

        if (!module_instance) {
            ConsoleHandler.error('No module found for action_url:' + code + ': module_name:' + action_url.action_callback_module_name);
            return;
        }

        if (!module_instance[action_url.action_callback_function_name]) {
            ConsoleHandler.error('No function found for action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name);
            return;
        }

        if (action_url.action_remaining_counter == 0) {
            ConsoleHandler.error('No more remaining counter for action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name);
            return;
        }

        try {

            // Si -1, infini
            if (action_url.action_remaining_counter > 0) {
                action_url.action_remaining_counter--;
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(action_url);

            await module_instance[action_url.action_callback_function_name](action_url, uid, req, res);
        } catch (error) {
            ConsoleHandler.error('Error in action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name + ': error:' + error);
        }
    }
}
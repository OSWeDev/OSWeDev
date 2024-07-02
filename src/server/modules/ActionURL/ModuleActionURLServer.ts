import { Request, Response } from 'express';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleActionURL from '../../../shared/modules/ActionURL/ModuleActionURL';
import ActionURLCRVO from '../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLUserVO from '../../../shared/modules/ActionURL/vos/ActionURLUserVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import ContextFilterVOHandler from '../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextQueryVO, { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import IUserData from '../../../shared/modules/DAO/interface/IUserData';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
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
    public async configure() {
        ModuleDAOServer.getInstance().registerContextAccessHook(ActionURLVO.API_TYPE_ID, this, this.filterActionURLVOContextAccessHook);

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Cette action n'existe pas ou vous n'y avez pas accès."
        }, 'action_url.not_found.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "En cours..."
        }, 'OseliaThreadMessageActionURLComponent.execute_action_url.encours.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Echec de l'action"
        }, 'OseliaThreadMessageActionURLComponent.execute_action_url.failed.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': "Action effectuée avec succès"
        }, 'OseliaThreadMessageActionURLComponent.execute_action_url.ok.___LABEL___'));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleActionURL.APINAME_action_url, this.action_url.bind(this));
    }

    private async filterActionURLVOContextAccessHook(moduletable: ModuleTableVO, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]): Promise<ContextQueryVO> {

        const res: ContextQueryVO = query(ActionURLVO.API_TYPE_ID);

        if (!uid) {
            return ContextFilterVOHandler.get_empty_res_context_hook_query(moduletable.vo_type);
        }

        return query(ActionURLVO.API_TYPE_ID).field(field_names<ActionURLVO>().id).filter_by_num_eq(field_names<ActionURLUserVO>().user_id, uid, ActionURLUserVO.API_TYPE_ID).exec_as_server();
    }

    /**
     * On appelle le callback (si tout est ok) et on passe en param le action_url et l'uid (et les req: Request, res: Response de l'API)
     * Par ailleurs on met à jour le compteur de l'action_url
     * @param code
     * @returns
     */
    private async action_url(code: string, do_not_redirect: boolean, req: Request, res: Response): Promise<boolean> {

        const uid = ModuleAccessPolicyServer.getLoggedUserId();

        /**
         * On ne gère pas d'action anonyme pour le moment
         */
        if (!uid) {
            ConsoleHandler.error('Anonymous user cannot use action_url:' + code);
            return false;
        }

        const action_url = await query(ActionURLVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<ActionURLUserVO>().user_id, uid, ActionURLUserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<ActionURLVO>().action_code, code)
            .exec_as_server()
            .select_vo<ActionURLVO>();

        if (!action_url) {
            ConsoleHandler.error('No action_url found for code:' + code + ': or this user does not have access to it:' + uid + ':');
            return false;
        }

        try {
            const action_res = await this.do_action_url(action_url, code, uid, req, res);
            if ((!res.headersSent) && (!do_not_redirect)) {
                // par défaut on redirige vers la page de consultation des crs de cette action_url si aucune redirection n'a été faite
                res.redirect('/#/action_url_cr/' + action_url.id);
            }

            return action_res;
        } catch (error) {
            ConsoleHandler.error('Error in action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name + ': error:' + error);
        }
        return false;
    }

    private async do_action_url(action_url: ActionURLVO, code: string, uid: number, req: Request, res: Response): Promise<boolean> {
        if (action_url.action_remaining_counter == 0) {
            ConsoleHandler.error('No more remaining counter for action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name);
            return false;
        }

        if (!action_url.action_callback_module_name) {
            ConsoleHandler.error('No action_callback_module_name found for action_url:' + code);
            return false;
        }

        const module_instance = ModulesManager.getInstance().getModuleByNameAndRole(action_url.action_callback_module_name, ModuleServerBase.SERVER_MODULE_ROLE_NAME);

        if (!module_instance) {
            ConsoleHandler.error('No module found for action_url:' + code + ': module_name:' + action_url.action_callback_module_name);
            return false;
        }

        if (!module_instance[action_url.action_callback_function_name]) {
            ConsoleHandler.error('No function found for action_url:' + code + ': module_name:' + action_url.action_callback_module_name + ': function_name:' + action_url.action_callback_function_name);
            return false;
        }

        // Si -1, infini
        if (action_url.action_remaining_counter > 0) {
            action_url.action_remaining_counter--;
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(action_url);

        const action_cr: ActionURLCRVO = await module_instance[action_url.action_callback_function_name](action_url, uid, req, res);

        if (action_cr) {
            action_cr.action_url_id = action_url.id;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(action_cr);
        }

        return (!action_cr) ||
            (action_cr.cr_type == ActionURLCRVO.CR_TYPE_SUCCESS) ||
            (action_cr.cr_type == ActionURLCRVO.CR_TYPE_INFO);
    }
}
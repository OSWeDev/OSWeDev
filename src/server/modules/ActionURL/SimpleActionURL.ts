import ModuleActionURL from '../../../shared/modules/ActionURL/ModuleActionURL';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ActionURLServerTools from './ActionURLServerTools';
import ModuleActionURLServer from './ModuleActionURLServer';

export interface ISimpleActionURLParams {
    url: string;
}

export default class SimpleActionURL {

    public static UID: number = 0;

    public static async create_simple_action_url(
        unique_action_name: string,
        bootstrap_button_type: number,
        button_translatable_name: string,
        button_translatable_name_params_json: string,
        button_fc_icon_classnames: string[],
        target_url: string,
        valid_ts_range:TSRange,
        action_remaining_counter: number = -1,
    ): Promise<ActionURLVO> {
        const action = new ActionURLVO();

        action.action_name = unique_action_name;
        action.action_code = ActionURLServerTools.get_unique_code_from_text(action.action_name);
        action.action_remaining_counter = action_remaining_counter;
        action.params = {url: target_url} as ISimpleActionURLParams;
        action.valid_ts_range = valid_ts_range;

        action.action_callback_function_name = reflect<ModuleActionURLServer>().simple_open_url_from_action_url;
        action.action_callback_module_name = ModuleActionURL.getInstance().name;

        action.button_bootstrap_type = bootstrap_button_type;
        action.button_translatable_name = button_translatable_name;
        action.button_translatable_name_params_json = button_translatable_name_params_json;
        action.button_fc_icon_classnames = button_fc_icon_classnames;

        const res = await ModuleDAOServer.instance.insertOrUpdateVO_as_server(action);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('Impossible de créer l\'action URL pour le bouton de redirection : ' + action.action_name + ' - ' + action.action_code + ' - ' + target_url);
            return null;
        }

        await ActionURLServerTools.add_right_for_admins_on_action_url(action);

        return action;
    }
}
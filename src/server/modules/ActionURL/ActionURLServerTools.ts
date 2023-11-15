
import { createHash } from 'crypto';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleServerBase from '../ModuleServerBase';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import ConfigurationService from '../../env/ConfigurationService';

export default class ActionURLServerTools extends ModuleServerBase {

    public static UID: number = 0;

    public static get_unique_code_from_text(text: string): string {
        let this_uid = ActionURLServerTools.UID++;
        let tsms = Dates.now_ms();
        return createHash('sha256').update(text + this_uid).digest('hex') + tsms.toString() + this_uid.toString();
    }

    public static get_action_full_url(action_url: ActionURLVO): string {
        return ConfigurationService.node_configuration.BASE_URL + 'api_handler/action_url/' + action_url.action_code;
    }
}
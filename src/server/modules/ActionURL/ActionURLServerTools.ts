
import { createHash } from 'crypto';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ActionURLUserVO from '../../../shared/modules/ActionURL/vos/ActionURLUserVO';
import ActionURLVO from '../../../shared/modules/ActionURL/vos/ActionURLVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';

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

    public static async add_right_for_admins_on_action_url(action_url: ActionURLVO) {
        let admin_users: UserVO[] = await query(UserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<RoleVO>().translatable_name, ModuleAccessPolicy.ROLE_ADMIN, RoleVO.API_TYPE_ID)
            .using(UserRoleVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<UserVO>();

        let vos = [];
        for (let i in admin_users) {
            let admin_user = admin_users[i];

            let action_url_user: ActionURLUserVO = new ActionURLUserVO();
            action_url_user.action_id = action_url.id;
            action_url_user.user_id = admin_user.id;

            vos.push(action_url_user);
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(vos);
    }

}
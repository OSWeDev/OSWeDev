
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
import ActionURLCRVO from '../../../shared/modules/ActionURL/vos/ActionURLCRVO';

export default class ActionURLServerTools extends ModuleServerBase {

    public static UID: number = 0;

    public static get_unique_code_from_text(text: string): string {
        const this_uid = ActionURLServerTools.UID++;
        const tsms = Math.round(Dates.now_ms());
        return createHash('sha256').update(text + this_uid).digest('hex') + tsms.toString() + this_uid.toString();
    }

    public static get_action_full_url(action_url: ActionURLVO, do_not_redirect: boolean = false): string {
        return ConfigurationService.node_configuration.BASE_URL + 'api_handler/action_url/' + action_url.action_code + '/' + (do_not_redirect ? 'true' : 'false');
    }

    public static async add_right_for_admins_on_action_url(action_url: ActionURLVO) {
        const admin_users: UserVO[] = await query(UserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<RoleVO>().translatable_name, ModuleAccessPolicy.ROLE_ADMIN, RoleVO.API_TYPE_ID)
            .using(UserRoleVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<UserVO>();

        const vos = [];
        for (const i in admin_users) {
            const admin_user = admin_users[i];

            const action_url_user: ActionURLUserVO = new ActionURLUserVO();
            action_url_user.action_id = action_url.id;
            action_url_user.user_id = admin_user.id;

            vos.push(action_url_user);
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(vos);
    }

    public static create_error_cr(action_url: ActionURLVO, translatable_cr_title: string, translatable_cr_title_params_json: string = null, cr_translatable_text: string = null, translatable_cr_content_params_json: string = null): ActionURLCRVO {
        const res: ActionURLCRVO = new ActionURLCRVO();

        res.action_url_id = action_url.id;
        res.cr_type = ActionURLCRVO.CR_TYPE_ERROR;

        res.translatable_cr_title = translatable_cr_title;
        res.translatable_cr_title_params_json = translatable_cr_title_params_json;

        res.translatable_cr_content = cr_translatable_text;
        res.translatable_cr_content_params_json = translatable_cr_content_params_json;

        res.ts = Dates.now();

        return res;
    }

    public static create_info_cr(action_url: ActionURLVO, translatable_cr_title: string, translatable_cr_title_params_json: string = null, cr_translatable_text: string = null, translatable_cr_content_params_json: string = null): ActionURLCRVO {
        const res: ActionURLCRVO = new ActionURLCRVO();

        res.action_url_id = action_url.id;
        res.cr_type = ActionURLCRVO.CR_TYPE_INFO;

        res.translatable_cr_title = translatable_cr_title;
        res.translatable_cr_title_params_json = translatable_cr_title_params_json;

        res.translatable_cr_content = cr_translatable_text;
        res.translatable_cr_content_params_json = translatable_cr_content_params_json;

        res.ts = Dates.now();

        return res;
    }

    public static create_warn_cr(action_url: ActionURLVO, translatable_cr_title: string, translatable_cr_title_params_json: string = null, cr_translatable_text: string = null, translatable_cr_content_params_json: string = null): ActionURLCRVO {
        const res: ActionURLCRVO = new ActionURLCRVO();

        res.action_url_id = action_url.id;
        res.cr_type = ActionURLCRVO.CR_TYPE_WARNING;

        res.translatable_cr_title = translatable_cr_title;
        res.translatable_cr_title_params_json = translatable_cr_title_params_json;

        res.translatable_cr_content = cr_translatable_text;
        res.translatable_cr_content_params_json = translatable_cr_content_params_json;

        res.ts = Dates.now();

        return res;
    }

    public static create_success_cr(action_url: ActionURLVO, translatable_cr_title: string, translatable_cr_title_params_json: string = null, cr_translatable_text: string = null, translatable_cr_content_params_json: string = null): ActionURLCRVO {
        const res: ActionURLCRVO = new ActionURLCRVO();

        res.action_url_id = action_url.id;
        res.cr_type = ActionURLCRVO.CR_TYPE_SUCCESS;

        res.translatable_cr_title = translatable_cr_title;
        res.translatable_cr_title_params_json = translatable_cr_title_params_json;

        res.translatable_cr_content = cr_translatable_text;
        res.translatable_cr_content_params_json = translatable_cr_content_params_json;

        res.ts = Dates.now();

        return res;
    }
}
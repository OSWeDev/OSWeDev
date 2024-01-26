
import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';

export default class ActionURLVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "action_url";

    public static STATE_LABELS: string[] = ['action_url.STATE_ACTIVATED', 'action_url.STATE_CLOSED'];
    public static STATE_ACTIVATED: number = 0;
    public static STATE_CLOSED: number = 1;

    public static BOOTSTRAP_BUTTON_TYPE_LABELS: string[] = [
        'action_url.BOOTSTRAP_BUTTON_TYPE_PRIMARY',
        'action_url.BOOTSTRAP_BUTTON_TYPE_SECONDARY',
        'action_url.BOOTSTRAP_BUTTON_TYPE_SUCCESS',
        'action_url.BOOTSTRAP_BUTTON_TYPE_DANGER',
        'action_url.BOOTSTRAP_BUTTON_TYPE_WARNING',
        'action_url.BOOTSTRAP_BUTTON_TYPE_INFO',
        'action_url.BOOTSTRAP_BUTTON_TYPE_LIGHT',
        'action_url.BOOTSTRAP_BUTTON_TYPE_DARK',
        'action_url.BOOTSTRAP_BUTTON_TYPE_LINK'
    ];
    public static BOOTSTRAP_BUTTON_TYPE_PRIMARY: number = 0;
    public static BOOTSTRAP_BUTTON_TYPE_SECONDARY: number = 1;
    public static BOOTSTRAP_BUTTON_TYPE_SUCCESS: number = 2;
    public static BOOTSTRAP_BUTTON_TYPE_DANGER: number = 3;
    public static BOOTSTRAP_BUTTON_TYPE_WARNING: number = 4;
    public static BOOTSTRAP_BUTTON_TYPE_INFO: number = 5;
    public static BOOTSTRAP_BUTTON_TYPE_LIGHT: number = 6;
    public static BOOTSTRAP_BUTTON_TYPE_DARK: number = 7;
    public static BOOTSTRAP_BUTTON_TYPE_LINK: number = 8;

    public static BOOTSTRAP_BUTTON_TYPE_CORRESPONDING_BOOTSTRAP_CLASSNAME: string[] = [
        'btn-primary',
        'btn-secondary',
        'btn-success',
        'btn-danger',
        'btn-warning',
        'btn-info',
        'btn-light',
        'btn-dark',
        'btn-link'
    ];

    public id: number;
    public _type: string = ActionURLVO.API_TYPE_ID;

    public valid_ts_range: TSRange;
    public action_code: string;
    public action_name: string;

    public button_translatable_name: string;
    public button_translatable_name_params_json: string;
    public button_fc_icon_classnames: string[];
    public button_bootstrap_type: number;

    public state: number;

    public action_callback_module_name: string;
    public action_callback_function_name: string;

    public params_json: string;

    public action_remaining_counter: number;
}

import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';

export default class ActionURLVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "action_url";

    public static STATE_LABELS: string[] = ['action_url.STATE_ACTIVATED', 'action_url.STATE_CLOSED'];
    public static STATE_ACTIVATED: number = 0;
    public static STATE_CLOSED: number = 1;

    public id: number;
    public _type: string = ActionURLVO.API_TYPE_ID;

    public valid_ts_range: TSRange;
    public action_code: string;
    public action_name: string;

    public state: number;

    public action_callback_module_name: string;
    public action_callback_function_name: string;

    public params_json: string;

    public action_remaining_counter: number;
}
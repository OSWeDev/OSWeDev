
import IDistantVOBase from '../../IDistantVOBase';

export default class ActionURLCRVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "action_url_cr";

    public static CR_TYPE_LABELS: string[] = ['action_url_cr.CR_TYPE_INFO', 'action_url_cr.CR_TYPE_WARNING', 'action_url_cr.CR_TYPE_ERROR', 'action_url_cr.CR_TYPE_SUCCESS'];
    public static CR_TYPE_INFO: number = 0;
    public static CR_TYPE_WARNING: number = 1;
    public static CR_TYPE_ERROR: number = 2;
    public static CR_TYPE_SUCCESS: number = 3;

    public id: number;
    public _type: string = ActionURLCRVO.API_TYPE_ID;

    public action_url_id: number;

    public translatable_cr_title: string;
    public translatable_cr_title_params_json: string;

    public translatable_cr_content: string;
    public translatable_cr_content_params_json: string;

    public ts: number;
    public cr_type: number;
}
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class EventifyActionVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "eventify_action";

    public static STATE_LABELS: string[] = [
        "EventifyActionVO.STATE_TODO",
        "EventifyActionVO.STATE_RUNNING",
        "EventifyActionVO.STATE_RUN_ENDED",
        "EventifyActionVO.STATE_DONE",
        "EventifyActionVO.STATE_ERROR",
        "EventifyActionVO.STATE_CANCELLED",
        "EventifyActionVO.STATE_EXPIRED",
        "EventifyActionVO.STATE_NEEDS_RERUN",
        "EventifyActionVO.STATE_RERUN_ASKED"
    ];
    public static STATE_TODO: number = 0;
    public static STATE_RUNNING: number = 1;
    public static STATE_RUN_ENDED: number = 2;
    public static STATE_DONE: number = 3;
    public static STATE_ERROR: number = 4;
    public static STATE_CANCELLED: number = 5;
    public static STATE_EXPIRED: number = 6;
    public static STATE_NEEDS_RERUN: number = 7;
    public static STATE_RERUN_ASKED: number = 8;

    public static ACTION_TYPE_LABELS: string[] = [
        "EventifyActionVO.ACTION_TYPE_OSELIA_RUN_TEMPLATE",
        "EventifyActionVO.ACTION_TYPE_BG",
        "EventifyActionVO.ACTION_TYPE_VALIDATION"
    ];

    public id: number;
    public _type: string = EventifyActionVO.API_TYPE_ID;

    public name: string;
    public description: string;

    public action_type: number;
    public current_state: number;

    public action_group_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}
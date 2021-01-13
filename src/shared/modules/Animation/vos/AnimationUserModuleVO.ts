import { Moment } from 'moment';
import IDistantVOBase from '../../IDistantVOBase';

export default class AnimationUserModuleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "anim_user_module";

    public static LIKE_VOTE_BAD: number = 0;
    public static LIKE_VOTE_GOOD: number = 1;
    public static LIKE_VOTE_VERY_GOOD: number = 2;
    public static LIKE_VOTE_LABELS: { [like_vote_id: number]: string } = {
        [AnimationUserModuleVO.LIKE_VOTE_BAD]: 'animation_um.like_vote.bad',
        [AnimationUserModuleVO.LIKE_VOTE_GOOD]: 'animation_um.like_vote.good',
        [AnimationUserModuleVO.LIKE_VOTE_VERY_GOOD]: 'animation_um.like_vote.very_good',
    };

    public id: number;
    public _type: string = AnimationUserModuleVO.API_TYPE_ID;

    public like_vote: number;
    public commentaire: string;
    public start_date: Moment;
    public end_date: Moment;

    public module_id: number;
    public user_id: number;
}
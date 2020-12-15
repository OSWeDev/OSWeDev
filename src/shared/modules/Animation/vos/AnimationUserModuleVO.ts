import { Moment } from 'moment';
import IDistantVOBase from '../../IDistantVOBase';

export default class AnimationUserModuleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "anim_user_module";

    public id: number;
    public _type: string = AnimationUserModuleVO.API_TYPE_ID;

    public like_vote: boolean;
    public commentaire: string;
    public start_date: Moment;
    public end_date: Moment;

    public module_id: number;
    public user_id: number;
}
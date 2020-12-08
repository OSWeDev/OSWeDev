import IDistantVOBase from '../../IDistantVOBase';

export default class AnimationUserQRVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "anim_user_qr";

    public id: number;
    public _type: string = AnimationUserQRVO.API_TYPE_ID;

    public reponses: number[];

    public qr_id: number;
    public user_id: number;
}
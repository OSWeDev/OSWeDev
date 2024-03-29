
import IDistantVOBase from '../../IDistantVOBase';

/**
 * Représente la session d’un user sur une question.
 * @property {number[]} reponses: reponses données par l'utilisateur
 * @property {number} qr_id: la question (AnimationQRVO.ts)
 * @property {number} date: date a laquelle la réponse & été donnée
 * @abréviation uqr
 */
export default class AnimationUserQRVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "anim_user_qr";

    public id: number;
    public _type: string = AnimationUserQRVO.API_TYPE_ID;

    public reponses: number[];

    public qr_id: number;
    public user_id: number;

    public date: number;
}
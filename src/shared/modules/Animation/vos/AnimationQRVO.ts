import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class AnimationQRVO implements IWeightedItem, INamedVO {

    public static API_TYPE_ID: string = "anim_qr";

    public static TYPE_QR_QUIZZ: number = 0;
    public static TYPE_QR_PHOTO: number = 1;
    public static TYPE_QR_VIDEO: number = 2;
    public static TYPE_QR_LABELS: { [type_qr_id: number]: string } = {
        [AnimationQRVO.TYPE_QR_QUIZZ]: 'animation_qr.type_qr.quizz',
        [AnimationQRVO.TYPE_QR_PHOTO]: 'animation_qr.type_qr.photo',
        [AnimationQRVO.TYPE_QR_VIDEO]: 'animation_qr.type_qr.video',
    };

    public id: number;
    public _type: string = AnimationQRVO.API_TYPE_ID;

    public description: string;
    public reponses: string;
    public explicatif: string;
    public type_qr: number;
    public external_video: string;

    public name: string;
    public weight: number;

    public question_file_id: number;
    public reponse_file_id: number;
    public module_id: number;
}
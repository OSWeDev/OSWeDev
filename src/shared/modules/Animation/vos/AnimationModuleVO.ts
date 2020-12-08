import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class AnimationModuleVO implements IWeightedItem, INamedVO {

    public static TYPE_MODULE_QUIZZ: number = 0;
    public static TYPE_MODULE_PHOTO: number = 1;
    public static TYPE_MODULE_VIDEO: number = 2;
    public static TYPE_MODULE_LABELS: { [type_module_id: number]: string } = {
        [AnimationModuleVO.TYPE_MODULE_QUIZZ]: 'animation_module.type_module.quizz',
        [AnimationModuleVO.TYPE_MODULE_PHOTO]: 'animation_module.type_module.photo',
        [AnimationModuleVO.TYPE_MODULE_VIDEO]: 'animation_module.type_module.video',
    };

    public static API_TYPE_ID: string = "anim_module";

    public id: number;
    public _type: string = AnimationModuleVO.API_TYPE_ID;

    public description: string;
    public type_module: number;
    public messages: string;

    public name: string;
    public weight: number;

    public theme_id: number;
}
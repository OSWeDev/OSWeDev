import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class AnimationModuleVO implements IWeightedItem, INamedVO {

    public static API_TYPE_ID: string = "anim_module";

    public id: number;
    public _type: string = AnimationModuleVO.API_TYPE_ID;

    public description: string;
    public messages: string;

    public name: string;
    public weight: number;

    public theme_id: number;
}
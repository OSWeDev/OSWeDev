import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class AnimationThemeVO implements IWeightedItem, INamedVO {

    public static API_TYPE_ID: string = "anim_theme";

    public id: number;
    public _type: string = AnimationThemeVO.API_TYPE_ID;

    public description: string;

    public name: string;
    public weight: number;
}
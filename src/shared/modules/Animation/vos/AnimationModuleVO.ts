import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';
import NumRange from '../../DataRender/vos/NumRange';

export default class AnimationModuleVO implements IWeightedItem, INamedVO {

    public static API_TYPE_ID: string = "anim_module";

    public id: number;
    public _type: string = AnimationModuleVO.API_TYPE_ID;

    public description: string;
    public messages: string;

    public name: string;
    public computed_name: string;
    public weight: number;

    public theme_id: number;
    public document_id: number;
    public role_id_ranges: NumRange[];

    public theme_id_import: number;
    public id_import: number;
}
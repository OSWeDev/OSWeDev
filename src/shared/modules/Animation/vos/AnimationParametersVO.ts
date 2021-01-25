import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';

export default class AnimationParametersVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "anim_parameters";

    public id: number;
    public _type: string = AnimationParametersVO.API_TYPE_ID;

    public seuil_validation_module_prct: number;

    public image_home_id: number;
    public document_id_ranges: NumRange[];
}
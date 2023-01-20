import IDistantVOBase from '../../IDistantVOBase';

export default class VarParamFieldTransformStrategyVO implements IDistantVOBase {

    /**
     * Comportement par défaut, on copie le param actuel pour ce champs
     */
    public static TYPE_COPY: number = 0;
    /**
     * Déplacement du segment de X segment_type (2 paramètres)
     */
    public static TYPE_SEGMENT_SHIFT: number = 1;
    /**
     * Découper une dep par segmentation (ex: par PDV)
     */
    public static TYPE_SEGMENT_SPLIT: number = 2;

    public static TYPE_LABELS: { [id: number]: string } = {
        [VarParamFieldTransformStrategyVO.TYPE_COPY]: 'var_conf_auto_dep.type.copy',
        [VarParamFieldTransformStrategyVO.TYPE_SEGMENT_SHIFT]: 'var_conf_auto_dep.type.segment_shift',
        [VarParamFieldTransformStrategyVO.TYPE_SEGMENT_SPLIT]: 'var_conf_auto_dep.type.segment_split',
    };

    public static API_TYPE_ID: string = "var_conf_auto_dep";

    public id: number;
    public _type: string = VarParamFieldTransformStrategyVO.API_TYPE_ID;

    public type: number;

    /**
     * Dans le cas d'un shift, le nombre de segment à décaler
     */
    public shift_size: number;

    /**
     * Dans le cas d'un shift, le type de segmentation
     */
    public segmentation_type: number;
}
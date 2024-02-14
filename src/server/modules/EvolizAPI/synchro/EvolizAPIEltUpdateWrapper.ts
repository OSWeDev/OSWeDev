import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class EvolizAPIEltUpdateWrapper<EvolizeAPIType, VOType extends IDistantVOBase> {
    public constructor(
        public evoliz_item: EvolizeAPIType,
        public vo_item: VOType
    ) { }
}
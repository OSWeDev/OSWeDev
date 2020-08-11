import IDistantVOBase from '../../IDistantVOBase';

export default class VarCacheConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "var_cache_conf";

    public id: number;
    public _type: string = VarCacheConfVO.API_TYPE_ID;

    public var_id: number;

    public consider_null_as_0_and_auto_clean_0_in_cache: boolean;

    /**
     * 0 => infini
     */
    public cache_timeout_ms: number;
}
import VarConfVOBase from '../vos/VarConfVOBase';
import VarCacheConfVO from '../vos/VarCacheConfVO';

export default class ConfigureVarCacheParamVO {

    public static async translateCheckAccessParams(
        var_conf: VarConfVOBase, var_cache_conf: VarCacheConfVO): Promise<ConfigureVarCacheParamVO> {

        return new ConfigureVarCacheParamVO(var_conf, var_cache_conf);
    }

    public constructor(
        public var_conf: VarConfVOBase, public var_cache_conf: VarCacheConfVO) {
    }
}
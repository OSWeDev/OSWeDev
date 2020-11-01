import VarConfVO from '../vos/VarConfVO';
import VarCacheConfVO from '../vos/VarCacheConfVO';

export default class ConfigureVarCacheParamVO {

    public static async translateCheckAccessParams(
        var_conf: VarConfVO, var_cache_conf: VarCacheConfVO): Promise<ConfigureVarCacheParamVO> {

        return new ConfigureVarCacheParamVO(var_conf, var_cache_conf);
    }

    public constructor(
        public var_conf: VarConfVO, public var_cache_conf: VarCacheConfVO) {
    }
}
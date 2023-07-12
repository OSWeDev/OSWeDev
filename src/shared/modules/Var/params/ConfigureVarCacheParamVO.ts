/* istanbul ignore file : nothing to test in ParamVOs */

import VarConfVO from '../vos/VarConfVO';
import VarCacheConfVO from '../vos/VarCacheConfVO';
import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';

export default class ConfigureVarCacheParamVO implements IAPIParamTranslator<ConfigureVarCacheParamVO> {

    public static fromParams(var_conf: VarConfVO, var_cache_conf: VarCacheConfVO): ConfigureVarCacheParamVO {

        return new ConfigureVarCacheParamVO(var_conf, var_cache_conf);
    }

    public static getAPIParams(param: ConfigureVarCacheParamVO): any[] {
        return [param.var_conf, param.var_cache_conf];
    }

    public constructor(
        public var_conf: VarConfVO, public var_cache_conf: VarCacheConfVO) {
    }
}

export const ConfigureVarCacheParamVOStatic: IAPIParamTranslatorStatic<ConfigureVarCacheParamVO> = ConfigureVarCacheParamVO;
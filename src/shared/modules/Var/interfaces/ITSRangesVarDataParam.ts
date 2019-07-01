import TSRange from '../../DataRender/vos/TSRange';
import IVarMatroidDataParamVO from './IVarMatroidDataParamVO';

export default interface ITSRangesVarDataParam extends IVarMatroidDataParamVO {
    ts_ranges: TSRange[];
}
import TSRange from '../../DataRender/vos/TSRange';
import IVarDataParamVOBase from './IVarDataParamVOBase';

export default interface ITSRangesVarDataParam extends IVarDataParamVOBase {
    ts_ranges: TSRange[];
}
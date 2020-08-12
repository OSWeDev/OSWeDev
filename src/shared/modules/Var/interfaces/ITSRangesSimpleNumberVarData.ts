import TSRange from '../../DataRender/vos/TSRange';
import IVarDataVOBase from './IVarDataVOBase';

export default interface ITSRangesSimpleNumberVarData extends IVarDataVOBase {
    ts_ranges: TSRange[];
}
import ISimpleNumberVarData from './ISimpleNumberVarData';
import ITSRangesVarDataParam from './ITSRangesVarDataParam';

export default interface ITSRangesSimpleNumberVarData extends ISimpleNumberVarData, ITSRangesVarDataParam {
    value: number;
}
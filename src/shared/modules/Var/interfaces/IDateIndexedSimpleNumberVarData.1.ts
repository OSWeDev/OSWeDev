import IDateIndexedVarDataParam from './IDateIndexedVarDataParam';
import ISimpleNumberVarData from './ISimpleNumberVarData';

export default interface IDateIndexedSimpleNumberVarData extends ISimpleNumberVarData, IDateIndexedVarDataParam {
    value: number;
}
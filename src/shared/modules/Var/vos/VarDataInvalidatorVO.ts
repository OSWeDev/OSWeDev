
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataInvalidatorVO {

    public static INVALIDATOR_TYPE_LABELS: string[] = ['invalidator.value_type.exact', 'invalidator.value_type.included_or_exact', 'invalidator.value_type.intersected'];
    public static INVALIDATOR_TYPE_EXACT: number = 0;
    public static INVALIDATOR_TYPE_INCLUDED_OR_EXACT: number = 1;
    public static INVALIDATOR_TYPE_INTERSECTED: number = 2;

    public constructor(
        public var_data: VarDataBaseVO,
        public invalidator_type: number = VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT,
        public propagate_to_parents: boolean = true,
        public invalidate_denied: boolean = false,
        public invalidate_imports: boolean = false
    ) { }
}
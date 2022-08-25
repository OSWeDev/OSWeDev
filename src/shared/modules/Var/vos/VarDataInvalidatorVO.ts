
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataInvalidatorVO {

    public static INVALIDATOR_TYPE_LABELS: string[] = ['var_data.value_type.import', 'var_data.value_type.computed', 'var_data.value_type.denied'];
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
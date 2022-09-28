import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";

export default class ThrottleGetVarDatasByIndex {

    public static ThrottleGetVarDatasByIndex_index: number = 1;

    public index: number = null;
    public semaphore: boolean = false;

    public constructor(
        public var_data_api_type_id: string,
        public var_data_index: string,
        public cb: (vo: VarDataBaseVO) => void) {
        this.index = ThrottleGetVarDatasByIndex.ThrottleGetVarDatasByIndex_index++;
    }
}
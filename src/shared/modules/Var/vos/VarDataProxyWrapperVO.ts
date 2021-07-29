
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataProxyWrapperVO<T extends VarDataBaseVO> {

    public var_data_origin_value: number;
    public var_data_origin_type: number;

    public constructor(
        public var_data: T,
        public needs_insert_or_update_: boolean = false,
        public nb_reads_since_last_insert_or_update: number = 0,
        public last_insert_or_update: number = null) {
        this.var_data_origin_value = var_data.value;
        this.var_data_origin_type = var_data.value_type;
    }

    get needs_insert_or_update(): boolean {
        return this.needs_insert_or_update_ || !((this.var_data_origin_type == this.var_data.value_type) && (this.var_data_origin_value == this.var_data.value));
    }
}
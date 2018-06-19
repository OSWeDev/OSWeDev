export default class ModuleParamChange<T> {
    constructor(
        public field_id: string,
        public field_old_value: T,
        public field_new_value: T) {
    }
}
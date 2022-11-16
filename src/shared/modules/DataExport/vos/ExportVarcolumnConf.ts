export default class ExportVarcolumnConf {

    public constructor(
        public var_id: number,
        public custom_field_filters: { [field_id: string]: string }
    ) { }
}
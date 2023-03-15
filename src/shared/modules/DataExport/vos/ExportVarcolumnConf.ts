/**
 * ExportVarcolumnConf
 *  - Var of Datatable Column configs to be exported
 */
export default class ExportVarcolumnConf {

    public constructor(
        public var_id: number,
        public custom_field_filters: { [field_id: string]: string },
        public filter_type?: string,
        public filter_additional_params?: string,
    ) { }
}
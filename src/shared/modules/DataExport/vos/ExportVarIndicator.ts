import ExportVarcolumnConf from "./ExportVarcolumnConf";

/**
 * ExportVarIndicator
 *  - Export actual page indicator (var) widget in a container
 */
export default class ExportVarIndicator {

    public constructor(
        public ordered_column_list: string[],
        public column_labels: { [column_field_name: string]: string },
        public varcolumn_conf: { [var_name_label: string]: ExportVarcolumnConf },
    ) {

    }
}
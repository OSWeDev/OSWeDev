import IDistantVOBase from "../../IDistantVOBase";
import ExportVarcolumnConfVO from "./ExportVarcolumnConfVO";

/**
 * Export actual page indicator (var) widget in a container
 */
export default class ExportVarIndicatorVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "export_var_indicator";

    public static create_new(
        ordered_column_list: string[],
        column_labels: { [column_field_name: string]: string },
        varcolumn_conf: { [var_name_label: string]: ExportVarcolumnConfVO },
    ) {
        let res: ExportVarIndicatorVO = new ExportVarIndicatorVO();

        res.ordered_column_list = ordered_column_list;
        res.column_labels = column_labels;
        res.varcolumn_conf = varcolumn_conf;

        return res;
    }

    public id: number;
    public _type: string = ExportVarcolumnConfVO.API_TYPE_ID;

    public ordered_column_list: string[];
    public column_labels: { [column_field_name: string]: string };
    public varcolumn_conf: { [var_name_label: string]: ExportVarcolumnConfVO };
}
import IDistantVOBase from "../../IDistantVOBase";

export default class ExportVarcolumnConfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "export_varcolumn_conf";

    public static create_new(
        var_id: number,
        custom_field_filters: { [field_id: string]: string },
        filter_type: string = null,
        filter_additional_params: string = null,
    ) {
        let res: ExportVarcolumnConfVO = new ExportVarcolumnConfVO();

        res.var_id = var_id;
        res.custom_field_filters = custom_field_filters;
        res.filter_type = filter_type;
        res.filter_additional_params = filter_additional_params;

        return res;
    }

    public id: number;
    public _type: string = ExportVarcolumnConfVO.API_TYPE_ID;

    public var_id: number;
    public custom_field_filters: { [field_id: string]: string };
    public filter_type: string;
    public filter_additional_params: string;
}
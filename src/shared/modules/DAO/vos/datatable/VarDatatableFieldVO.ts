import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class VarDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "var_dtf";

    public static createNew(
        datatable_field_uid: string,
        var_id: number,
        filter_type: string,
        filter_additional_params: string,
        dashboard_id: number): VarDatatableFieldVO<any, any> {

        let res = new VarDatatableFieldVO();
        res.init(VarDatatableFieldVO.API_TYPE_ID, DatatableField.VAR_FIELD_TYPE, datatable_field_uid);
        res.var_id = var_id;
        res.filter_type = filter_type;
        res.filter_additional_params = filter_additional_params;
        res.dashboard_id = dashboard_id;
        return res;
    }

    public var_id: number;
    public filter_type: string;
    public filter_additional_params: string;
    public dashboard_id: number;

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        return "fields.labels." + this.vo_type_full_name + ".__var__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class SelectBoxDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "selectbox_dtf";

    public static createNew(): SelectBoxDatatableFieldVO<any, any> {

        let res = new SelectBoxDatatableFieldVO();
        res.init(SelectBoxDatatableFieldVO.API_TYPE_ID, DatatableField.SELECT_BOX_FIELD_TYPE, 'id');
        res.datatable_field_uid = '__select_box';
        return res;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        return "fields.labels." + this.vo_type_full_name + ".__select_box__" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
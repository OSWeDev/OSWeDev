import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';

export default class CRUDActionsDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "crudactions_dtf";

    public static createNew(): CRUDActionsDatatableFieldVO<any, any> {

        let res = new CRUDActionsDatatableFieldVO();
        res.init(CRUDActionsDatatableFieldVO.API_TYPE_ID, DatatableField.CRUD_ACTIONS_FIELD_TYPE, 'id');
        res.datatable_field_uid = '__crud_actions';
        return res;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        return "fields.labels." + this.vo_type_full_name + ".__crud_actions__" + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }
}
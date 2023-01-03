import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class InputDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "input_dtf";

    public static createNew(
        datatable_field_uid: string,
        field_type: string): InputDatatableFieldVO<any, any> {

        let res = new InputDatatableFieldVO();
        res.init(InputDatatableFieldVO.API_TYPE_ID, DatatableField.INPUT_FIELD_TYPE, datatable_field_uid);
        res.field_type = field_type;
        return res;
    }

    public field_type: string;

    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return null;
    }

    public ReadIHMToData(e: U, vo: IDistantVOBase): T {
        return null;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        return "fields.labels." + this.vo_type_full_name + ".__input__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}
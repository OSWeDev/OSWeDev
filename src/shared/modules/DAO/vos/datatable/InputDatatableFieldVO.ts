import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';

export default class InputDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "input_dtf";

    public static createNew(
        datatable_field_uid: string,
        field_type: string): InputDatatableFieldVO<any, any> {

        const res = new InputDatatableFieldVO();
        res.init(InputDatatableFieldVO.API_TYPE_ID, DatatableField.INPUT_FIELD_TYPE, datatable_field_uid);
        res.field_type = field_type;
        return res;
    }

    public _type: string = InputDatatableFieldVO.API_TYPE_ID;

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

        return "fields.labels." + this.vo_type_full_name + ".__input__" + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }
}
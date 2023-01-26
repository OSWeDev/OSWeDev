import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class FileDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "file_dtf";

    public static createNew(
        datatable_field_uid: string,
        parameter_datatable_field_uid: string): FileDatatableFieldVO<any, any> {

        let res = new FileDatatableFieldVO();
        res.init(FileDatatableFieldVO.API_TYPE_ID, DatatableField.FILE_FIELD_TYPE, datatable_field_uid);
        res.parameter_datatable_field_uid = parameter_datatable_field_uid;
        return res;
    }

    public parameter_datatable_field_uid: string;

    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return null;
    }

    public ReadIHMToData(e: U, vo: IDistantVOBase): T {
        return undefined;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        return "fields.labels." + this.vo_type_full_name + ".__file__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public dataToHumanReadableField(e: IDistantVOBase): U {
        return null;
    }
}
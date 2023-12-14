import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class ComputedDatatableFieldVO<T, U, V extends IDistantVOBase> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "computed_dtf";

    public static compute_functions: { [function_uid: string]: (e: IDistantVOBase) => any } = {};

    public static define_compute_function<V extends IDistantVOBase>(function_uid: string, compute_function: (e: V) => any) {
        ComputedDatatableFieldVO.compute_functions[function_uid] = compute_function;
    }

    public static createNew(
        datatable_field_uid: string,
        compute_function_uid: string
    ): ComputedDatatableFieldVO<any, any, any> {

        let res = new ComputedDatatableFieldVO();
        res.init(ComputedDatatableFieldVO.API_TYPE_ID, DatatableField.COMPUTED_FIELD_TYPE, datatable_field_uid);
        res.compute_function_uid = compute_function_uid;

        return res;
    }

    public compute_function_uid: string;

    public dataToReadIHM(e: T, vo: V): U {
        if (!ComputedDatatableFieldVO.compute_functions[this.compute_function_uid]) {
            return null;
        }
        return ComputedDatatableFieldVO.compute_functions[this.compute_function_uid](vo);
    }

    public ReadIHMToData(e: U, vo: V): T {
        return undefined;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        return "fields.labels." + this.vo_type_full_name + ".__computed__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public dataToHumanReadableField(e: V): U {
        return this.dataToReadIHM(e[this.datatable_field_uid], e);
    }
}
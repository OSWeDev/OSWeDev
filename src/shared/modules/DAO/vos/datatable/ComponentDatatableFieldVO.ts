import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';

export default class ComponentDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "component_dtf";

    public static createNew(
        datatable_field_uid: string,
        component_name: string,
        parameter_datatable_field_uid: string): ComponentDatatableFieldVO<any, any> {

        const res = new ComponentDatatableFieldVO();
        res.init(ComponentDatatableFieldVO.API_TYPE_ID, DatatableField.COMPONENT_FIELD_TYPE, datatable_field_uid);
        res.component_name = component_name;
        res.parameter_datatable_field_uid = parameter_datatable_field_uid;
        return res;
    }

    public _type: string = ComponentDatatableFieldVO.API_TYPE_ID;

    public component_name: string;
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

        return "fields.labels." + this.vo_type_full_name + ".__component__" + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public dataToHumanReadableField(e: IDistantVOBase): U {
        return null;
    }
}
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import DatatableField from './DatatableField';

export default class InputDatatableField<T, U> extends DatatableField<T, U> {

    public constructor(
        datatable_field_uid: string,
        public field_type: string,
        translatable_title: string = null) {
        super(DatatableField.INPUT_FIELD_TYPE, 'id', translatable_title);
        this.setUID_for_readDuplicateOnly(datatable_field_uid);
    }

    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return null;
    }

    public ReadIHMToData(e: U, vo: IDistantVOBase): T {
        return null;
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__input__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }
}
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class VarDatatableField<T, U> extends DatatableField<T, U> {

    public constructor(
        datatable_field_uid: string,
        public var_id: number,
        public filter_type: string,
        public filter_additional_params: string,
        public dashboard_id: number,
        translatable_title: string = null) {

        super(DatatableField.VAR_FIELD_TYPE, 'id', translatable_title);
        // Une var est forcément readonly, donc on utilise un field qui existe forcément ('id')
        //  mais on garde le datatable_field_uid donc on sera visible qu'en READ
        this.setUID_for_readDuplicateOnly(datatable_field_uid);
    }

    // USEFUL ?
    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__var__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }
}
import DatatableField from './DatatableField';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import Datatable from './Datatable';
import ModuleTable from '../../../../../shared/modules/ModuleTable';

export default class SimpleDatatableField<T, U> extends DatatableField<T, U> {

    public static FIELD_TYPE: string = "Simple";

    public constructor(
        datatable_field_uid: string,
        translatable_title: string = null) {
        super(SimpleDatatableField.FIELD_TYPE, datatable_field_uid, translatable_title);
    }

    get moduleTableField(): ModuleTableField<T> {
        if (!this.moduleTable) {
            return null;
        }
        return this.moduleTable.getFieldFromId(this.datatable_field_uid);
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.moduleTable.getFieldFromId(this.datatable_field_uid).field_label.code_text;
        }

        this.is_required = this.moduleTableField.field_required;
    }
}
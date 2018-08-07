import ReferenceDatatableField from './ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DatatableField from './DatatableField';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import Datatable from './Datatable';

export default class ManyToOneReferenceDatatableField<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {
    public static FIELD_TYPE: string = "ManyToOne";

    public constructor(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<Target>,
        sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null) {
        super(ManyToOneReferenceDatatableField.FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields, translatable_title);
    }

    get srcField(): ModuleTableField<any> {
        return this.moduleTable.getFieldFromId(this.datatable_field_uid);
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.srcField.field_label.code_text;
        }

        this.is_required = this.srcField.field_required;
    }
}
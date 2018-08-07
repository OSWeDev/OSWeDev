import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import Datatable from './Datatable';
import DatatableField from './DatatableField';
import ReferenceDatatableField from './ReferenceDatatableField';

export default class ManyToManyReferenceDatatableField<Target extends IDistantVOBase, Inter extends IDistantVOBase> extends ReferenceDatatableField<Target> {
    public static FIELD_TYPE: string = "ManyToMany";

    public constructor(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<Target>,
        public interModuleTable: ModuleTable<Inter>,
        sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null) {
        super(ManyToManyReferenceDatatableField.FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields, translatable_title);
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.interModuleTable.label.code_text;
        }

        // ? this.is_required = this.srcField.field_required;
    }
}
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DatatableField from './DatatableField';

export default class Datatable<T extends IDistantVOBase> {

    protected sortedFields: Array<DatatableField<any, any>> = [];
    constructor(public moduleTable: ModuleTable<T>) { }

    public pushField(field: DatatableField<any, any>) {
        field.setModuleTable(this.moduleTable);
        this.sortedFields.push(field);
    }

    get fields(): Array<DatatableField<any, any>> {
        return this.sortedFields;
    }
}
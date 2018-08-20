import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DatatableField from './DatatableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';

export default class Datatable<T extends IDistantVOBase> {

    protected sortedFields: Array<DatatableField<any, any>> = [];
    constructor(public API_TYPE_ID: string) { }

    public pushField(field: DatatableField<any, any>) {
        field.setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[this.API_TYPE_ID]);
        this.sortedFields.push(field);
    }

    get fields(): Array<DatatableField<any, any>> {
        return this.sortedFields;
    }
}
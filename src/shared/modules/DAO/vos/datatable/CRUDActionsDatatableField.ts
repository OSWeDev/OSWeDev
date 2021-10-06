import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class CRUDActionsDatatableField<T, U> extends DatatableField<T, U> {

    public constructor() {

        super(DatatableField.CRUD_ACTIONS_FIELD_TYPE, 'id', null);
        this.setUID_for_readDuplicateOnly('__crud_actions');
    }

    // USEFUL ?
    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__crud_actions__" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }
}
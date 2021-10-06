import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class SelectBoxDatatableField<T, U> extends DatatableField<T, U> {

    public constructor() {

        super(DatatableField.SELECT_BOX_FIELD_TYPE, 'id', null);
        this.setUID_for_readDuplicateOnly('__select_box');
    }

    // USEFUL ?
    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__select_box__" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }
}
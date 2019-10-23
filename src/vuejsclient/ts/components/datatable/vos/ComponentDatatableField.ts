import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import DatatableField from './DatatableField';

export default class ComponentDatatableField<T, U> extends DatatableField<T, U> {

    public constructor(
        datatable_field_uid: string,
        public component: any,
        public parameter_datatable_field_uid: string,
        translatable_title: string = null) {

        super(DatatableField.COMPONENT_FIELD_TYPE, 'id', translatable_title);
        // Un computed est forcément readonly, donc on utilise un field qui existe forcément ('id')
        //  mais on garde le datatable_field_uid donc on sera visible qu'en READ
        this.setUID_for_readDuplicateOnly(datatable_field_uid);
    }

    public async dataToReadIHM(e: T, vo: IDistantVOBase): Promise<U> {
        return null;
    }

    public async ReadIHMToData(e: U, vo: IDistantVOBase): Promise<T> {
        return undefined;
    }

    // USEFUL ?
    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__component__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }

    public async dataToHumanReadableField(e: IDistantVOBase): Promise<U> {
        return null;
    }
}
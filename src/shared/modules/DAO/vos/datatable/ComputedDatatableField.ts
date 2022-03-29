import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class ComputedDatatableField<T, U, V extends IDistantVOBase> extends DatatableField<T, U> {

    public constructor(
        datatable_field_uid: string,
        public computeFieldValue: (e: V) => any,
        translatable_title: string = null) {

        super(DatatableField.COMPUTED_FIELD_TYPE, 'id', translatable_title);
        // Un computed est forcément readonly, donc on utilise un field qui existe forcément ('id')
        //  mais on garde le datatable_field_uid donc on sera visible qu'en READ
        this.setUID_for_readDuplicateOnly(datatable_field_uid);
    }

    public dataToReadIHM(e: T, vo: V): U {
        return this.computeFieldValue(vo);
    }

    public ReadIHMToData(e: U, vo: V): T {
        return undefined;
    }

    // USEFUL ?
    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__computed__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }

    public dataToHumanReadableField(e: V): U {
        return this.dataToReadIHM(e[this.datatable_field_uid], e);
    }
}
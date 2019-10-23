import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import DatatableField from './DatatableField';

export default class FileDatatableField<T, U> extends DatatableField<T, U> {

    public constructor(
        datatable_field_uid: string,
        public parameter_datatable_field_uid: string,
        translatable_title: string = null) {

        super(DatatableField.FILE_FIELD_TYPE, 'id', translatable_title);
        // on cible d'être readonly pour le moment, a voir plus tard si on veut proposer l'édition
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
            this.translatable_title = "fields.labels." + this.moduleTable.full_name + ".__file__" + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        return this;
    }

    public async dataToHumanReadableField(e: IDistantVOBase): Promise<U> {
        return null;
    }
}
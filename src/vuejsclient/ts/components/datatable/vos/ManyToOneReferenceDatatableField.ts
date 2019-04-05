import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DatatableField from './DatatableField';
import ReferenceDatatableField from './ReferenceDatatableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

export default class ManyToOneReferenceDatatableField<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public filterOptionsForUpdateOrCreateOnManyToOne: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public constructor(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<Target>,
        sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null) {
        super(DatatableField.MANY_TO_ONE_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields, translatable_title);
    }

    public setFilterOptionsForUpdateOrCreateOnManyToOne(filterOptionsForUpdateOrCreateOnManyToOne: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target }): ManyToOneReferenceDatatableField<Target> {
        this.filterOptionsForUpdateOrCreateOnManyToOne = filterOptionsForUpdateOrCreateOnManyToOne;
        return this;
    }


    get srcField(): ModuleTableField<any> {
        return this.moduleTable.getFieldFromId(this.module_table_field_id);
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.srcField.field_label.code_text;
        }
        if (this.module_table_field_id != this.datatable_field_uid) {
            this.translatable_title = this.translatable_title.substr(0, this.translatable_title.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        this.is_required = this.srcField.field_required;
        this.validate = this.validate ? this.validate : this.srcField.validate;
    }

    public getValidationTextCodeBase(): string {
        return this.srcField.getValidationTextCodeBase();
    }

    public dataToHumanReadableField(e: IDistantVOBase): any {
        return this.voIdToHumanReadable(e[this.datatable_field_uid]);
    }
}
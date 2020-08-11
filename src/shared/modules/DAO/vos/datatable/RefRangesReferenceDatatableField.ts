import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import RangeHandler from '../../../../../shared/tools/RangeHandler';

export default class RefRangesReferenceDatatableField<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;
    public srcField: ModuleTableField<any> = null;

    public constructor(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<Target>,
        sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null) {
        super(DatatableField.REF_RANGES_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields, translatable_title);
    }

    public setFilterOptionsForUpdateOrCreateOnRefRanges(filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target }): RefRangesReferenceDatatableField<Target> {
        this.filterOptionsForUpdateOrCreateOnRefRanges = filterOptionsForUpdateOrCreateOnRefRanges;
        return this;
    }

    public setModuleTable(moduleTable: ModuleTable<any>): RefRangesReferenceDatatableField<Target> {
        this.moduleTable = moduleTable;
        this.srcField = this.moduleTable.getFieldFromId(this.module_table_field_id);

        if (!this.translatable_title) {
            this.translatable_title = this.targetModuleTable.label.code_text;
        }
        if (this.module_table_field_id != this.datatable_field_uid) {
            this.translatable_title = this.translatable_title.substr(0, this.translatable_title.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        this.is_required = this.srcField.field_required;
        this.validate = this.validate ? this.validate : this.srcField.validate;

        return this;
    }

    public dataToUpdateIHM<T, U>(e: T, vo: IDistantVOBase): U {
        return e as any as U;
    }

    public dataToHumanReadableField(e: IDistantVOBase): any {
        let res = "";

        let vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        let destvos = vos[this.targetModuleTable.vo_type];
        if (!destvos) {
            return res;
        }
        RangeHandler.getInstance().foreach_ranges_sync(e[this.datatable_field_uid], (id: number) => {
            let thisvalue: string = this.dataToHumanReadable(destvos[id]);
            res += (res != "") ? " " + thisvalue : thisvalue;
        });
        return res;
    }

    public dataToReadIHM(e: number, vo: IDistantVOBase): any {
        let dest_ids: number[] = [];

        let vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        let destvos = vos[this.targetModuleTable.vo_type];
        if (!destvos) {
            return dest_ids;
        }
        RangeHandler.getInstance().foreach_ranges_sync(vo[this.datatable_field_uid], (id: number) => {
            dest_ids.push(id);
        });
        return dest_ids;
    }
}
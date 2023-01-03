import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import VOsTypesManager from '../../../VOsTypesManager';

export default class RefRangesReferenceDatatableFieldVO<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public static API_TYPE_ID: string = "rr_dtf";

    public static createNew(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<any>,
        sortedTargetFields: Array<DatatableField<any, any>>): RefRangesReferenceDatatableFieldVO<any> {

        let res = new RefRangesReferenceDatatableFieldVO();
        res.init_ref_dtf(RefRangesReferenceDatatableFieldVO.API_TYPE_ID, DatatableField.REF_RANGES_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields);
        return res;
    }

    public filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public _src_field_id: string;

    get src_field_id(): string {
        return this._src_field_id;
    }

    set src_field_id(src_field_id: string) {
        this._src_field_id = src_field_id;
        this.is_required = this.srcField.field_required;
        this.validate = this.validate ? this.validate : this.srcField.validate;
    }

    get srcField(): ModuleTableField<any> {
        return VOsTypesManager.moduleTables_by_voType[this.vo_type_id].getFieldFromId(this.src_field_id);
    }

    public setFilterOptionsForUpdateOrCreateOnRefRanges(filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target }): RefRangesReferenceDatatableFieldVO<Target> {
        this.filterOptionsForUpdateOrCreateOnRefRanges = filterOptionsForUpdateOrCreateOnRefRanges;
        return this;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        let e = this.targetModuleTable.label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
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
        RangeHandler.foreach_ranges_sync(e[this.datatable_field_uid], (id: number) => {
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
        RangeHandler.foreach_ranges_sync(vo[this.datatable_field_uid], (id: number) => {
            dest_ids.push(id);
        });
        return dest_ids;
    }
}
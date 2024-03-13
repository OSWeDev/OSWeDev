import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import ModuleTableController from '../../ModuleTableFieldController';

export default class RefRangesReferenceDatatableFieldVO<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public static API_TYPE_ID: string = "rr_dtf";

    public static createNew(
        datatable_field_uid: string,
        targetModuleTable: ModuleTableVO,
        sorted_target_fields: Array<DatatableField<any, any>>
    ): RefRangesReferenceDatatableFieldVO<any> {

        const res = new RefRangesReferenceDatatableFieldVO();

        res.init_ref_dtf(
            RefRangesReferenceDatatableFieldVO.API_TYPE_ID,
            DatatableField.REF_RANGES_FIELD_TYPE,
            datatable_field_uid,
            targetModuleTable,
            sorted_target_fields
        );

        res.src_field_id = datatable_field_uid;

        return res;
    }

    public filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public _type: string = RefRangesReferenceDatatableFieldVO.API_TYPE_ID;

    public _src_field_id: string;

    get src_field_id(): string {
        return this._src_field_id;
    }

    set src_field_id(src_field_id: string) {
        this._src_field_id = src_field_id;

        this.onupdateSrcField();
    }

    get srcField(): ModuleTableFieldVO {
        if (!this.moduleTable) {
            return null;
        }

        return this.moduleTable.getFieldFromId(this.src_field_id);
    }

    public setModuleTable(moduleTable: ModuleTableVO): this {
        this.vo_type_full_name = moduleTable.full_name;
        this.vo_type_id = moduleTable.vo_type;

        this.onupdateSrcField();

        return this;
    }

    public setFilterOptionsForUpdateOrCreateOnRefRanges(filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target }): RefRangesReferenceDatatableFieldVO<Target> {
        this.filterOptionsForUpdateOrCreateOnRefRanges = filterOptionsForUpdateOrCreateOnRefRanges;
        return this;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        if (this.translatable_title_custom) {
            return this.translatable_title_custom;
        }

        const e = this.targetModuleTable.label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslationVO.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    public dataToUpdateIHM<T, U>(e: T, vo: IDistantVOBase): U {
        return e as any as U;
    }

    public dataToHumanReadableField(e: IDistantVOBase): any {
        let res = "";

        const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        const destvos = vos[this.targetModuleTable.vo_type];
        if (!destvos) {
            return res;
        }
        RangeHandler.foreach_ranges_sync(e[this.datatable_field_uid], (id: number) => {
            const thisvalue: string = this.dataToHumanReadable(destvos[id]);
            res += (res != "") ? " " + thisvalue : thisvalue;
        });
        return res;
    }

    public dataToReadIHM(e: number, vo: IDistantVOBase): any {
        const dest_ids: number[] = [];

        const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        const destvos = vos[this.targetModuleTable.vo_type];

        if (!destvos) {
            return dest_ids;
        }

        RangeHandler.foreach_ranges_sync(vo[this.datatable_field_uid], (id: number) => {
            dest_ids.push(id);
        });

        return dest_ids;
    }

    private onupdateSrcField() {
        if (!this.srcField) {
            return;
        }
        this.is_required = this.srcField.field_required;
        this.validate = this.validate ? this.validate : (data: any) => {
            return ModuleTableController.validate_field_value(this.srcField, data);
        };
    }
}
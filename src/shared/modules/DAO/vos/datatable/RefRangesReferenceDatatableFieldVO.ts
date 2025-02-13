import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import { query } from '../../../ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../ModuleTableFieldController';

export default class RefRangesReferenceDatatableFieldVO<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public static API_TYPE_ID: string = "rr_dtf";
    public _src_field_id: string;

    public filterOptionsForUpdateOrCreateOnRefRanges: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public _type: string = RefRangesReferenceDatatableFieldVO.API_TYPE_ID;

    get src_field_id(): string {
        return this._src_field_id;
    }

    get srcField(): ModuleTableFieldVO {
        if (!this.moduleTable) {
            return null;
        }

        return this.moduleTable.getFieldFromId(this.src_field_id);
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        if (this.translatable_title_custom) {
            return this.translatable_title_custom;
        }

        const e = this.srcField.field_label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslationVO.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    set src_field_id(src_field_id: string) {
        this._src_field_id = src_field_id;

        this.onupdateSrcField();
    }

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

    public async dataToUpdateIHM<T, U>(e: T, vo: IDistantVOBase): Promise<U> {
        return e as unknown as U;
    }

    public async dataToCreateIHM<T, U>(e: T, vo: IDistantVOBase): Promise<U> {
        return e as unknown as U;
    }

    public async dataToHumanReadableField(e: IDistantVOBase): Promise<any> {
        let res = "";

        const destvos = e[this.datatable_field_uid] ? await query(this.targetModuleTable.vo_type)
            .filter_by_ids(e[this.datatable_field_uid])
            .select_vos<Target>() : [];

        // const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        // const destvos = vos[this.targetModuleTable.vo_type];
        if ((!destvos) || (!destvos.length)) {
            return res;
        }
        await RangeHandler.foreach_ranges(e[this.datatable_field_uid], async (id: number) => {
            const thisvalue: string = await this.dataToHumanReadable(destvos[id]);
            res += (res != "") ? " " + thisvalue : thisvalue;
        });
        return res;
    }

    public async dataToReadIHM(e: number, vo: IDistantVOBase): Promise<any> {
        const dest_ids: number[] = [];

        const destvos = e[this.datatable_field_uid] ? await query(this.targetModuleTable.vo_type)
            .filter_by_ids(e[this.datatable_field_uid])
            .select_vos<Target>() : [];

        // const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        // const destvos = vos[this.targetModuleTable.vo_type];

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
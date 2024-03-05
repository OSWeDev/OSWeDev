import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleTableController from '../../ModuleTableController';

export default class ManyToManyReferenceDatatableFieldVO<Target extends IDistantVOBase, Inter extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public static API_TYPE_ID: string = "mtm_dtf";

    public static createNew(
        datatable_field_uid: string,
        targetModuleTable: ModuleTableVO,
        interModuleTable: ModuleTableVO,
        sortedTargetFields: Array<DatatableField<any, any>>): ManyToManyReferenceDatatableFieldVO<any, any> {

        const res = new ManyToManyReferenceDatatableFieldVO();
        res.init_ref_dtf(ManyToManyReferenceDatatableFieldVO.API_TYPE_ID, DatatableField.MANY_TO_MANY_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields);
        res.inter_module_table_type_id = interModuleTable.vo_type;
        return res;
    }

    public filterOptionsForUpdateOrCreateOnManyToMany: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public _type: string = ManyToManyReferenceDatatableFieldVO.API_TYPE_ID;

    public inter_module_table_type_id: string;
    public interTargetRefFieldId: string;
    public interSrcRefFieldId: string;

    public setFilterOptionsForUpdateOrCreateOnManyToMany(filterOptionsForUpdateOrCreateOnManyToMany: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target }): ManyToManyReferenceDatatableFieldVO<Target, Inter> {
        this.filterOptionsForUpdateOrCreateOnManyToMany = filterOptionsForUpdateOrCreateOnManyToMany;
        return this;
    }

    public set_interTargetRefFieldId(interTargetRefFieldId: string): ManyToManyReferenceDatatableFieldVO<Target, Inter> {
        this.interTargetRefFieldId = interTargetRefFieldId;
        return this;
    }

    public set_interSrcRefFieldId(interSrcRefFieldId: string): ManyToManyReferenceDatatableFieldVO<Target, Inter> {
        this.interSrcRefFieldId = interSrcRefFieldId;
        return this;
    }

    get translatable_title(): string {
        if ((!this.vo_type_full_name) || (!this.targetModuleTable)) {
            return null;
        }

        if (this.translatable_title_custom) {
            return this.translatable_title_custom;
        }

        const e = this.targetModuleTable.label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substring(0, e.indexOf(DefaultTranslationVO.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    get interModuleTable(): ModuleTableVO {
        return this.inter_module_table_type_id ? ModuleTableController.module_tables_by_vo_type[this.inter_module_table_type_id] : null;
    }

    public dataToHumanReadableField(e: IDistantVOBase): any {
        let res = "";

        const dest_ids: number[] = [];
        const interTargetRefField = this.interTargetRefFieldId ? this.interModuleTable.getFieldFromId(this.interTargetRefFieldId) : this.interModuleTable.getRefFieldFromTargetVoType(this.target_module_table_type_id);
        const interSrcRefField = this.interSrcRefFieldId ? this.interModuleTable.getFieldFromId(this.interSrcRefFieldId) : this.interModuleTable.getRefFieldFromTargetVoType(this.vo_type_id);
        const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        for (const interi in vos[this.interModuleTable.vo_type]) {
            const intervo = vos[this.interModuleTable.vo_type][interi];

            if (intervo && (intervo[interSrcRefField.field_id] == e.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                dest_ids.push(intervo[interTargetRefField.field_id]);
            }
        }

        for (const desti in dest_ids) {
            const thisvalue: string = this.dataToHumanReadable(vos[this.target_module_table_type_id][dest_ids[desti]]);
            res += (res != "") ? " " + thisvalue : thisvalue;
        }
        return res;
    }

    public dataToReadIHM(e: number, vo: IDistantVOBase): any {

        const dest_ids: number[] = [];

        if (!vo.id) {
            return dest_ids;
        }

        const interTargetRefField = this.interTargetRefFieldId ? this.interModuleTable.getFieldFromId(this.interTargetRefFieldId) : this.interModuleTable.getRefFieldFromTargetVoType(this.target_module_table_type_id);
        const interSrcRefField = this.interSrcRefFieldId ? this.interModuleTable.getFieldFromId(this.interSrcRefFieldId) : this.interModuleTable.getRefFieldFromTargetVoType(this.vo_type_id);
        const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        for (const interi in vos[this.interModuleTable.vo_type]) {
            const intervo = vos[this.interModuleTable.vo_type][interi];

            if (intervo && (intervo[interSrcRefField.field_id] == vo.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                dest_ids.push(intervo[interTargetRefField.field_id]);
            }
        }

        return dest_ids;
    }
}
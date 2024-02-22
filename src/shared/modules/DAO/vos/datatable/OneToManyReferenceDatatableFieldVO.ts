import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import RangeHandler from '../../../../tools/RangeHandler';
import NumRange from '../../../DataRender/vos/NumRange';
import VOsTypesManager from '../../../VO/manager/VOsTypesManager';
import ModuleTableController from '../../ModuleTableFieldController';

export default class OneToManyReferenceDatatableFieldVO<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public static API_TYPE_ID: string = "otm_dtf";

    public static createNew(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<any>,
        destField: ModuleTableField<any>,
        sortedTargetFields: Array<DatatableField<any, any>>): OneToManyReferenceDatatableFieldVO<any> {

        let res = new OneToManyReferenceDatatableFieldVO();
        res.init_ref_dtf(OneToManyReferenceDatatableFieldVO.API_TYPE_ID, DatatableField.ONE_TO_MANY_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields);
        res.dest_field_id = destField.field_id;
        return res;
    }

    public filterOptionsForUpdateOrCreateOnOneToMany: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public _dest_field_id: string;

    get dest_field_id(): string {
        return this._dest_field_id;
    }

    set dest_field_id(dest_field_id: string) {
        this._dest_field_id = dest_field_id;

        this.onupdatedestField();
    }

    get target_module_table_type_id(): string {
        return this._target_module_table_type_id;
    }

    set target_module_table_type_id(target_module_table_type_id: string) {
        this._target_module_table_type_id = target_module_table_type_id;

        this.onupdatedestField();
    }

    get destField(): ModuleTableField<any> {
        if ((!this.dest_field_id) || (!this.target_module_table_type_id)) {
            return null;
        }

        return VOsTypesManager.moduleTables_by_voType[this.target_module_table_type_id].getFieldFromId(this.dest_field_id);
    }

    public setFilterOptionsForUpdateOrCreateOnOneToMany(filterOptionsForUpdateOrCreateOnOneToMany: (vo: IDistantVOBase, options: { [id: number]: Target }) => { [id: number]: Target }): OneToManyReferenceDatatableFieldVO<Target> {
        this.filterOptionsForUpdateOrCreateOnOneToMany = filterOptionsForUpdateOrCreateOnOneToMany;
        return this;
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        if (this.translatable_title_custom) {
            return this.translatable_title_custom;
        }

        let e = this.destField.field_id ? this.targetModuleTable.label.code_text + '_' + this.destField.field_id : this.targetModuleTable.label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    public dataToReadIHM(e: number, vo: IDistantVOBase): any {

        let res: number[] = [];

        if (!vo.id) {
            return res;
        }

        let vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        for (let oneToManyTargetId in vos[this.targetModuleTable.vo_type]) {
            let targetVo = vos[this.targetModuleTable.vo_type][oneToManyTargetId];

            // Cas particulier du refranges où on cherche l'intersection
            if (this.destField.field_type == ModuleTableField.FIELD_TYPE_refrange_array) {

                if ((!targetVo) || (!targetVo[this.destField.field_id])) {
                    continue;
                }

                let targetVoRanges: NumRange[] = targetVo[this.destField.field_id];
                if (RangeHandler.elt_intersects_any_range(vo.id, targetVoRanges)) {
                    res.push(parseInt(oneToManyTargetId.toString()));
                }

                continue;
            }

            if ((!!targetVo) && (targetVo[this.destField.field_id] == vo.id)) {

                res.push(parseInt(oneToManyTargetId.toString()));
            }
        }
        return res;
    }

    private onupdatedestField() {
        if (!this.destField) {
            return;
        }
        this.is_required = this.destField.field_required;
        this.validate = this.validate ? this.validate : (data: any) => {
            return ModuleTableController.validate_field_value(this.destField, data);
        };
    }

}
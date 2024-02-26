import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableVO from '../../../../../shared/modules/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../shared/modules/ModuleTableFieldVO';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleTableController from '../../ModuleTableFieldController';

export default class ManyToOneReferenceDatatableFieldVO<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public static API_TYPE_ID: string = "mto_dtf";

    public static createNew(
        datatable_field_uid: string,
        targetModuleTable: ModuleTableVO<any>,
        sortedTargetFields: Array<DatatableField<any, any>>): ManyToOneReferenceDatatableFieldVO<any> {

        let res = new ManyToOneReferenceDatatableFieldVO();

        res.init_ref_dtf(
            ManyToOneReferenceDatatableFieldVO.API_TYPE_ID,
            DatatableField.MANY_TO_ONE_FIELD_TYPE,
            datatable_field_uid,
            targetModuleTable,
            sortedTargetFields
        );

        res.src_field_id = datatable_field_uid;

        return res;
    }

    public filterOptionsForUpdateOrCreateOnManyToOne: (vo: Target, options: { [id: number]: Target }) => { [id: number]: Target } = null;

    public _src_field_id: string;

    public setFilterOptionsForUpdateOrCreateOnManyToOne(filterOptionsForUpdateOrCreateOnManyToOne: (vo: Target, options: { [id: number]: Target }) => { [id: number]: Target }): ManyToOneReferenceDatatableFieldVO<Target> {
        this.filterOptionsForUpdateOrCreateOnManyToOne = filterOptionsForUpdateOrCreateOnManyToOne;
        return this;
    }

    get src_field_id(): string {
        return this._src_field_id;
    }

    set src_field_id(src_field_id: string) {
        this._src_field_id = src_field_id;

        this.onupdateSrcField();
    }

    public setModuleTable(moduleTable: ModuleTableVO<any>): this {
        this.vo_type_full_name = moduleTable.full_name;
        this.vo_type_id = moduleTable.vo_type;

        this.onupdateSrcField();

        return this;
    }

    get srcField(): ModuleTableFieldVO<any> {
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

        let e = this.srcField.field_label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslationVO.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    public getValidationTextCodeBase(): string {
        return this.srcField.getValidationTextCodeBase();
    }

    public dataToHumanReadableField(e: IDistantVOBase): any {
        return this.voIdToHumanReadable(e[this.datatable_field_uid]);
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
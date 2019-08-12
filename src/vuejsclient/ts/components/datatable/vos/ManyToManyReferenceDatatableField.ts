import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DatatableField from './DatatableField';
import ReferenceDatatableField from './ReferenceDatatableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import VueAppBase from '../../../../VueAppBase';

export default class ManyToManyReferenceDatatableField<Target extends IDistantVOBase, Inter extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public constructor(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<Target>,
        public interModuleTable: ModuleTable<Inter>,
        sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null) {
        super(DatatableField.MANY_TO_MANY_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields, translatable_title);
    }

    public setModuleTable(moduleTable: ModuleTable<any>): ManyToManyReferenceDatatableField<Target, Inter> {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.targetModuleTable.label.code_text;
        }
        if (this.module_table_field_id != this.datatable_field_uid) {
            this.translatable_title = this.translatable_title.substr(0, this.translatable_title.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        // ? this.is_required = this.srcField.field_required;

        return this;
    }

    public dataToHumanReadableField(e: IDistantVOBase): any {
        let res = "";

        let dest_ids: number[] = [];
        let interTargetRefField = this.interModuleTable.getRefFieldFromTargetVoType(this.targetModuleTable.vo_type);
        let interSrcRefField = this.interModuleTable.getRefFieldFromTargetVoType(this.moduleTable.vo_type);
        let vos = VueAppBase.instance_.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        for (let interi in vos[this.interModuleTable.vo_type]) {
            let intervo = vos[this.interModuleTable.vo_type][interi];

            if (intervo && (intervo[interSrcRefField.field_id] == e.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                dest_ids.push(intervo[interTargetRefField.field_id]);
            }
        }

        for (let desti in dest_ids) {
            let thisvalue: string = this.dataToHumanReadable(vos[this.targetModuleTable.vo_type][dest_ids[desti]]);
            res += (res != "") ? " " + thisvalue : thisvalue;
        }
        return res;
    }

    public dataToReadIHM(e: number, vo: IDistantVOBase): any {

        let dest_ids: number[] = [];

        if (!vo.id) {
            return dest_ids;
        }

        let interTargetRefField = this.interModuleTable.getRefFieldFromTargetVoType(this.targetModuleTable.vo_type);
        let interSrcRefField = this.interModuleTable.getRefFieldFromTargetVoType(this.moduleTable.vo_type);
        let vos = VueAppBase.instance_.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        for (let interi in vos[this.interModuleTable.vo_type]) {
            let intervo = vos[this.interModuleTable.vo_type][interi];

            if (intervo && (intervo[interSrcRefField.field_id] == vo.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                dest_ids.push(intervo[interTargetRefField.field_id]);
            }
        }

        return dest_ids;
    }
}
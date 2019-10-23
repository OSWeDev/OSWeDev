import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DatatableField from './DatatableField';
import ReferenceDatatableField from './ReferenceDatatableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import VueAppBase from '../../../../VueAppBase';

export default class OneToManyReferenceDatatableField<Target extends IDistantVOBase> extends ReferenceDatatableField<Target> {

    public constructor(
        datatable_field_uid: string,
        targetModuleTable: ModuleTable<Target>,
        public destField: ModuleTableField<any>,
        sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null) {
        super(DatatableField.ONE_TO_MANY_FIELD_TYPE, datatable_field_uid, targetModuleTable, sortedTargetFields, translatable_title);
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.destField.field_id ? this.targetModuleTable.label.code_text + '_' + this.destField.field_id : this.targetModuleTable.label.code_text;
        }
        if (this.module_table_field_id != this.datatable_field_uid) {
            this.translatable_title = this.translatable_title.substr(0, this.translatable_title.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        // ? this.is_required = this.srcField.field_required;

        return this;
    }

    public async dataToReadIHM(e: number, vo: IDistantVOBase): Promise<any> {

        let res: number[] = [];

        if (!vo.id) {
            return res;
        }

        let vos = VueAppBase.instance_.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        for (let oneToManyTargetId in vos[this.targetModuleTable.vo_type]) {
            let targetVo = vos[this.targetModuleTable.vo_type][oneToManyTargetId];

            if ((!!targetVo) && (targetVo[this.destField.field_id] == vo.id)) {

                res.push(parseInt(oneToManyTargetId.toString()));
            }
        }
        return res;
    }
}
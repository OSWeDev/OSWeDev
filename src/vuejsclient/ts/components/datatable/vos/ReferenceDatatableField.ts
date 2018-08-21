import DatatableField from './DatatableField';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import SimpleDatatableField from './SimpleDatatableField';
import DAOStore, { getStoredDatas } from '../../dao/store/DaoStore';
import VueAppBase from '../../../../VueAppBase';
import Vue from 'vue';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';

export default abstract class ReferenceDatatableField<Target extends IDistantVOBase> extends DatatableField<number, number> {

    protected constructor(
        type: string,
        datatable_field_uid: string,
        public targetModuleTable: ModuleTable<Target>,
        public sortedTargetFields: Array<DatatableField<any, any>>,
        translatable_title: string = null
    ) {
        super(type, datatable_field_uid, translatable_title);

        for (let i in sortedTargetFields) {
            sortedTargetFields[i].setModuleTable(this.targetModuleTable);
        }

        let self = this;
    }

    public voIdToHumanReadable: (id: number) => string = (id: number) => {
        let res: string = "";

        if (!id) {
            return null;
        }

        let vos = VueAppBase.instance_.vueInstance.$store.getters['DAOStore/getStoredDatas'];
        let data: Target = vos[this.targetModuleTable.vo_type][id];
        return this.dataToHumanReadable(data);
    }

    public dataToHumanReadable: (e: Target) => string = (e: Target) => {
        let res: string = "";

        if (!e) {
            return null;
        }

        for (let i in this.sortedTargetFields) {
            let sortedTargetField = this.sortedTargetFields[i];

            if (sortedTargetField.type == SimpleDatatableField.FIELD_TYPE) {

                let field_value: string = e[(sortedTargetField as SimpleDatatableField<any, any>).moduleTableField.field_id] ? e[(sortedTargetField as SimpleDatatableField<any, any>).moduleTableField.field_id].toString() : "";
                res = ((res != "") ? res + " " + field_value : field_value);
            }

            // TODO les autres types, avec l'aide de getStoredDatas
        }

        return res as any;
    }
}
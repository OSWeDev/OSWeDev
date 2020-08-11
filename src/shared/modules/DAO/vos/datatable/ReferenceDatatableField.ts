import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';

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

        if ((id === null) || (typeof id == 'undefined')) {
            return '';
        }

        let vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        let data: Target = vos[this.targetModuleTable.vo_type] ? vos[this.targetModuleTable.vo_type][id] : null;
        res = this.dataToHumanReadable(data);
        return res ? res : '';
    }

    public dataToHumanReadable: (e: Target) => string = (e: Target) => {
        let res: string = "";

        if (!e) {
            return '';
        }

        for (let i in this.sortedTargetFields) {
            let sortedTargetField = this.sortedTargetFields[i];

            let field_value: string = sortedTargetField.dataToHumanReadableField(e);
            field_value = field_value ? field_value : "";
            res = ((res != "") ? res + " " + field_value : field_value);
        }

        return res ? res as any : '';
    }

}
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import WeightHandler from '../../../../tools/WeightHandler';
import ModuleTableController from '../../ModuleTableController';

export default abstract class ReferenceDatatableField<Target extends IDistantVOBase> extends DatatableField<number, number> {

    public _target_module_table_type_id: string;
    public sorted_target_fields: Array<DatatableField<any, any>>;

    get target_module_table_type_id(): string {
        return this._target_module_table_type_id;
    }
    get targetModuleTable(): ModuleTableVO {
        return this.target_module_table_type_id ? ModuleTableController.module_tables_by_vo_type[this.target_module_table_type_id] : null;
    }

    set target_module_table_type_id(target_module_table_type_id: string) {
        this._target_module_table_type_id = target_module_table_type_id;
    }

    public voIdToHumanReadable: (id: number) => string = (id: number) => {
        let res: string = "";

        if ((id === null) || (typeof id == 'undefined')) {
            return '';
        }

        const vos = DatatableField.VueAppBase.vueInstance.$store.getters['DAOStore/getStoredDatas'];

        const data: Target = vos[this.targetModuleTable.vo_type] ? vos[this.targetModuleTable.vo_type][id] : null;
        res = this.dataToHumanReadable(data);
        return res ? res : '';
    };

    public dataToHumanReadable: (e: Target) => string = (e: Target) => {
        let res: string = "";

        if (!e) {
            return '';
        }

        for (const i in this.sorted_target_fields) {
            const sortedTargetField = this.sorted_target_fields[i];

            let field_value: string = sortedTargetField.dataToHumanReadableField(e);
            field_value = field_value ? field_value : "";
            res = ((res != "") ? res + " " + field_value : field_value);
        }

        return res ? res as any : '';
    };

    protected init_ref_dtf(
        _type: string,
        type: string,
        datatable_field_uid: string,
        targetModuleTable: ModuleTableVO,
        sorted_target_fields: Array<DatatableField<any, any>>
    ) {
        this.init(_type, type, datatable_field_uid);

        this.target_module_table_type_id = targetModuleTable.vo_type;
        for (const i in sorted_target_fields) {
            sorted_target_fields[i].vo_type_full_name = targetModuleTable.full_name;
            sorted_target_fields[i].vo_type_id = targetModuleTable.vo_type;
        }
        this.sorted_target_fields = sorted_target_fields;

        let has_weight: boolean = false;

        for (const i in targetModuleTable.get_fields()) {
            if (targetModuleTable.get_fields()[i].field_id == "weight") {
                has_weight = true;
                break;
            }
        }

        //par defaut on trie par id sauf si on a un champ de weight
        if (!has_weight) {
            this.setSort((vo1, vo2) => {
                if (targetModuleTable?.sort_by_field) {
                    let field_id: string = targetModuleTable.sort_by_field.field_name;
                    let sort_asc: boolean = targetModuleTable.sort_by_field.sort_asc;

                    if (vo1[field_id] < vo2[field_id]) {
                        return sort_asc ? -1 : 1;
                    }
                    if (vo1[field_id] > vo2[field_id]) {
                        return sort_asc ? 1 : -1;
                    }
                    return 0;
                }

                return vo1.id - vo2.id;
            });
        } else {
            this.setSort(WeightHandler.getInstance().get_sort_by_weight_cb.bind(this));
        }
    }
}
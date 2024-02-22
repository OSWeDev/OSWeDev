import { field_names } from '../../../../../tools/ObjectHandler';
import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../../IDistantVOBase';
import ModuleTable from '../../../../ModuleTable';
import ModuleTableField from '../../../../ModuleTableField';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationReponseVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'anim_reponse';

    public static moduleTable(): ModuleTable<any> {
        let datatable_fields = [
            new ModuleTableField(field_names<AnimationReponseVO>().weight, ModuleTableField.FIELD_TYPE_int, "Poids"),
            new ModuleTableField(field_names<AnimationReponseVO>().name, ModuleTableField.FIELD_TYPE_string, "Réponse"),
            new ModuleTableField(field_names<AnimationReponseVO>().valid, ModuleTableField.FIELD_TYPE_boolean, "Valide"),
        ];

        return new ModuleTable(ModuleAnimation.getInstance(), AnimationReponseVO.API_TYPE_ID, null, datatable_fields, null);
    }

    public static fields(): Array<DatatableField<any, any>> {
        let fields: Array<DatatableField<any, any>> = [];
        let moduleTable: ModuleTable<any> = AnimationReponseVO.moduleTable();
        let moduleTable_fields: Array<ModuleTableField<any>> = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (let i in moduleTable_fields) {
                let field: ModuleTableField<any> = moduleTable_fields[i];
                fields.push(SimpleDatatableFieldVO.createNew(field.field_id).setModuleTable(moduleTable));
            }
        }

        return fields;
    }

    // public _type: string;
    public id: number;

    public weight: number;
    public name: string;
    public valid: boolean;
}
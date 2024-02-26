import { field_names } from '../../../../../tools/ObjectHandler';
import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../../IDistantVOBase';
import ModuleTableVO from '../../../../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../ModuleTableFieldVO';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationReponseVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'anim_reponse';

    public static moduleTable(): ModuleTableVO<any> {
        let datatable_fields = [
            ModuleTableFieldController.create_new(AnimationReponseVO.API_TYPE_ID, field_names<AnimationReponseVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Poids"),
            ModuleTableFieldController.create_new(AnimationReponseVO.API_TYPE_ID, field_names<AnimationReponseVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Réponse"),
            ModuleTableFieldController.create_new(AnimationReponseVO.API_TYPE_ID, field_names<AnimationReponseVO>().valid, ModuleTableFieldVO.FIELD_TYPE_boolean, "Valide"),
        ];

        return new ModuleTableVO(ModuleAnimation.getInstance(), AnimationReponseVO.API_TYPE_ID, null, datatable_fields, null);
    }

    public static fields(): Array<DatatableField<any, any>> {
        let fields: Array<DatatableField<any, any>> = [];
        let moduleTable: ModuleTableVO<any> = AnimationReponseVO.moduleTable();
        let moduleTable_fields: Array<ModuleTableFieldVO<any>> = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (let i in moduleTable_fields) {
                let field: ModuleTableFieldVO<any> = moduleTable_fields[i];
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
import { field_names } from '../../../../../tools/ObjectHandler';
import ModuleTableController from '../../../../DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../DAO/vos/ModuleTableVO';
import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../../IDistantVOBase';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationReponseVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'anim_reponse';

    public static moduleTable(): ModuleTableVO {
        ModuleTableFieldController.create_new(AnimationReponseVO.API_TYPE_ID, field_names<AnimationReponseVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Poids");
        ModuleTableFieldController.create_new(AnimationReponseVO.API_TYPE_ID, field_names<AnimationReponseVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Réponse");
        ModuleTableFieldController.create_new(AnimationReponseVO.API_TYPE_ID, field_names<AnimationReponseVO>().valid, ModuleTableFieldVO.FIELD_TYPE_boolean, "Valide");

        return ModuleTableController.create_new(ModuleAnimation.getInstance().name, AnimationReponseVO, null, ModuleAnimation.getInstance().name);
    }

    public static fields(): Array<DatatableField<any, any>> {
        const fields: Array<DatatableField<any, any>> = [];
        const moduleTable: ModuleTableVO = AnimationReponseVO.moduleTable();
        const moduleTable_fields: ModuleTableFieldVO[] = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (const i in moduleTable_fields) {
                const field: ModuleTableFieldVO = moduleTable_fields[i];
                fields.push(SimpleDatatableFieldVO.createNew(field.field_id).setModuleTable(moduleTable));
            }
        }

        return fields;
    }

    public _type: string = AnimationReponseVO.API_TYPE_ID;
    public id: number;

    public weight: number;
    public name: string;
    public valid: boolean;
}
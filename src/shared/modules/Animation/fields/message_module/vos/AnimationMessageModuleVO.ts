import { field_names } from '../../../../../tools/ObjectHandler';
import ModuleTableController from '../../../../DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../DAO/vos/ModuleTableVO';
import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../../IDistantVOBase';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationMessageModuleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'anim_message_module';

    public static moduleTable(): ModuleTableVO {
        const datatable_fields = [
            ModuleTableFieldController.create_new(AnimationMessageModuleVO.API_TYPE_ID, field_names<AnimationMessageModuleVO>().min, ModuleTableFieldVO.FIELD_TYPE_prct, "Min"),
            ModuleTableFieldController.create_new(AnimationMessageModuleVO.API_TYPE_ID, field_names<AnimationMessageModuleVO>().max, ModuleTableFieldVO.FIELD_TYPE_prct, "Max"),
            ModuleTableFieldController.create_new(AnimationMessageModuleVO.API_TYPE_ID, field_names<AnimationMessageModuleVO>().message, ModuleTableFieldVO.FIELD_TYPE_html, "Message"),
        ];

        return ModuleTableController.create_new(ModuleAnimation.getInstance().name, AnimationMessageModuleVO, null, ModuleAnimation.getInstance().name);
    }

    public static fields(): Array<DatatableField<any, any>> {
        const fields: Array<DatatableField<any, any>> = [];
        const moduleTable: ModuleTableVO = AnimationMessageModuleVO.moduleTable();
        const moduleTable_fields: ModuleTableFieldVO[] = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (const i in moduleTable_fields) {
                const field: ModuleTableFieldVO = moduleTable_fields[i];
                fields.push(SimpleDatatableFieldVO.createNew(field.field_id).setModuleTable(moduleTable));
            }
        }

        return fields;
    }

    public _type: string = AnimationMessageModuleVO.API_TYPE_ID;
    public id: number;

    public min: number;
    public max: number;
    public message: string;
}
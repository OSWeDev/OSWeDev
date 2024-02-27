import { field_names } from '../../../../../tools/ObjectHandler';
import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../../IDistantVOBase';
import ModuleTableVO from '../../../../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../ModuleTableFieldVO';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationMessageModuleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'anim_message_module';

    public static moduleTable(): ModuleTableVO {
        let datatable_fields = [
            ModuleTableFieldController.create_new(AnimationMessageModuleVO.API_TYPE_ID, field_names<AnimationMessageModuleVO>().min, ModuleTableFieldVO.FIELD_TYPE_prct, "Min"),
            ModuleTableFieldController.create_new(AnimationMessageModuleVO.API_TYPE_ID, field_names<AnimationMessageModuleVO>().max, ModuleTableFieldVO.FIELD_TYPE_prct, "Max"),
            ModuleTableFieldController.create_new(AnimationMessageModuleVO.API_TYPE_ID, field_names<AnimationMessageModuleVO>().message, ModuleTableFieldVO.FIELD_TYPE_html, "Message"),
        ];

        return new ModuleTableVO(ModuleAnimation.getInstance(), AnimationMessageModuleVO.API_TYPE_ID, null, datatable_fields, null);
    }

    public static fields(): Array<DatatableField<any, any>> {
        let fields: Array<DatatableField<any, any>> = [];
        let moduleTable: ModuleTableVO = AnimationMessageModuleVO.moduleTable();
        let moduleTable_fields: ModuleTableFieldVO[] = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (let i in moduleTable_fields) {
                let field: ModuleTableFieldVO = moduleTable_fields[i];
                fields.push(SimpleDatatableFieldVO.createNew(field.field_id).setModuleTable(moduleTable));
            }
        }

        return fields;
    }

    // public _type: string;
    public id: number;

    public min: number;
    public max: number;
    public message: string;
}
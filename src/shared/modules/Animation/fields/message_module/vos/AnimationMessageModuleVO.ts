import { field_names } from '../../../../../tools/ObjectHandler';
import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../../IDistantVOBase';
import ModuleTable from '../../../../ModuleTable';
import ModuleTableField from '../../../../ModuleTableField';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationMessageModuleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'anim_message_module';

    public static moduleTable(): ModuleTable<any> {
        let datatable_fields = [
            new ModuleTableField(field_names<AnimationMessageModuleVO>().min, ModuleTableField.FIELD_TYPE_prct, "Min"),
            new ModuleTableField(field_names<AnimationMessageModuleVO>().max, ModuleTableField.FIELD_TYPE_prct, "Max"),
            new ModuleTableField(field_names<AnimationMessageModuleVO>().message, ModuleTableField.FIELD_TYPE_html, "Message"),
        ];

        return new ModuleTable(ModuleAnimation.getInstance(), AnimationMessageModuleVO.API_TYPE_ID, null, datatable_fields, null);
    }

    public static fields(): Array<DatatableField<any, any>> {
        let fields: Array<DatatableField<any, any>> = [];
        let moduleTable: ModuleTable<any> = AnimationMessageModuleVO.moduleTable();
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

    public min: number;
    public max: number;
    public message: string;
}
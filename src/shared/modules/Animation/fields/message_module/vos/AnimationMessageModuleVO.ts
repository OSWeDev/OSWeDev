import DatatableField from '../../../../DAO/vos/datatable/DatatableField';
import SimpleDatatableField from '../../../../DAO/vos/datatable/SimpleDatatableField';
import ModuleTable from '../../../../ModuleTable';
import ModuleTableField from '../../../../ModuleTableField';
import ModuleAnimation from '../../../ModuleAnimation';

export default class AnimationMessageModuleVO {
    public static API_TYPE_ID: string = 'anim_message_module';

    public static moduleTable(): ModuleTable<any> {
        let datatable_fields = [
            new ModuleTableField('min', ModuleTableField.FIELD_TYPE_prct, "Min"),
            new ModuleTableField('max', ModuleTableField.FIELD_TYPE_prct, "Max"),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, "Message"),
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
                let data_field: SimpleDatatableField<any, any> = new SimpleDatatableField(field.field_id, field.field_label.code_text);
                data_field.setModuleTable(moduleTable);
                fields.push(data_field);
            }
        }

        return fields;
    }

    public id: number;
    public min: number;
    public max: number;
    public message: string;
}
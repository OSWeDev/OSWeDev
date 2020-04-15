import { Component, Prop } from 'vue-property-decorator';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import VueComponentBase from '../../../VueComponentBase';
import FileDatatableFieldComponent from '../fields/file/file_datatable_field';

@Component({
    template: require('./DatatableComponentField.pug'),
    components: {
        Filedatatablefieldcomponent: FileDatatableFieldComponent
    }
})
export default class DatatableComponentField extends VueComponentBase {

    @Prop()
    private field: DatatableField<any, any>;

    @Prop()
    private vo: IDistantVOBase;

    @Prop({ default: false })
    private show_label: boolean;

    public async mounted() { }

    get simple_field(): SimpleDatatableField<any, any> {
        return (this.field as SimpleDatatableField<any, any>);
    }

    get field_value(): any {
        return this.vo[this.field.datatable_field_uid];
    }

    get transliterate_enum_value_to_class_name(): string {
        return ((this.field_value !== null && this.field_value !== undefined) ? this.field_value.toString().replace(/[^a-zA-Z0-9-_]/ig, '_') : this.field_value);
    }

    get is_custom_field_type(): boolean {
        return !!this.custom_field_types;
    }

    get custom_field_types(): TableFieldTypeControllerBase {
        if (TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
            return TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[this.simple_field.moduleTableField.field_type];
        }

        return null;
    }
}
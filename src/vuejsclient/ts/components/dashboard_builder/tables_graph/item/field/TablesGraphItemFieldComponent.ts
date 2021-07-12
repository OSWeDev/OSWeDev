import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VueComponentBase from '../../../../VueComponentBase';
import './TablesGraphItemFieldComponent.scss';

@Component({
    template: require('./TablesGraphItemFieldComponent.pug'),
    components: {}
})
export default class TablesGraphItemFieldComponent extends VueComponentBase {

    @Prop()
    private field: ModuleTableField<any>;

    get field_label(): string {
        if (!this.field) {
            return null;
        }

        return this.t(this.field.field_label.code_text);
    }
}
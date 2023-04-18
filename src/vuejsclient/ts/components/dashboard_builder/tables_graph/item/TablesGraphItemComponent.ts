import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import { VOsTypesManager } from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import VueComponentBase from '../../../VueComponentBase';
import TablesGraphItemFieldComponent from './field/TablesGraphItemFieldComponent';
import './TablesGraphItemComponent.scss';

@Component({
    template: require('./TablesGraphItemComponent.pug'),
    components: {
        Tablesgraphitemfieldcomponent: TablesGraphItemFieldComponent
    }
})
export default class TablesGraphItemComponent extends VueComponentBase {

    @Prop()
    private vo_type: string;

    get table_name(): string {

        if (!this.vo_type) {
            return null;
        }

        return this.t(VOsTypesManager.moduleTables_by_voType[this.vo_type].label.code_text);
    }

    get fields(): Array<ModuleTableField<any>> {

        return VOsTypesManager.moduleTables_by_voType[this.vo_type].get_fields();
    }
}
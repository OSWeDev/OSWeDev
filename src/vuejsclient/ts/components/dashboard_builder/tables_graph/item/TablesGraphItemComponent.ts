import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import VueComponentBase from '../../../VueComponentBase';
import './TablesGraphItemComponent.scss';
import TablesGraphItemFieldComponent from './field/TablesGraphItemFieldComponent';

@Component({
    template: require('./TablesGraphItemComponent.pug'),
    components: {
        Tablesgraphitemfieldcomponent: TablesGraphItemFieldComponent,
    },
})
export default class TablesGraphItemComponent extends VueComponentBase {

    @Prop()
    private vo_type: string;

    get table_name(): string {

        if (!this.vo_type) {
            return null;
        }

        return this.t(ModuleTableController.module_tables_by_vo_type[this.vo_type].label.code_text);
    }

    get fields(): ModuleTableFieldVO[] {

        return ModuleTableController.module_tables_by_vo_type[this.vo_type].get_fields();
    }
}
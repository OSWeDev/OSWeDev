import debounce from 'lodash/debounce';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import './TablesGraphEditFormComponent.scss';

@Component({
    template: require('./TablesGraphEditFormComponent.pug'),
    components: {}
})
export default class TablesGraphEditFormComponent extends VueComponentBase {

    @Prop()
    private cellData: any;

    private async debounce_change() {
        debounce(function () {
            this.$emit('change', this.cellData.value);
        }, 200);
    }
}
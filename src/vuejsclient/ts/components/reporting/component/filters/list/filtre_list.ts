import Component from 'vue-class-component';
import { Watch, Prop } from 'vue-property-decorator';
import { ServerTable, ClientTable, Event } from 'vue-tables-2';
import VueComponentBase from '../../../../VueComponentBase';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';

@Component({
    template: require('./filtre_list.pug'),
    components: {}
})
export default class VueFilterListComponent extends VueComponentBase {

    @Prop({ default: null })
    public name: string;

    @Prop({ default: null })
    public default_value: any[];

    @Prop({ default: null })
    public all_values: DataFilterOption[];

    public values: DataFilterOption[] = [];

    @Watch('values')
    public on_change_values(): void {
        Event.$emit('vue-tables.filter::' + this.name, this.values);
    }

    public created(): void {
        this.values = (this.default_value) ? this.default_value : null;
    }

    public select_all(): void {
        this.values = this.all_values;
    }

    public deselect_all(): void {
        this.values = [];
    }
}
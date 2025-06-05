import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Event } from 'vue-tables-2';
import DataFilterOptionVO from '../../../../../../../shared/modules/DataRender/vos/DataFilterOptionVO';
import VueComponentBase from '../../../../VueComponentBase';

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
    public all_values: DataFilterOptionVO[];

    public values: DataFilterOptionVO[] = [];

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
import Component from 'vue-class-component';
import { Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./filtre_date.pug'),
    components: {}
})
export default class VueFilterDateComponent extends VueComponentBase {

    @Prop({ default: null })
    public name: string;

    @Prop({ default: null })
    public default_value: string;

    public value: string = null;

    @Watch('value')
    public on_change_value(): void {
        // TODO FIXME vue-table-2 n'existe plus Event.$emit('vue-tables.filter::' + this.name, this.value);
    }

    public created(): void {
        this.value = (this.default_value) ? this.default_value : null;
    }
}
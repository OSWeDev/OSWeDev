import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../VueComponentBase';
import './MultiInputComponent.scss';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load

@Component({
    template: require('./MultiInputComponent.pug')
})
export default class MultiInputComponent extends VueComponentBase {

    @Prop({ default: null })
    private value_constructor: () => any;

    @Prop({ default: false })
    private use_wysiwyg: boolean;

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: any[];

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    @Prop({ default: null })
    private custom_field_component: VueComponentBase;

    /**
     * Si custom => on utilise le custom_field_component
     * Si slot => on utilise un slot et pas les input
     * Si use_wysiwyg => quilleditor
     * Par défaut input
     */
    @Prop({ default: 'text' })
    private type_input: string;

    private values: any[] = [];

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        this.values = (this.value) ? this.value : [];
        while (this.values.length < this.min_values) {
            this.addValue();
        }

        while (this.values.length > this.max_values) {
            this.removeValue(this.values.length - 1);
        }
    }

    private emitInput(): void {
        this.$emit('input', this.values);
        this.$emit('input_with_infos', this.values, this.field, this.vo);
    }

    private addValue(): void {
        this.values.push(this.value_constructor ? this.value_constructor() : null);
        this.emitInput();
    }

    private removeValue(i): void {
        this.values.splice(i, 1);
        this.emitInput();
    }

    get min_values(): number {
        return this.field ? this.field.min_values : 0;
    }

    get max_values(): number {
        return this.field ? this.field.max_values : 999;
    }
}

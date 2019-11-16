import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction } from '../dao/store/DaoStore';
import VueComponentBase from '../VueComponentBase';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import './MultiInputComponent.scss';

@Component({
    template: require('./MultiInputComponent.pug'),
    components: {}
})
export default class MultiInputComponent extends VueComponentBase {

    @Prop({ default: 0 })
    private min_values: number;

    @Prop({ default: 999 })
    private max_values: number;

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
}
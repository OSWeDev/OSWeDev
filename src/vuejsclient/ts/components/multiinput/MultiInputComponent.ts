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
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop({ default: false })
    protected use_wysiwyg: boolean;

    @Prop({ default: false })
    protected required: boolean;

    @Prop({ default: false })
    protected disabled: boolean;

    @Prop({ default: null })
    protected field_value: any[];

    @Prop({ default: null })
    protected field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    protected vo: IDistantVOBase;

    @Prop({ default: 'text' })
    protected type_input: string;

    private values: any[] = [];
    private nb_values: number = null;

    @Watch('field_value', { immediate: true })
    public async onchange_field_value(): Promise<void> {
        this.values = (this.field_value) ? this.field_value : [];
        this.nb_values = (this.field_value) ? this.field_value.length : 1;
    }

    public emitInput(): void {
        this.$emit('input', this.values, this.field, this.vo);
    }

    public addNumberToField(target): void {
        this.values.push(null);
        this.nb_values++;
    }

    public removeNumberToField(target): void {
        delete this.values[target.parentElement.parentElement.getAttribute('index')];
        this.values = this.values.filter(() => true);
        this.nb_values--;
        this.emitInput();
    }
}
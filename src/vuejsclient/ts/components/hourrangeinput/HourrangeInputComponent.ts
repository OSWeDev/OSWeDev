import { Duration } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import HourRange from '../../../../shared/modules/DataRender/vos/HourRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import HourHandler from '../../../../shared/tools/HourHandler';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import VueComponentBase from '../VueComponentBase';
import './HourrangeInputComponent.scss';

@Component({
    template: require('./HourrangeInputComponent.pug'),
    components: {}
})
export default class HourrangeInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: HourRange;

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private hourrange_start: string = null;
    private hourrange_end: string = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {
        if (!this.value) {
            this.hourrange_start = null;
            this.hourrange_end = null;
            return;
        }
        this.hourrange_start = HourHandler.getInstance().formatHourForIHM(RangeHandler.getInstance().getSegmentedMin(this.value, this.field.moduleTableField.segmentation_type), this.field.moduleTableField.segmentation_type);
        this.hourrange_end = HourHandler.getInstance().formatHourForIHM(RangeHandler.getInstance().getSegmentedMax(this.value, this.field.moduleTableField.segmentation_type, 1), this.field.moduleTableField.segmentation_type);
    }

    @Watch('hourrange_start')
    @Watch('hourrange_end')
    private emitInput(): void {

        let hourstart: Duration = HourHandler.getInstance().formatHourFromIHM(this.hourrange_start, this.field.moduleTableField.segmentation_type);
        let hourend: Duration = HourHandler.getInstance().formatHourFromIHM(this.hourrange_end, this.field.moduleTableField.segmentation_type);

        let new_value = RangeHandler.getInstance().createNew(HourRange.RANGE_TYPE, hourstart, hourend, true, false, this.field.moduleTableField.segmentation_type);
        this.$emit('input', new_value);
    }
}
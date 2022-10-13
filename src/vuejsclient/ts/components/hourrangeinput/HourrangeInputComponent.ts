
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import HourRange from '../../../../shared/modules/DataRender/vos/HourRange';
import HourSegment from '../../../../shared/modules/DataRender/vos/HourSegment';
import Durations from '../../../../shared/modules/FormatDatesNombres/Dates/Durations';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import HourHandler from '../../../../shared/tools/HourHandler';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./HourrangeInputComponent.pug'),
    components: {}
})
export default class HourrangeInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private inline_input_mode: boolean;

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: true })
    private auto_next_day: boolean;

    @Prop({ default: true })
    private auto_max_one_day: boolean;

    @Prop({ default: null })
    private segmentation_type: number;

    @Prop({ default: null })
    private value: HourRange;

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private hourrange_start: string = null;
    private hourrange_end: string = null;

    private new_value: HourRange = null;

    get segmentation_type_value() {
        if (this.segmentation_type == null) {
            return this.field.moduleTableField.segmentation_type;
        }

        return this.segmentation_type;
    }

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {

        if (this.new_value == this.value) {
            return;
        }

        this.new_value = this.value;

        if (!this.value) {
            // TODO FIXME si la donnée est invalide, on peut pas la vider non plus sinon on peut jamais saisir un horaire...
            this.hourrange_start = null;
            this.hourrange_end = null;
            return;
        }
        this.hourrange_start = HourHandler.getInstance().formatHourForIHM(RangeHandler.getInstance().getSegmentedMin(this.value, this.segmentation_type_value), this.segmentation_type_value);
        this.hourrange_end = HourHandler.getInstance().formatHourForIHM(RangeHandler.getInstance().getSegmentedMax(this.value, this.segmentation_type_value, 1), this.segmentation_type_value);
    }

    @Watch('hourrange_start')
    @Watch('hourrange_end')
    private emitInput(): void {

        let new_value = null;
        let hourstart: number = HourHandler.getInstance().formatHourFromIHM(this.hourrange_start, this.segmentation_type_value);
        let hourend: number = HourHandler.getInstance().formatHourFromIHM(this.hourrange_end, this.segmentation_type_value);

        if (this.auto_next_day && hourend && hourstart && (hourend <= hourstart)) {
            hourend = Durations.add(hourend, 24, HourSegment.TYPE_HOUR);
        }

        if (this.auto_max_one_day && hourend && hourstart && (hourend > hourstart) && ((hourend - hourstart) > (60 * 24 * 60))) {
            hourend = Durations.add(hourend, -24, HourSegment.TYPE_HOUR);
        }

        if (hourstart && hourend) {
            new_value = RangeHandler.getInstance().createNew(HourRange.RANGE_TYPE, hourstart, hourend, true, false, this.segmentation_type_value);
        } else {
            new_value = null;
        }

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.getInstance().is_same(old_value, new_value))) {
            return;
        }
        this.new_value = new_value;


        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }
}
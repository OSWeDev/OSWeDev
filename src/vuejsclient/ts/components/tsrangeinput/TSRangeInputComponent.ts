import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import HourRange from '../../../../shared/modules/DataRender/vos/HourRange';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import VueComponentBase from '../VueComponentBase';
import './TSRangeInputComponent.scss';
import moment = require('moment');
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';

@Component({
    template: require('./TSRangeInputComponent.pug'),
    components: {}
})
export default class TSRangeInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: TSRange;

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private tsrange_start: Date = null;
    private tsrange_end: Date = null;

    private new_value: TSRange = null;

    @Watch('value', { immediate: true })
    private async onchange_value(): Promise<void> {

        if (this.new_value == this.value) {
            return;
        }

        this.new_value = this.value;

        if (!this.value) {
            this.tsrange_start = null;
            this.tsrange_end = null;
            return;
        }
        this.tsrange_start = RangeHandler.getInstance().getSegmentedMin(this.value, this.field.moduleTableField.segmentation_type).toDate();
        this.tsrange_end = RangeHandler.getInstance().getSegmentedMax(this.value, this.field.moduleTableField.segmentation_type, 1).toDate();
    }

    @Watch('tsrange_start')
    @Watch('tsrange_end')
    private emitInput(): void {

        let tsstart: Moment = moment(this.tsrange_start).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.field.moduleTableField.segmentation_type));
        let tsend: Moment = moment(this.tsrange_end).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.field.moduleTableField.segmentation_type));

        this.new_value = RangeHandler.getInstance().createNew(HourRange.RANGE_TYPE, tsstart, tsend, true, false, this.field.moduleTableField.segmentation_type);
        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }

    get is_segmentation_mois(): boolean {
        return this.value && (this.value.segment_type == TimeSegment.TYPE_MONTH);
    }

    get is_segmentation_day(): boolean {
        return this.value && (this.value.segment_type == TimeSegment.TYPE_DAY);
    }
}
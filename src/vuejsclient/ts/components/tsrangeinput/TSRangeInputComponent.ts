import * as clonedeep from 'lodash/cloneDeep';
import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import * as lang from "vuejs-datepicker/src/locale";
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import VueComponentBase from '../VueComponentBase';
import './TSRangeInputComponent.scss';
import moment = require('moment');

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
    private tsrange_date: Date = null;
    private tsrange_start_time: string = null;
    private tsrange_end_time: string = null;

    private new_value: TSRange = null;

    private format_datepicker_month: string = 'MM/yyyy';
    private format_datepicker_day: string = 'dd/MM/yyyy';
    private format_time: string = 'HH:mm';

    private language = "fr";
    private languages = lang;

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

        let min: Moment = RangeHandler.getInstance().getSegmentedMin(this.value, this.field.moduleTableField.segmentation_type);
        let max: Moment = RangeHandler.getInstance().getSegmentedMax(this.value, this.field.moduleTableField.segmentation_type);

        this.tsrange_start = min.toDate();
        this.tsrange_end = max.toDate();

        if (this.tsrange_start) {
            this.tsrange_date = this.tsrange_start ? clonedeep(this.tsrange_start) : null;
            this.tsrange_start_time = min ? min.format(this.format_time) : null;
            this.tsrange_end_time = max ? max.format(this.format_time) : null;
        }
    }

    @Watch('tsrange_start')
    @Watch('tsrange_end')
    private emitInput(): void {
        this.new_value = RangeHandler.getInstance().createNew(TSRange.RANGE_TYPE, this.ts_start, this.ts_end, true, true, this.field.moduleTableField.segmentation_type);
        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }

    @Watch('tsrange_date')
    @Watch('tsrange_start_time')
    @Watch('tsrange_end_time')
    private on_change_tsrange_date_time(): void {
        this.new_value = RangeHandler.getInstance().createNew(TSRange.RANGE_TYPE, this.ts_start, this.ts_end, true, true, this.field.moduleTableField.segmentation_type);
        this.$emit('input', this.new_value);
        this.$emit('input_with_infos', this.new_value, this.field, this.vo);
    }

    get is_segmentation_mois(): boolean {
        return this.field && this.field.moduleTableField && (this.field.moduleTableField.segmentation_type == TimeSegment.TYPE_MONTH);
    }

    get is_segmentation_day(): boolean {
        return this.field && this.field.moduleTableField && (this.field.moduleTableField.segmentation_type == TimeSegment.TYPE_DAY);
    }

    get is_segmentation_minute(): boolean {
        return this.field && this.field.moduleTableField && (this.field.moduleTableField.segmentation_type == TimeSegment.TYPE_MINUTE);
    }

    get ts_start(): Moment {
        if (this.is_segmentation_minute) {
            let start: Moment = moment(this.tsrange_date).utc(true);
            let hours: string[] = (this.tsrange_start_time) ? this.tsrange_start_time.split(':') : null;

            if (hours && hours.length > 0) {
                start.hours(parseInt(hours[0])).minutes(parseInt(hours[1]));
            }

            return start;
        }

        return moment(this.tsrange_start).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.field.moduleTableField.segmentation_type));
    }

    get ts_end(): Moment {
        if (this.is_segmentation_minute) {
            let end: Moment = moment(this.tsrange_date).utc(true);
            let hours: string[] = (this.tsrange_end_time) ? this.tsrange_end_time.split(':') : null;

            if (hours && hours.length > 0) {
                end.hours(parseInt(hours[0])).minutes(parseInt(hours[1]));
            }

            return end;
        }

        return moment(this.tsrange_end).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.field.moduleTableField.segmentation_type));
    }
}
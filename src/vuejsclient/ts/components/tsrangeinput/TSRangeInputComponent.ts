import cloneDeep from 'lodash/cloneDeep';
import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import * as lang from "vuejs-datepicker/src/locale";
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';
import VueComponentBase from '../VueComponentBase';
import * as moment from 'moment';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import VueAppController from '../../../VueAppController';

@Component({
    template: require('./TSRangeInputComponent.pug'),
    components: {}
})
export default class TSRangeInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: true })
    private form_control: boolean;

    @Prop({ default: null })
    private value: TSRange;

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private segmentation_type: number;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private tsrange_start: Date = null;
    private tsrange_end: Date = null;
    private tsrange_date: Date = null;
    private tsrange_start_time: string = null;
    private tsrange_end_time: string = null;

    private new_value: TSRange = null;

    private format_datepicker_year: string = 'yyyy';
    private format_datepicker_month: string = 'MM/yyyy';
    private format_datepicker_day: string = 'dd/MM/yyyy';
    private format_time: string = 'HH:mm';

    private language = VueAppController.getInstance().data_user_lang ? VueAppController.getInstance().data_user_lang.code_lang : null;
    private languages = lang;


    private segmentation_type_: number = null;

    @Watch('vo', { immediate: true })
    private onchange_vo() {
        if (!this.vo) {
            this.tsrange_start = null;
            this.tsrange_end = null;
            this.tsrange_date = null;
            this.tsrange_start_time = null;
            this.tsrange_end_time = null;
            this.new_value = null;
        }
    }

    @Watch('field', { immediate: true })
    private onchange_field() {
        if (!!this.field) {
            if (this.segmentation_type == null) {
                this.segmentation_type_ = this.field.moduleTableField.segmentation_type;
                return;
            }
        }
        this.segmentation_type_ = this.segmentation_type;
    }

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

        let min: Moment = RangeHandler.getInstance().getSegmentedMin(this.value, this.segmentation_type_);
        let max: Moment = RangeHandler.getInstance().getSegmentedMax(this.value, this.segmentation_type_);

        this.tsrange_start = min.toDate();
        this.tsrange_end = max.toDate();

        if (this.tsrange_start) {
            this.tsrange_date = this.tsrange_start ? cloneDeep(this.tsrange_start) : null;
            this.tsrange_start_time = min ? min.format(this.format_time) : null;
            this.tsrange_end_time = max ? max.format(this.format_time) : null;
        }
    }

    @Watch('tsrange_date')
    @Watch('tsrange_start_time')
    @Watch('tsrange_end_time')
    @Watch('tsrange_start')
    @Watch('tsrange_end')
    private emitInput(): void {
        this.new_value = RangeHandler.getInstance().createNew(TSRange.RANGE_TYPE, this.ts_start, this.ts_end, true, true, this.segmentation_type_);
        this.$emit('input', this.new_value);

        if (!!this.vo) {
            this.$emit('input_with_infos', this.new_value, this.field, this.vo);
        }
    }

    get is_segmentation_year(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_YEAR;
    }

    get is_segmentation_mois(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_MONTH;
    }

    get is_segmentation_day(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_DAY;
    }

    get is_segmentation_minute(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_MINUTE;
    }

    get ts_start(): Moment {
        if (this.is_segmentation_minute) {
            if (!this.tsrange_date) {
                return null;
            }

            let start: Moment = moment(this.tsrange_date).utc(true);
            let hours: string[] = (this.tsrange_start_time) ? this.tsrange_start_time.split(':') : null;

            if (!hours) {
                return null;
            }

            if (hours && hours.length > 0) {
                start.hours(parseInt(hours[0])).minutes(parseInt(hours[1]));
            }

            return start;
        }

        if (!this.tsrange_start) {
            return null;
        }

        return moment(this.tsrange_start).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.segmentation_type_));
    }

    get ts_end(): Moment {
        if (this.is_segmentation_minute) {
            if (!this.tsrange_date) {
                return null;
            }

            let end: Moment = moment(this.tsrange_date).utc(true);
            let hours: string[] = (this.tsrange_end_time) ? this.tsrange_end_time.split(':') : null;

            if (!hours) {
                return null;
            }

            if (hours && hours.length > 0) {
                end.hours(parseInt(hours[0])).minutes(parseInt(hours[1]));
                end.add(-1, 'minute');
            }

            if (end.isBefore(this.ts_start, 'minute')) {
                end.add(1, 'day');
            }
            return end;
        }

        if (!this.tsrange_end) {
            return null;
        }

        return moment(this.tsrange_end).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.segmentation_type_));
    }
}
import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import * as lang from "vuejs-datepicker/src/locale";
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';
import VueComponentBase from '../VueComponentBase';
import * as moment from 'moment';

@Component({
    template: require('./TSTZInputComponent.pug'),
    components: {}
})
export default class TSTZInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: null })
    private value: Moment;

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private date_value: Date = null;
    private time_value: string = null;

    private new_value: Moment = null;

    private format_datepicker_year: string = 'yyyy';
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
            this.date_value = null;
            this.time_value = null;
            return;
        }

        this.date_value = this.value.toDate();

        if (this.value) {
            this.time_value = this.value ? this.value.format(this.format_time) : null;
        }
    }

    @Watch('date_value')
    @Watch('time_value')
    private emitInput(): void {
        this.new_value = this.tstz_value;
        this.$emit('input', this.new_value);

        if (!!this.vo) {
            this.$emit('input_with_infos', this.new_value, this.field, this.vo);
        }
    }

    get tstz_value(): Moment {
        if (this.segmentation_time) {
            let date_time: Moment = moment(this.date_value).utc(true);
            let hours: string[] = (this.time_value) ? this.time_value.split(':') : null;

            if (hours && hours.length > 0) {
                date_time.hours(parseInt(hours[0])).minutes(parseInt(hours[1]));
            }

            return date_time;
        }

        return moment(this.date_value).utc(true).startOf(TimeSegmentHandler.getInstance().getCorrespondingMomentUnitOfTime(this.segmentation_type));
    }

    get segmentation_time(): boolean {
        return (this.segmentation_type == 5) || (this.segmentation_type == 6);
    }

    get segmentation_type(): number {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableField<any, any>).moduleTableField.segmentation_type;
        }

        return null;
    }

    get datepicker_view(): string {
        if (this.segmentation_type == 0) {
            return 'year';
        }

        if (this.segmentation_type == 1) {
            return 'month';
        }

        return 'day';
    }

    get format_datepicker(): string {
        if (this.segmentation_type == 0) {
            return this.format_datepicker_year;
        }

        if (this.segmentation_type == 1) {
            return this.format_datepicker_month;
        }

        return this.format_datepicker_day;
    }
}
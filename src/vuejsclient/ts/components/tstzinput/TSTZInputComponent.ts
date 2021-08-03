
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import * as lang from "vuejs-datepicker/src/locale";
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VueAppController from '../../../VueAppController';
import VueComponentBase from '../VueComponentBase';

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
    private value: number;

    @Prop({ default: null })
    private field: SimpleDatatableField<any, any>;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    @Prop({ default: false })
    private inline_input_mode: boolean;

    private date_value: Date = null;
    private time_value: string = null;

    private new_value: number = null;

    private format_datepicker_year: string = 'yyyy';
    private format_datepicker_month: string = 'MM/yyyy';
    private format_datepicker_day: string = 'dd/MM/yyyy';
    private format_time: string = 'HH:mm';

    private language = VueAppController.getInstance().data_user_lang ? VueAppController.getInstance().data_user_lang.code_lang : null;
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

        this.date_value = new Date(this.value * 1000);

        if (this.value) {
            this.time_value = this.value ? Dates.format(this.value, this.format_time) : null;
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

    get tstz_value(): number {
        if (!this.date_value) {
            return null;
        }

        if (this.segmentation_time) {
            let date_time: number = this.date_value.getTime() / 1000;
            let hours: string[] = (this.time_value) ? this.time_value.split(':') : null;

            if (hours && hours.length > 0) {
                Dates.minutes(Dates.hours(date_time, parseInt(hours[0])), parseInt(hours[1]));
            }

            return date_time;
        }

        return Dates.startOf(this.date_value.getTime() / 1000, this.segmentation_type);
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
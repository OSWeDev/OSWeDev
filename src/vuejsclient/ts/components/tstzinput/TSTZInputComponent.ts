
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import {
    af,
    ar,
    bg,
    bs,
    ca,
    cs,
    da,
    de,
    ee,
    el,
    en,
    es,
    fa,
    fi,
    fo,
    fr,
    ge,
    gl,
    he,
    hr,
    hu,
    id,
    is,
    it,
    ja,
    kk,
    ko,
    lb,
    lt,
    lv,
    mk,
    mn,
    nbNO,
    nl,
    pl,
    ptBR,
    ro,
    ru,
    sk,
    slSI,
    srCYRL,
    sr,
    sv,
    th,
    tr,
    uk,
    ur,
    vi,
    zh,
    zhHK
} from "vuejs-datepicker/src/locale";
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
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
    private field: SimpleDatatableFieldVO<any, any>;

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

    private languages = {
        af,
        ar,
        bg,
        bs,
        ca,
        cs,
        da,
        de,
        ee,
        el,
        en,
        es,
        fa,
        fi,
        fo,
        fr,
        ge,
        gl,
        he,
        hr,
        hu,
        id,
        is,
        it,
        ja,
        kk,
        ko,
        lb,
        lt,
        lv,
        mk,
        mn,
        nbNO,
        nl,
        pl,
        ptBR,
        ro,
        ru,
        sk,
        slSI,
        srCYRL,
        sr,
        sv,
        th,
        tr,
        uk,
        ur,
        vi,
        zh,
        zhHK
    };

    get language(): string {

        if (!!VueAppController.getInstance().data_user_lang) {
            return VueAppController.getInstance().data_user_lang.code_lang ? VueAppController.getInstance().data_user_lang.code_lang.split('-')[0] : null;
        }

        return null;
    }

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
            this.time_value = this.value ? Dates.format(this.value, this.format_time, this.format_localized_time) : null;
        }
    }

    @Watch('date_value')
    @Watch('time_value')
    private emitInput(): void {
        let new_value = this.tstz_value;

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if (old_value == new_value) {
            return;
        }
        this.new_value = new_value;

        this.$emit('input', new_value);
        if (!!this.vo) {
            this.$emit('input_with_infos', this.new_value, this.field, this.vo);
        }
    }

    get tstz_value(): number {
        if (!this.date_value) {
            return null;
        }

        let date = null;
        let format = 'DD/MM/YYYY HH:mm:ss';

        let hour_ts: number = null;
        let hours: string[] = (this.time_value) ? this.time_value.split(':') : null;

        if (hours && hours.length > 0) {
            hour_ts = Dates.minutes(Dates.hours(0, parseInt(hours[0])), parseInt(hours[1]));
        }

        switch (this.segmentation_type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                date = '01/01/' + Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_YEAR), 'YYYY', false) + ' 00:00:00';
                break;
            case TimeSegment.TYPE_MONTH:
                date = '01/' + Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_MONTH), 'MM/YYYY', false) + ' 00:00:00';
                break;
            case TimeSegment.TYPE_WEEK:
                date = Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_WEEK), 'DD/MM/YYYY', false) + ' 00:00:00';
                break;
            case TimeSegment.TYPE_HOUR:
                date = Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_DAY) + hour_ts, 'DD/MM/YYYY HH:', false) + '00:00';
                break;
            case TimeSegment.TYPE_MINUTE:
                date = Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_DAY) + hour_ts, 'DD/MM/YYYY HH:mm', false) + ':00';
                break;
            case TimeSegment.TYPE_SECOND:
                date = Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_DAY) + hour_ts, 'DD/MM/YYYY HH:mm:ss', false);
                break;
            default:
            case TimeSegment.TYPE_DAY:
                date = Dates.format(Dates.startOf(this.date_value.getTime() / 1000, TimeSegment.TYPE_DAY), 'DD/MM/YYYY', false) + ' 00:00:00';
                break;
        }

        return Dates.parse(date, format, this.format_localized_time);
    }

    get segmentation_time(): boolean {
        return (this.segmentation_type == 5) || (this.segmentation_type == 6);
    }

    get segmentation_type(): number {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableFieldVO<any, any>).segmentation_type;
        }

        return null;
    }

    get format_localized_time(): boolean {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableFieldVO<any, any>).format_localized_time;
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

    get inline_input_mode_and_disabled(): boolean {
        if (this.disabled) {
            return false;
        }

        return this.inline_input_mode;
    }
}
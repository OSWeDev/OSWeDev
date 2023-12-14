import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
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
import TSRange from '../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueAppController from '../../../VueAppController';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./TSRangeInputComponent.pug'),
    components: {}
})
export default class TSRangeInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private inline_input_mode: boolean;

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: true })
    private form_control: boolean;

    @Prop({ default: null })
    private value: TSRange;

    @Prop({ default: null })
    private field: SimpleDatatableFieldVO<any, any>;

    @Prop({ default: null })
    private segmentation_type: number;

    @Prop({ default: null })
    private format_localized_time: boolean;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    /**
     * Une string de la forme composant_partieconcernee_option
     * Ex: 'tsrange_date_noneditable'
     * Ajouté à la base pour désactiver la partie date et ne permettre de modifier que les heures / minutes
     */
    @Prop({ default: null })
    private option: string;

    private tsrange_start: Date = null;
    private tsrange_end: Date = null;
    private tsrange_start_time: string = null;
    private tsrange_end_time: string = null;

    private new_value: TSRange = null;

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

    private segmentation_type_: number = null;

    @Watch('vo', { immediate: true })
    private onchange_vo() {
        if (!this.vo) {
            this.tsrange_start = null;
            this.tsrange_end = null;
            this.tsrange_start_time = null;
            this.tsrange_end_time = null;
            this.new_value = null;
        }
    }

    @Watch('field', { immediate: true })
    private onchange_field() {
        if (!!this.field) {
            if (this.segmentation_type == null) {
                if (this.field.moduleTableField) {
                    this.segmentation_type_ = this.field.segmentation_type;
                }
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

        let min: number = RangeHandler.is_left_open(this.value) ? null : RangeHandler.getSegmentedMin(this.value, this.segmentation_type_);
        let max: number = null;

        if (!RangeHandler.is_right_open(this.value)) {
            let segmentation_type_max: number = this.segmentation_type_;

            if (this.is_segmentation_week) {
                segmentation_type_max = TimeSegment.TYPE_DAY;
            }

            max = RangeHandler.getSegmentedMax(this.value, segmentation_type_max);
        }

        if ((this.is_segmentation_day || this.is_segmentation_mois || this.is_segmentation_year) && this.field) {
            if (!!min && !!max && min != max) {
                max = Dates.add(max, this.field.max_range_offset, this.segmentation_type_);
            }
        }

        if (min) {
            this.tsrange_start = new Date(min * 1000);
            if (this.tsrange_start) {
                this.tsrange_start_time = (this.value && this.value.min) ? Dates.format(this.value.min, this.format_time, this.format_localized_time_) : null;
            }
        } else {
            this.tsrange_start = null;
            this.tsrange_start_time = null;
        }

        if (max) {
            this.tsrange_end = new Date(max * 1000);
            if (this.tsrange_end) {
                this.tsrange_end_time = (this.value && this.value.max) ? Dates.format(this.value.max, this.format_time, this.format_localized_time_) : null;
            }
        } else {
            this.tsrange_end = null;
            this.tsrange_end_time = null;
        }
    }

    @Watch('tsrange_start_time')
    @Watch('tsrange_end_time')
    @Watch('tsrange_start')
    @Watch('tsrange_end')
    private emitInput(): void {
        let new_value: TSRange = RangeHandler.createNew(
            TSRange.RANGE_TYPE,
            this.ts_start ? this.ts_start : RangeHandler.MIN_TS,
            this.ts_end ? this.ts_end : RangeHandler.MAX_TS,
            true,
            this.ts_end ? true : false,
            this.segmentation_type_
        );

        // Quand on est en Week, on va vérifier qu'on a bien sélectionné le début et fin de la semaine
        // Sinon on modifie les valeurs
        if (this.is_segmentation_week) {
            let to_edit: boolean = false;

            let start: number = RangeHandler.getSegmentedMin(new_value, TimeSegment.TYPE_DAY);
            if (this.tsrange_start && !Dates.isSame(start, moment(this.tsrange_start).utc(true).unix(), TimeSegment.TYPE_DAY)) {
                this.tsrange_start = new Date(start * 1000);
                to_edit = true;
            }

            let end: number = RangeHandler.getSegmentedMax(new_value, TimeSegment.TYPE_DAY);
            if (this.tsrange_end && !Dates.isSame(end, moment(this.tsrange_end).utc(true).unix(), TimeSegment.TYPE_DAY)) {
                this.tsrange_end = new Date(end * 1000);
                to_edit = true;
            }

            if (to_edit) {
                return;
            }
        }

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = (this.vo && this.field) ? this.vo[this.field.datatable_field_uid] : null;
        if ((old_value == new_value) ||
            (RangeHandler.is_same(old_value, new_value))) {
            return;
        }
        this.new_value = new_value;

        this.$emit('input', this.new_value);
        if (!!this.vo && this.field) {
            this.$emit('input_with_infos', this.new_value, this.field, this.vo);
        }
    }

    get is_segmentation_year(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_YEAR;
    }

    get is_segmentation_mois(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_MONTH;
    }

    get is_segmentation_week(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_WEEK;
    }

    get is_segmentation_day(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_DAY;
    }

    get is_segmentation_minute(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_MINUTE;
    }

    get ts_start(): number {
        if (this.is_segmentation_minute) {
            if (!this.tsrange_start) {
                return null;
            }

            let start: number = moment(this.tsrange_start).utc(true).unix();
            let hours: string[] = (this.tsrange_start_time) ? this.tsrange_start_time.split(':') : null;

            if (!hours) {
                return null;
            }

            if (hours && hours.length > 0) {
                start = Dates.minutes(Dates.hours(start, parseInt(hours[0])), parseInt(hours[1]));
            }

            return start;
        }

        if (!this.tsrange_start) {
            return null;
        }

        return Dates.startOf(moment(this.tsrange_start).utc(true).unix(), this.segmentation_type_);
    }

    get ts_end(): number {
        if (this.is_segmentation_minute) {
            if (!this.tsrange_end) {
                if (!this.tsrange_start) {
                    return null;
                }

                this.tsrange_end = cloneDeep(this.tsrange_start);
            }

            let end: number = Dates.parse(this.tsrange_end.toLocaleDateString(), 'DD/MM/YYYY', false);
            let hours: string[] = (this.tsrange_end_time) ? this.tsrange_end_time.split(':') : null;

            if (!hours) {
                return null;
            }

            if (hours && hours.length > 0) {
                end = Dates.minutes(Dates.hours(end, parseInt(hours[0])), parseInt(hours[1]));
                end = Dates.add(end, -1, TimeSegment.TYPE_MINUTE);
            }

            if (Dates.isBefore(end, this.ts_start, TimeSegment.TYPE_MINUTE)) {
                end = Dates.add(end, 1, TimeSegment.TYPE_DAY);
            }

            return end;
        }

        if (!this.tsrange_end) {
            return null;
        }

        let start_date_unix: number = moment(this.tsrange_start).utc(true).unix();
        let end_date_unix: number = moment(this.tsrange_end).utc(true).unix();

        if (start_date_unix == end_date_unix) {
            return Dates.startOf(end_date_unix, this.segmentation_type_);
        }

        if (this.field && !!this.field.max_range_offset) {
            end_date_unix = Dates.add(end_date_unix, -this.field.max_range_offset, this.segmentation_type_);
        }

        return Dates.startOf(end_date_unix, this.segmentation_type_);
    }

    /**
     * Fonction liée au param option
     * Vérifie qu'il correspond à la partie date d'un tsrange
     * Si oui, renvoie le comportement à adopter (string moins tsrange_date_ ; ex : 'tsrange_date_noneditable' -> 'noneditable')
     * Sinon, renvoie null
     */
    get date_option(): string {
        if (!this.option) {
            return null;
        }
        let option_arr: string[] = this.option.split('_');
        if (option_arr.length < 3 || option_arr[0] !== 'tsrange' || option_arr[1] !== 'date') {
            return null;
        }
        return option_arr[2];
    }

    get format_localized_time_(): boolean {

        if (this.format_localized_time !== null) {
            return this.format_localized_time;
        }

        if (this.field?.type == 'Simple') {
            return (this.field as SimpleDatatableFieldVO<any, any>).format_localized_time;
        }

        return null;
    }
}
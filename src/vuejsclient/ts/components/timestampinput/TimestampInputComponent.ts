

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
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import DateHandler from '../../../../shared/tools/DateHandler';
import VueAppController from '../../../VueAppController';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./TimestampInputComponent.pug'),
    components: {}
})
export default class TimestampInputComponent extends VueComponentBase {

    @Prop({ default: false })
    private inline_input_mode: boolean;

    @Prop({ default: false })
    private required: boolean;

    @Prop({ default: false })
    private disabled: boolean;

    @Prop({ default: true })
    private form_control: boolean;

    @Prop({ default: null })
    private value: string;

    @Prop({ default: null })
    private field: SimpleDatatableFieldVO<any, any>;

    @Prop({ default: null })
    private segmentation_type: number;

    @Prop({ default: null })
    private vo: IDistantVOBase;

    private date: Date = null;
    private date_time: string = null;

    private new_value: string = null;

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
            this.date = null;
            this.date_time = null;
            this.new_value = null;
        }
    }

    @Watch('field', { immediate: true })
    private onchange_field() {
        if (!!this.field) {
            if (this.segmentation_type == null) {
                this.segmentation_type_ = this.field.segmentation_type;
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

        if (!this.value) {
            this.date = null;
            this.date_time = null;
            this.new_value = null;
            return;
        }

        let date: moment.Moment = moment(this.value, 'DD/MM/YYYY HH:mm:ss').utc(true);

        if (!date.isValid()) {
            return;
        }

        this.date = date.toDate();

        if (date) {
            this.date_time = date.format(this.format_time);
        }

        this.reload_new_value();
    }

    @Watch('date')
    @Watch('date_time')
    private emitInput(): void {

        let old_new = this.new_value;
        this.reload_new_value();

        /**
         * On check que c'est bien une nouvelle value
         */
        let old_value = this.vo ? this.vo[this.field.datatable_field_uid] : null;
        if (old_value == this.new_value) {
            this.new_value = old_new;
            return;
        }

        this.$emit('input', this.new_value);
        if (!!this.vo) {
            this.$emit('input_with_infos', this.new_value, this.field, this.vo);
        }
    }

    private reload_new_value() {
        this.new_value = null;

        if (this.date) {
            let value: string = DateHandler.getInstance().formatDayForIndex(moment(this.date).utc(true).unix());

            switch (this.segmentation_type_) {
                case TimeSegment.TYPE_YEAR:
                case TimeSegment.TYPE_MONTH:
                case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                case TimeSegment.TYPE_WEEK:
                case TimeSegment.TYPE_DAY:
                    break;
                default:
                    if (this.date_time) {
                        value += this.date_time + ':00';
                    }
            }

            this.new_value = value;
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

    get is_segmentation_second(): boolean {
        return this.segmentation_type_ == TimeSegment.TYPE_SECOND;
    }
}
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../VueComponentBase';
import '../RangeComponent.scss';

@Component({
    template: require('./TSRangeComponent.pug'),
    components: {}
})
export default class TSRangeComponent extends VueComponentBase {

    @Prop({ default: null })
    private range: TSRange;

    get segmented_min(): string {

        if (!this.range) {
            return null;
        }

        switch (this.range.segment_type) {

            case TimeSegment.TYPE_MS:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss_ms(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_SECOND:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_MINUTE:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmm(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_HOUR:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HH(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_DAY:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_WEEK:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_MONTH:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(RangeHandler.getInstance().getSegmentedMin(this.range));
            case TimeSegment.TYPE_YEAR:
                return RangeHandler.getInstance().getSegmentedMin(this.range).year().toString();

            default: return null;
        }
    }

    get segmented_max(): string {

        if (!this.range) {
            return null;
        }

        switch (this.range.segment_type) {

            case TimeSegment.TYPE_MS:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss_ms(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_SECOND:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_MINUTE:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmm(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_HOUR:
                return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HH(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_DAY:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_WEEK:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_MONTH:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonth(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(RangeHandler.getInstance().getSegmentedMax(this.range));
            case TimeSegment.TYPE_YEAR:
                return RangeHandler.getInstance().getSegmentedMax(this.range).year().toString();

            default: return null;
        }
    }
}
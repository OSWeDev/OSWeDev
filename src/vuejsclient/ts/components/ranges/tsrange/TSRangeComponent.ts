import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
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

            case TimeSegment.TYPE_SECOND:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss, false);
            case TimeSegment.TYPE_MINUTE:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmm, false);
            case TimeSegment.TYPE_HOUR:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HH, false);
            case TimeSegment.TYPE_DAY:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD, false);
            case TimeSegment.TYPE_WEEK:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD, false);
            case TimeSegment.TYPE_MONTH:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMM, false);
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return Dates.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD, false);
            case TimeSegment.TYPE_YEAR:
                return Dates.year(RangeHandler.getInstance().getSegmentedMin(this.range)).toString();

            default: return null;
        }
    }

    get segmented_max(): string {

        if (!this.range) {
            return null;
        }

        switch (this.range.segment_type) {

            case TimeSegment.TYPE_SECOND:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss, false);
            case TimeSegment.TYPE_MINUTE:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmm, false);
            case TimeSegment.TYPE_HOUR:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HH, false);
            case TimeSegment.TYPE_DAY:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD, false);
            case TimeSegment.TYPE_WEEK:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD, false);
            case TimeSegment.TYPE_MONTH:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMM, false);
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return Dates.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_YYYYMMDD, false);
            case TimeSegment.TYPE_YEAR:
                return Dates.year(RangeHandler.getInstance().getSegmentedMax(this.range)).toString();

            default: return null;
        }
    }

    get is_MAX_RANGE(): boolean {
        if (!this.range) {
            return false;
        }

        return (RangeHandler.getInstance().getSegmentedMin(this.range) == RangeHandler.MIN_TS) && (RangeHandler.getInstance().getSegmentedMax(this.range) == RangeHandler.MAX_TS);
    }
}